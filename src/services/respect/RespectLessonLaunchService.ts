import { registerPlugin } from '@capacitor/core';
import { PAGES, PortPlugin, isRespectMode } from '../../common/constants';
import { ServiceConfig, APIMode } from '../ServiceConfig';
import { SqliteApi } from '../api/SqliteApi';
import { Util } from '../../utility/util';

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

      const cubaLessonId = getCubaLessonId(launchData.lessonId);
      const serviceConfig = ServiceConfig.getI();
      serviceConfig.switchMode(APIMode.ONEROSTER);
      const launchedLesson =
        (await SqliteApi.getI().getLesson(cubaLessonId)) ??
        (await serviceConfig.apiHandler.getLesson(cubaLessonId));
      // RESPECT's course JSON supplies the legacy Cocos ID. The local lesson
      // catalogue is the authoritative mapping to its playable Lido bundle.
      const lesson = launchedLesson?.lido_lesson_id
        ? launchedLesson
        : ((await SqliteApi.getI().getLessonWithCocosLessonId(
            launchedLesson?.cocos_lesson_id ?? cubaLessonId,
          )) ??
          launchedLesson);
      const playableLessonId = Util.getLessonBundleId(lesson);
      if (!lesson || !playableLessonId) return null;

      const existingBundlePath = await Util.getLessonPath({
        lessonId: playableLessonId,
      });
      if (!existingBundlePath) {
        const downloaded = await Util.downloadZipBundle([lesson]);
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
