import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { BUNDLE_ZIP_URLS, LIDO_COMMON_AUDIO_DIR } from '../common/constants';
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
    state.lessonId;
  if (!lessonToDownload || !lessonId) {
    presentToast();
    push();
    return;
  }
  const dow = await Util.downloadZipBundle(
    [lessonToDownload],
    undefined,
    REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS,
  );
  if (!dow) {
    presentToast();
    push();
    return;
  }

  const resolvedPlayerLanguage = await resolveLidoPlayerLanguage();
  setPlayerLanguage(resolvedPlayerLanguage);

  if (Capacitor.isNativePlatform()) {
    const path = await Util.getLessonPath({ lessonId: lessonId });
    if (path) {
      setBasePath(path);
    } else {
      presentToast();
      push();
      return;
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

      let commonAudioUri;
      try {
        commonAudioUri = await Filesystem.getUri({
          directory: Directory.Data,
          path: audioPath,
        });
      } catch (firstError) {
        logger.error(
          '[LidoPlayer] Common audio not accessible, retrying once...',
        );
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
      logger.warn('Resolved Lido ZIP URL from override', {
        lessonId,
        zipUrl: explicitZipUrl,
      });
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
      logger.error('[LidoPlayer] No working ZIP URL found for lesson', {
        lessonId,
        featureKey: BUNDLE_ZIP_URLS,
        bundleZipUrls,
      });
      presentToast();
      push();
      return;
    }

    logger.warn('Resolved Lido ZIP URL', {
      lessonId,
      featureKey: BUNDLE_ZIP_URLS,
      bundleZipUrls,
      zipUrl: resolvedZipUrl,
    });
    setZipUrl(resolvedZipUrl);
  }
  setIsLoading(false);
  setIsReady(true); // ONLY NOW allow the Web Component to mount
}
