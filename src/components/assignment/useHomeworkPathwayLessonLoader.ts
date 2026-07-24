import { useCallback } from 'react';

import {
  HOMEWORK_PATHWAY,
  HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
  LIVE_QUIZ,
  PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
  TableTypes,
} from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { hasPendingHomeworkStickerFlow } from '../../utility/homeworkStickerFlow';
import {
  HomeworkPathLessonItem,
  HomeworkPathwayLesson,
  HomeworkStoredPathItem,
  PendingHomeworkRewardTransition,
} from './homeworkPathwayStructureTypes';

interface UseHomeworkPathwayLessonLoaderParams {
  api: {
    getCompletedAssignmentsCountForSubjects: (
      studentId: string,
      subjectIds: string[],
    ) => Promise<Array<{ subject_id: string; completed_count: number }>>;
    getPendingAssignments: (
      classId: string,
      studentId: string,
    ) => Promise<Array<TableTypes<'assignment'>>>;
  };
  getCachedLesson: (lessonId: string) => Promise<HomeworkPathwayLesson | null>;
  onHomeworkComplete?: () => void;
  setHomeworkLessons: (lessons: HomeworkPathLessonItem[]) => void;
}

export const useHomeworkPathwayLessonLoader = ({
  api,
  getCachedLesson,
  onHomeworkComplete,
  setHomeworkLessons,
}: UseHomeworkPathwayLessonLoaderParams) => {
  const getPendingRewardTransition = useCallback(() => {
    const rawTransition = sessionStorage.getItem(
      PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
    );
    if (!rawTransition) return null;
    try {
      const parsed = JSON.parse(
        rawTransition,
      ) as PendingHomeworkRewardTransition;
      if (typeof parsed.pathSnapshot !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const fetchHomeworkLessons = useCallback(async () => {
    try {
      const hasPendingStickerFlow = hasPendingHomeworkStickerFlow();
      const rewardCompletedIndexRaw = sessionStorage.getItem(
        HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
      );
      const hasValidRewardCompletedIndex =
        rewardCompletedIndexRaw !== null &&
        /^-?\d+$/.test(rewardCompletedIndexRaw);
      const pendingRewardTransition = getPendingRewardTransition();
      const hasPendingRewardTransition =
        hasValidRewardCompletedIndex &&
        pendingRewardTransition !== null &&
        typeof pendingRewardTransition.completedIndex === 'number' &&
        Number.isFinite(pendingRewardTransition.completedIndex) &&
        Number(rewardCompletedIndexRaw) ===
          pendingRewardTransition.completedIndex;

      const normalizeLessonShape = (
        item: HomeworkStoredPathItem,
        fallbackLessons: HomeworkStoredPathItem[],
      ): HomeworkPathLessonItem => {
        const typedItem = item;
        if (typedItem.lesson && typedItem.lesson.id) return typedItem;

        return {
          ...typedItem,
          lesson: {
            id: typedItem.lesson_id ?? '',
            image: 'assets/icons/DefaultIcon.png',
            subject_id:
              typedItem.subject_id ||
              (fallbackLessons[0] as HomeworkPathLessonItem | undefined)?.lesson
                ?.subject_id ||
              null,
          },
          assignment_id: typedItem.assignment_id ?? typedItem.id,
          chapter_id: typedItem.chapter_id,
          course_id: typedItem.course_id,
          raw_assignment: typedItem.raw_assignment,
        };
      };

      if (hasPendingRewardTransition && pendingRewardTransition?.pathSnapshot) {
        try {
          const snapshotPath = JSON.parse(
            pendingRewardTransition.pathSnapshot,
          ) as {
            lessons?: HomeworkStoredPathItem[];
          };
          const snapshotLessons = snapshotPath.lessons ?? [];
          if (snapshotLessons.length > 0) {
            setHomeworkLessons(
              snapshotLessons.map((item) =>
                normalizeLessonShape(item, snapshotLessons),
              ),
            );
            return;
          }
        } catch (error) {
          logger.warn('Invalid pending reward transition snapshot', error);
        }
      }

      const existingPathStr = localStorage.getItem(HOMEWORK_PATHWAY);
      if (existingPathStr) {
        try {
          const existingPath = JSON.parse(existingPathStr) as {
            lessons?: HomeworkStoredPathItem[];
            currentIndex?: number;
          };

          const lessons = existingPath.lessons ?? [];
          const hasLessons = lessons.length > 0;
          const notFinished =
            typeof existingPath.currentIndex === 'number' &&
            existingPath.currentIndex < lessons.length;

          if (
            hasLessons &&
            (notFinished ||
              hasPendingRewardTransition ||
              (hasPendingStickerFlow && !notFinished))
          ) {
            setHomeworkLessons(
              lessons.map((item) => normalizeLessonShape(item, lessons)),
            );
            return;
          }

          if (hasPendingRewardTransition || hasPendingStickerFlow) {
            return;
          }

          localStorage.removeItem(HOMEWORK_PATHWAY);
        } catch (err) {
          logger.warn('Invalid cached path, rebuilding...', err);
          if (hasPendingRewardTransition) {
            return;
          }
          localStorage.removeItem(HOMEWORK_PATHWAY);
        }
      }

      if (hasPendingRewardTransition) {
        onHomeworkComplete?.();
        return;
      }

      const currentStudent = Util.getCurrentStudent();
      const currClass = Util.getCurrentClass();
      if (!currentStudent?.id || !currClass?.id) return;

      const all = await api.getPendingAssignments(
        currClass?.id,
        currentStudent.id,
      );
      const pendingAssignments = all.filter((a) => a.type !== LIVE_QUIZ);

      if (!pendingAssignments || pendingAssignments.length === 0) {
        setHomeworkLessons([]);
        if (!hasPendingStickerFlow) {
          onHomeworkComplete?.();
        }
        return;
      }

      const playablePendingAssignments: Array<
        TableTypes<'assignment'> & { lesson: HomeworkPathwayLesson }
      > = [];
      const pendingBySubject: Record<
        string,
        Array<TableTypes<'assignment'> & { lesson: HomeworkPathwayLesson }>
      > = {};
      for (const assignment of pendingAssignments) {
        if (!assignment.lesson_id) continue;
        const lesson = await getCachedLesson(assignment.lesson_id);
        const subjectId = lesson?.subject_id;
        if (!subjectId) continue;
        const playableAssignment = { ...assignment, lesson };
        playablePendingAssignments.push(playableAssignment);
        if (!pendingBySubject[subjectId]) pendingBySubject[subjectId] = [];
        pendingBySubject[subjectId].push(playableAssignment);
      }

      if (playablePendingAssignments.length === 0) {
        localStorage.removeItem(HOMEWORK_PATHWAY);
        setHomeworkLessons([]);
        if (!hasPendingStickerFlow) {
          onHomeworkComplete?.();
        }
        return;
      }

      let maxPending = 0;
      let subjectsWithMaxPending: string[] = [];
      Object.keys(pendingBySubject).forEach((subject) => {
        const length = pendingBySubject[subject].length;
        if (length > maxPending) {
          maxPending = length;
          subjectsWithMaxPending = [subject];
        } else if (length === maxPending) {
          subjectsWithMaxPending.push(subject);
        }
      });

      let completedCountBySubject: { [key: string]: number } = {};
      if (subjectsWithMaxPending.length > 1) {
        try {
          const completedCounts =
            await api.getCompletedAssignmentsCountForSubjects(
              currentStudent.id,
              subjectsWithMaxPending,
            );
          completedCountBySubject = completedCounts.reduce(
            (acc, { subject_id, completed_count }) => {
              acc[subject_id] = completed_count;
              return acc;
            },
            {} as { [key: string]: number },
          );
        } catch (e) {
          logger.warn('Could not fetch completed counts (offline)', e);
        }
      }

      const selected = Util.pickFiveHomeworkLessons(
        playablePendingAssignments,
        completedCountBySubject,
      );

      const lessonsWithDetails = await Promise.all(
        selected.map(async (assignment) => {
          const lesson = await getCachedLesson(assignment.lesson_id);
          if (
            !lesson?.id ||
            !lesson.subject_id ||
            !(lesson.chapter_id || assignment.chapter_id) ||
            !(assignment.course_id || lesson.course_id)
          ) {
            logger.warn(
              '[HomeworkPathwayStructure] Skipping stale homework assignment with missing lesson metadata',
              {
                assignmentId: assignment.id ?? null,
                lessonId: assignment.lesson_id ?? null,
              },
            );
            return null;
          }
          return { ...assignment, lesson };
        }),
      );
      const playableLessons = lessonsWithDetails.filter(
        (lesson): lesson is NonNullable<(typeof lessonsWithDetails)[number]> =>
          lesson !== null,
      );

      if (playableLessons.length === 0) {
        localStorage.removeItem(HOMEWORK_PATHWAY);
        setHomeworkLessons([]);
        if (!hasPendingStickerFlow) {
          onHomeworkComplete?.();
        }
        return;
      }

      const newHomeworkPath = {
        lessons: playableLessons,
        currentIndex: 0,
      };

      localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(newHomeworkPath));
      setHomeworkLessons(playableLessons);
    } catch (error) {
      logger.error('Failed to fetch homework lessons:', error);
      setHomeworkLessons([]);
    }
  }, [
    api,
    getCachedLesson,
    getPendingRewardTransition,
    onHomeworkComplete,
    setHomeworkLessons,
  ]);

  return {
    fetchHomeworkLessons,
    getPendingRewardTransition,
  };
};
