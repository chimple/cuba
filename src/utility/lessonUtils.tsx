import { PAGES, CONTINUE, PortPlugin } from '../common/constants';
import Lesson from '../models/Lesson';
import Course from '../models/course';
import { Util } from '../utility/util';
import { useHistory } from 'react-router-dom';
import { registerPlugin } from '@capacitor/core';
import { ServiceConfig } from '../services/ServiceConfig';
import logger from './logger';

const portPlugin = registerPlugin<PortPlugin>('Port');

export const useHandleLessonClick = (
  customHistory: ReturnType<typeof useHistory>,
) => {
  return async (
    lesson: Lesson | null,
    isUnlocked: boolean,
    currentCourse: Course | undefined,
    online: boolean,
  ) => {
    if (!isUnlocked) return;

    try {
      const data = await portPlugin.sendLaunchData();
      const api = ServiceConfig.getI().apiHandler;
      const launchedLesson = await api.getLesson(data.lessonId);
      if (!launchedLesson) return;
      const coursesForLesson = launchedLesson.id
        ? await api.getCoursesFromLesson(launchedLesson.id)
        : [];
      const resolvedCourseId =
        coursesForLesson[0]?.id ?? launchedLesson.cocos_subject_code;
      const params = `?courseid=${launchedLesson.cocos_subject_code}&chapterid=${launchedLesson.cocos_chapter_code}&lessonid=${launchedLesson.cocos_lesson_id}`;
      Util.isDeepLink = true;

      customHistory.push(PAGES.LIDO_PLAYER + params, {
        url: 'chimple-lib/index.html' + params,
        lessonId: launchedLesson.cocos_lesson_id,
        courseDocId: resolvedCourseId,
        from: customHistory.location.pathname + `?${CONTINUE}=true`,
      });
    } catch (error) {
      logger.error('[LessonUtils] Failed to open launched lesson', error);
    }
  };
};
