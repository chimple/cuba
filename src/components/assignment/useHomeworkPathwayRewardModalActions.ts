import React, { useCallback } from 'react';
import { parsePath } from 'history';

import {
  CONTINUE,
  HOMEWORK_PATHWAY,
  LIVE_QUIZ,
  PAGES,
  REWARD_MODAL_SHOWN_DATE,
  SOURCE,
  TableTypes,
} from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { HomeworkPathLessonItem } from './homeworkPathwayStructureTypes';

interface UseHomeworkPathwayRewardModalActionsParams {
  api: {
    getChapterById: (
      chapterId: string,
    ) => Promise<TableTypes<'chapter'> | undefined>;
    getCourse: (courseId: string) => Promise<TableTypes<'course'> | undefined>;
    getLesson: (lessonId: string) => Promise<TableTypes<'lesson'> | undefined>;
  };
  currentChapter?: TableTypes<'chapter'>;
  currentCourse?: TableTypes<'course'>;
  history: any;
  setCurrentChapter: (chapter: TableTypes<'chapter'>) => void;
  setCurrentCourse: (course: TableTypes<'course'>) => void;
  setRewardModalOpen: (open: boolean) => void;
}

export const useHomeworkPathwayRewardModalActions = ({
  api,
  currentChapter,
  currentCourse,
  history,
  setCurrentChapter,
  setCurrentCourse,
  setRewardModalOpen,
}: UseHomeworkPathwayRewardModalActionsParams) => {
  const handleOpen = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setRewardModalOpen(true);
    },
    [setRewardModalOpen],
  );

  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setRewardModalOpen(false);
      sessionStorage.setItem(
        REWARD_MODAL_SHOWN_DATE,
        new Date().toISOString(),
      );
    },
    [setRewardModalOpen],
  );

  const handleOnPlay = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setRewardModalOpen(false);
      sessionStorage.setItem(
        REWARD_MODAL_SHOWN_DATE,
        new Date().toISOString(),
      );
      try {
        const storedHomeworkPath = localStorage.getItem(HOMEWORK_PATHWAY);
        if (!storedHomeworkPath) return;

        const homeworkPath = JSON.parse(storedHomeworkPath) as {
          lessons: HomeworkPathLessonItem[];
          currentIndex: number;
        };

        const activeLessonItem =
          homeworkPath.lessons?.[homeworkPath.currentIndex];
        if (!activeLessonItem) return;
        const fallbackLessonId = activeLessonItem.lesson?.id;
        if (!fallbackLessonId && !activeLessonItem.lesson?.plugin_type) return;

        const lesson =
          activeLessonItem.lesson?.id && activeLessonItem.lesson?.plugin_type
            ? activeLessonItem.lesson
            : await api.getLesson(fallbackLessonId as string);

        if (!lesson) return;

        const courseDocId = activeLessonItem.course_id;
        const chapterDocId = activeLessonItem.chapter_id;

        if (!courseDocId || !chapterDocId) {
          logger.warn(
            'Skipping homework lesson launch because course/chapter identifiers are missing.',
          );
          return;
        }

        if (!currentCourse || currentCourse.id !== courseDocId) {
          try {
            const course = await api.getCourse(courseDocId);
            if (course) setCurrentCourse(course);
          } catch (error) {
            logger.warn('Failed to refresh homework reward course', error);
          }
        }

        if (!currentChapter || currentChapter.id !== chapterDocId) {
          try {
            const chapter = await api.getChapterById(chapterDocId);
            if (chapter) setCurrentChapter(chapter);
          } catch (error) {
            logger.warn('Failed to refresh homework reward chapter', error);
          }
        }

        const nextCourse =
          currentCourse?.id === courseDocId
            ? currentCourse
            : await api.getCourse(courseDocId).catch(() => currentCourse);
        const nextChapter =
          currentChapter?.id === chapterDocId
            ? currentChapter
            : await api.getChapterById(chapterDocId).catch(() => currentChapter);

        if (lesson.plugin_type === LIVE_QUIZ) {
          history.push({
            ...parsePath(
              PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
            ),
            state: {
              courseId: courseDocId,
              lesson: JSON.stringify(lesson),
              from: history.location.pathname + `?${CONTINUE}=true`,
              isHomework: true,
              homeworkIndex: homeworkPath.currentIndex,
              reward: true,
              source: SOURCE.LEARNING_PATHWAY_HOMEWORK,
            },
          });
        } else {
          const playableLessonId = Util.getLessonBundleId(lesson);
          if (!playableLessonId) {
            return;
          }
          const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${playableLessonId}`;
          history.push({
            ...parsePath(PAGES.LIDO_PLAYER + params),
            state: {
              lessonId: playableLessonId,
              courseDocId,
              course: JSON.stringify(nextCourse),
              lesson: JSON.stringify(lesson),
              chapter: JSON.stringify(nextChapter),
              from: history.location.pathname + `?${CONTINUE}=true`,
              isHomework: true,
              homeworkIndex: homeworkPath.currentIndex,
              reward: true,
              source: SOURCE.LEARNING_PATHWAY_HOMEWORK,
            },
          });
        }
      } catch (error) {
        logger.error('Error in playLesson:', error);
      }
    },
    [
      api,
      currentChapter,
      currentCourse,
      history,
      setCurrentChapter,
      setCurrentCourse,
      setRewardModalOpen,
    ],
  );

  return {
    handleClose,
    handleOnPlay,
    handleOpen,
  };
};
