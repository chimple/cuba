import { registerPlugin } from '@capacitor/core';
import {
  PAGES,
  PortPlugin,
  TableTypes,
  isRespectMode,
} from '../../common/constants';
import { ServiceConfig, APIMode } from '../ServiceConfig';
import { SqliteApi } from '../api/SqliteApi';
import { REMOTE_CONFIG_KEYS } from '../RemoteConfig';
import { Util } from '../../utility/util';
import { ScreenOrientation } from '../../utility/screenOrientation';

export interface RespectLessonLaunch {
  pathname: PAGES;
  search: string;
  state: {
    courseDocId: string;
    lesson: string;
  };
}

const portPlugin = registerPlugin<PortPlugin>('Port');
let receivedRespectLessonLaunch = false;

/**
 * A RESPECT launch owns the surrounding navigation. Finishing Chimple returns
 * the learner to the lesson list that launched it instead of Cuba's home page.
 */
export const returnToRespectIfNeeded = async (): Promise<boolean> => {
  if (!Util.isRespectMode) return false;

  try {
    await portPlugin.returnDataToRespect();
    return true;
  } catch {
    return false;
  }
};

export const wasRespectLessonLaunchReceived = (): boolean =>
  receivedRespectLessonLaunch;

const getCubaLessonId = (activityId: string): string => {
  let lessonId = activityId;

  try {
    while (true) {
      const url = new URL(lessonId);
      const queryLessonId = url.searchParams.get('activity_id');
      if (!queryLessonId) {
        const pathSegments = url.pathname.split('/').filter(Boolean);
        return pathSegments[pathSegments.length - 1] ?? lessonId;
      }

      lessonId = queryLessonId;
    }
  } catch {
    return lessonId;
  }
};

const createRespectBundleLesson = (
  chimpleLessonId: string,
): TableTypes<'lesson'> => {
  const isLidoLesson = chimpleLessonId.startsWith('LIDO_');

  // RESPECT supplies this mapping in the signed launch URL. It lets Cuba
  // download a bundle even before its own offline lesson catalogue is ready.
  return {
    id: chimpleLessonId,
    cocos_lesson_id: isLidoLesson ? null : chimpleLessonId,
    lido_lesson_id: isLidoLesson ? chimpleLessonId : null,
    cocos_subject_code: null,
    cocos_chapter_code: null,
    version: null,
  } as TableTypes<'lesson'>;
};

/**
 * RESPECT starts Cuba through an Android App Link without a Cuba login session.
 * Bootstrap the RESPECT learner before navigating so protected lesson routes do
 * not redirect the learner to Cuba's regular login screen.
 */
export const prepareRespectLessonLaunch =
  async (): Promise<RespectLessonLaunch | null> => {
    try {
      const launchData = await portPlugin.sendLaunchData();
      if (!launchData.lessonId) return null;

      receivedRespectLessonLaunch = true;
      localStorage.setItem(isRespectMode, 'true');
      // Rotate before downloading so the lesson never flashes in portrait.
      await ScreenOrientation.lock({ orientation: 'landscape' });

      // The xAPI activity remains canonical while the launch supplies the
      // playable Cuba bundle ID needed by the local offline catalogue.
      const cubaLessonId = launchData.chimpleLessonId || getCubaLessonId(launchData.lessonId);
      const serviceConfig = ServiceConfig.getI();
      serviceConfig.switchMode(APIMode.ONEROSTER);
      const launchedLesson =
        (await SqliteApi.getI().getLesson(cubaLessonId)) ??
        (await SqliteApi.getI().getLessonWithCocosLessonId(cubaLessonId)) ??
        (launchData.chimpleLessonId
          ? undefined
          : await serviceConfig.apiHandler.getLesson(cubaLessonId));
      // RESPECT's course JSON supplies the legacy Cocos ID. The local lesson
      // catalogue is the authoritative mapping to its playable Lido bundle.
      const resolvedLesson =
        (launchedLesson?.lido_lesson_id
          ? launchedLesson
          : ((await SqliteApi.getI().getLessonWithCocosLessonId(
              launchedLesson?.cocos_lesson_id ?? cubaLessonId,
            )) ??
            launchedLesson)) ??
        (launchData.chimpleLessonId
          ? createRespectBundleLesson(launchData.chimpleLessonId)
          : null);
      // RESPECT sends the exact Lido bundle ID. Clear the legacy Cocos ID so
      // LidoPlayer cannot select it ahead of the RESPECT-provided bundle.
      const lesson = launchData.chimpleLessonId.startsWith('LIDO_')
        ? {
            ...(resolvedLesson ?? createRespectBundleLesson(launchData.chimpleLessonId)),
            cocos_lesson_id: null,
            lido_lesson_id: launchData.chimpleLessonId,
          }
        : resolvedLesson;
      if (!lesson) return null;

      const playableLessonId = Util.getLessonBundleId(lesson);
      if (!playableLessonId) return null;

      const existingBundlePath = await Util.getLessonPath({
        lessonId: playableLessonId,
      });
      if (!existingBundlePath) {
        const downloaded = await Util.downloadZipBundle(
          [lesson],
          undefined,
          REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS,
        );
        const downloadedBundlePath = await Util.getLessonPath({
          lessonId: playableLessonId,
        });
        if (!downloaded || !downloadedBundlePath) return null;
      }

      await serviceConfig.apiHandler.createDeeplinkUser();

      const search = new URLSearchParams({
        courseid: lesson.cocos_subject_code ?? '',
        chapterid: lesson.cocos_chapter_code ?? '',
        lessonid: playableLessonId,
      }).toString();

      return {
        pathname: PAGES.LIDO_PLAYER,
        search: `?${search}`,
        state: {
          courseDocId: lesson.cocos_subject_code ?? '',
          lesson: JSON.stringify(lesson),
        },
      };
    } catch {
      return null;
    }
  };
