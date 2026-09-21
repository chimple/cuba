import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {
  BUNDLE_ZIP_URLS,
  LIDO_COMMON_AUDIO_DIR,
  // Points native Lido to ZIP files bundled inside the APK.
  LOCAL_LESSON_BUNDLES_PATH,
} from '../common/constants';
import { Util } from '../utility/util';
import { ServiceConfig } from '../services/ServiceConfig';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import {
  getBundleZipUrlsForEnv,
  REMOTE_CONFIG_KEYS,
} from '../services/RemoteConfig';
import { getAppSearchParams } from '../utility/routerLocation';
import logger from '../utility/logger';
export async function initializeLidoPlayer(ctx: any) {
  const {
    lessonDetail,
    presentToast,
    push,
    resolveLessonZipUrl,
    resolveLidoPlayerLanguage,
    resolveStudentContext,
    resultsRef,
    setBasePath,
    setCommonAudioPath,
    setIsLoading,
    setIsReady,
    setPlayerLanguage,
    setShowDialogBox,
    setZipUrl,
    state,
  } = ctx;
  resultsRef.current = {};
  setIsLoading(true);
  setIsReady(false);
  setShowDialogBox(false);
  // --- CRITICAL FIX: Clear the global variable pollution ---
  // This ensures that when the new player starts, it doesn't see the
  // path from the PREVIOUS student's language.
  if (typeof window !== 'undefined') {
    window.__LIDO_COMMON_AUDIO_PATH__ = undefined;
  }
  const urlSearchParams = getAppSearchParams();
  const lessonToDownload = lessonDetail;
  const lessonId =
    Util.getLessonBundleId(lessonToDownload) ??
    urlSearchParams.get('lessonid') ??
    state?.lessonId;
  if (!lessonToDownload || !lessonId) {
    presentToast();
    push();
    return;
  }
  // Check for the lesson ZIP packaged by build-open-apk.ts before using the network.
  const hasPackagedZipForLesson = async (id: string) => {
    try {
      return (
        await fetch(
          `${LOCAL_LESSON_BUNDLES_PATH}${encodeURIComponent(id)}.zip`,
          { method: 'HEAD' },
        )
      ).ok;
    } catch {
      return false;
    }
  };

  let playableLessonId = lessonId;
  let packagedZipUrl = `${LOCAL_LESSON_BUNDLES_PATH}${encodeURIComponent(
    playableLessonId,
  )}.zip`;
  let hasPackagedZip = false;
  let downloadedLessonPath: string | null = null;
  const reportedOnline =
    typeof navigator === 'undefined' ? 'unknown' : navigator.onLine;
  if (Capacitor.isNativePlatform()) {
    // A HEAD request avoids downloading the packaged ZIP just to detect it.
    hasPackagedZip = await hasPackagedZipForLesson(playableLessonId);
    downloadedLessonPath = await Util.getLessonPath({
      lessonId: playableLessonId,
    });
  }

  // Keep latest-first behavior: only fall back after the latest asset is
  // unavailable and the normal online download has failed or is unavailable.
  let dow = false;
  if (reportedOnline !== false) {
    dow = await Util.downloadZipBundle(
      [lessonToDownload],
      undefined,
      REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS,
      true,
    );
    if (dow) {
      // The remote download is stored outside the APK. Never select the
      // bundled ZIP after a successful online download.
      hasPackagedZip = false;
      downloadedLessonPath = await Util.getLessonPath({
        lessonId: playableLessonId,
      });
    }
  }

  if (!dow && downloadedLessonPath) {
    dow = true;
  }

  if (!dow && hasPackagedZip) {
    dow = true;
  }

  if (!dow && Capacitor.isNativePlatform()) {
    const previousLessonId = lessonToDownload.previous_lido_lesson_id;
    const previousPackagedZipFound = previousLessonId
      ? await hasPackagedZipForLesson(previousLessonId)
      : false;
    if (previousLessonId && previousPackagedZipFound) {
      playableLessonId = previousLessonId;
      packagedZipUrl = `${LOCAL_LESSON_BUNDLES_PATH}${encodeURIComponent(
        playableLessonId,
      )}.zip`;
      hasPackagedZip = true;
      dow = true;
    }
  }

  if (!dow) {
    presentToast();
    push();
    return;
  }

  const resolvedPlayerLanguage = await resolveLidoPlayerLanguage();
  setPlayerLanguage(resolvedPlayerLanguage);

  if (Capacitor.isNativePlatform()) {
    // Lido accepts the APK ZIP directly, so native extraction is unnecessary.
    if (hasPackagedZip) {
      setZipUrl(packagedZipUrl);
    } else {
      // Remote downloads still produce an extracted external-storage path.
      const path =
        downloadedLessonPath ??
        (await Util.getLessonPath({ lessonId: playableLessonId }));
      if (!path) {
        presentToast();
        push();
        return;
      }
      setBasePath(path);
    }
    try {
      const { student } = await resolveStudentContext();
      const authCurrentUser = ServiceConfig.getI().authHandler
        .currentUser as any;
      const languageId = student?.language_id ?? authCurrentUser?.language_id;
      if (!languageId) {
        throw new Error('[LidoPlayer] Student language_id missing');
      }
      const audioPath = `${LIDO_COMMON_AUDIO_DIR}/${languageId}`;

      let commonAudioUri: Awaited<ReturnType<typeof Filesystem.getUri>>;
      try {
        commonAudioUri = await Filesystem.getUri({
          directory: Directory.Data,
          path: audioPath,
        });
      } catch (firstError) {
        await Util.ensureLidoCommonAudioForStudent(student);
        // small delay to handle async extract race (very common on Android)
        await new Promise((r) => setTimeout(r, 150));
        commonAudioUri = await Filesystem.getUri({
          directory: Directory.Data,
          path: audioPath,
        });
      }
      setCommonAudioPath(Capacitor.convertFileSrc(commonAudioUri.uri));
    } catch (e) {
      logger.error('[LidoPlayer] Failed to resolve common audio path', e);
      presentToast();
      push();
      return;
    }
  } else {
    // Extracted folder support used base-url/xml-path here; web now loads the ZIP directly.
    // const pathBase = `${lidoBaseUrl}${lessonId}/`;
    // const pathXml = `${lidoBaseUrl}${lessonId}/index.xml`;
    // setBasePath(pathBase);
    // setXmlPath(pathXml);
    const explicitZipUrl =
      urlSearchParams.get('zipUrl') ?? state?.zipUrl ?? null;

    if (explicitZipUrl) {
      setZipUrl(explicitZipUrl);
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    const bundleZipUrls = getCachedGrowthBookFeatureValue<string[]>(
      BUNDLE_ZIP_URLS,
      getBundleZipUrlsForEnv(),
    );
    const resolvedZipUrl = await resolveLessonZipUrl(bundleZipUrls, lessonId);
    if (!resolvedZipUrl) {
      logger.error('[LidoPlayer] No working ZIP URL found for lesson');
      presentToast();
      push();
      return;
    }

    setZipUrl(resolvedZipUrl);
  }
  setIsLoading(false);
  setIsReady(true); // ONLY NOW allow the Web Component to mount
}
