import {
  LATEST_LEARNING_PATH,
  REWARD_LEARNING_PATH,
  STICKER_PROGRESS_TOTAL,
} from '../../common/constants';
import type { TableTypes } from '../../common/constants';
import { Util } from '../../utility/util';
import type { LearningPathCourse, LearningPathData } from './scoreCardTypes';

const parseLearningPath = (value: unknown): LearningPathData | null => {
  if (typeof value !== 'string' || !value) return null;

  try {
    return JSON.parse(value) as LearningPathData;
  } catch {
    return null;
  }
};

const getCourseList = (learningPath: LearningPathData | null | undefined) => {
  const courseList = learningPath?.courses?.courseList;
  return Array.isArray(courseList) ? courseList : [];
};

const findCourseByCourseId = (
  courseList: LearningPathCourse[],
  completedCourseId?: string,
) => {
  if (!completedCourseId) return null;

  return (
    courseList.find((course) => course?.course_id === completedCourseId) ?? null
  );
};

const findCourseByLessonId = (
  courseList: LearningPathCourse[],
  completedLessonId?: string,
) => {
  if (!completedLessonId) return null;

  return (
    courseList.find((course) =>
      Array.isArray(course?.path)
        ? course.path.some((lesson) => lesson?.lesson_id === completedLessonId)
        : false,
    ) ?? null
  );
};

const getCurrentCourseFromIndex = (learningPath: LearningPathData) => {
  const courseList = getCourseList(learningPath);
  const currentCourseIndex = learningPath.courses?.currentCourseIndex;
  return typeof currentCourseIndex === 'number'
    ? (courseList[currentCourseIndex] ?? null)
    : (courseList[0] ?? null);
};

const getProgressCourse = ({
  completedCourseId,
  completedLessonId,
  learningPath,
  requireMatch = false,
}: {
  completedCourseId?: string;
  completedLessonId?: string;
  learningPath: LearningPathData;
  requireMatch?: boolean;
}) => {
  const courseList = getCourseList(learningPath);
  const matchedCourse =
    findCourseByCourseId(courseList, completedCourseId) ??
    findCourseByLessonId(courseList, completedLessonId);

  if (matchedCourse) return matchedCourse;
  if (requireMatch) return null;

  return getCurrentCourseFromIndex(learningPath);
};

const readStoredLearningPath = (
  studentId?: string,
): LearningPathData | null => {
  if (typeof localStorage === 'undefined' || !studentId) return null;

  try {
    const storedValue = localStorage.getItem(
      LATEST_LEARNING_PATH + ':' + studentId,
    );
    if (!storedValue) return null;

    const parsed = JSON.parse(storedValue);
    if (parsed?.studentId !== studentId) return null;

    return parseLearningPath(parsed?.learningPath);
  } catch {
    return null;
  }
};

const getFallbackLearningPath = (
  student?: TableTypes<'user'>,
): LearningPathData | null => {
  if (!student) return null;

  return (
    readStoredLearningPath(student.id) ??
    parseLearningPath(student.learning_path)
  );
};

const hasRewardSnapshot = () => {
  return (
    typeof sessionStorage !== 'undefined' &&
    Boolean(sessionStorage.getItem(REWARD_LEARNING_PATH))
  );
};

const resolveProgressLearningPath = ({
  student,
  completedCourseId,
  completedLessonId,
}: {
  student?: TableTypes<'user'>;
  completedCourseId?: string;
  completedLessonId?: string;
}) => {
  const latestLearningPath = parseLearningPath(
    student ? Util.getLatestLearningPathByUpdatedAt(student) : null,
  );
  if (!latestLearningPath) return null;

  if (!completedCourseId && !completedLessonId) {
    return getFallbackLearningPath(student) ?? latestLearningPath;
  }

  const latestMatchedCourse = getProgressCourse({
    completedCourseId,
    completedLessonId,
    learningPath: latestLearningPath,
    requireMatch: true,
  });
  if (latestMatchedCourse) return latestLearningPath;
  if (!hasRewardSnapshot()) return latestLearningPath;

  const fallbackLearningPath = getFallbackLearningPath(student);
  if (!fallbackLearningPath) return latestLearningPath;

  const fallbackMatchedCourse = getProgressCourse({
    completedCourseId,
    completedLessonId,
    learningPath: fallbackLearningPath,
    requireMatch: true,
  });

  return fallbackMatchedCourse ? fallbackLearningPath : latestLearningPath;
};

export const getCurrentPathwayStickerProgress = ({
  student,
  completedCourseId,
  completedLessonId,
  completedHomeworkIndex,
  countCompletedLessonTowardStickerProgress = true,
  allowZeroStickerProgress = false,
  stickerProgressCurrentOverride,
}: {
  student?: TableTypes<'user'>;
  completedCourseId?: string;
  completedLessonId?: string;
  completedHomeworkIndex?: number;
  countCompletedLessonTowardStickerProgress?: boolean;
  allowZeroStickerProgress?: boolean;
  stickerProgressCurrentOverride?: number;
}): { current: number; total: number } => {
  const minProgress = allowZeroStickerProgress ? 0 : 1;

  if (typeof stickerProgressCurrentOverride === 'number') {
    return {
      current: Math.min(
        Math.max(stickerProgressCurrentOverride, minProgress),
        STICKER_PROGRESS_TOTAL,
      ),
      total: STICKER_PROGRESS_TOTAL,
    };
  }

  if (
    typeof completedHomeworkIndex === 'number' &&
    typeof localStorage !== 'undefined'
  ) {
    try {
      const hwStr = localStorage.getItem('homework_pathway');
      if (hwStr) {
        const hwPath = JSON.parse(hwStr);
        const total = Array.isArray(hwPath?.lessons)
          ? hwPath.lessons.length
          : STICKER_PROGRESS_TOTAL;
        const current = completedHomeworkIndex + 1;
        return {
          current: Math.min(Math.max(current, 0), total),
          total,
        };
      }
    } catch {
      // ignore parse errors
    }
  }

  if (typeof completedHomeworkIndex === 'number') {
    return {
      current: Math.min(
        Math.max(completedHomeworkIndex + 1, minProgress),
        STICKER_PROGRESS_TOTAL,
      ),
      total: STICKER_PROGRESS_TOTAL,
    };
  }

  if (!student) return { current: minProgress, total: STICKER_PROGRESS_TOTAL };

  try {
    const learningPath = resolveProgressLearningPath({
      student,
      completedCourseId,
      completedLessonId,
    });
    if (!learningPath) {
      return { current: minProgress, total: STICKER_PROGRESS_TOTAL };
    }

    const progressCourse = getProgressCourse({
      completedCourseId,
      completedLessonId,
      learningPath,
    });
    const lessons =
      progressCourse && Array.isArray(progressCourse.path)
        ? progressCourse.path
        : [];
    const total = STICKER_PROGRESS_TOTAL;
    const playedCount = lessons.filter((lesson) => lesson?.isPlayed).length;
    const completedLessonIndex = completedLessonId
      ? lessons.findIndex((lesson) => lesson?.lesson_id === completedLessonId)
      : -1;

    if (
      countCompletedLessonTowardStickerProgress &&
      completedLessonIndex >= 0
    ) {
      return {
        current: Math.min(
          Math.max(completedLessonIndex + 1, minProgress),
          total,
        ),
        total,
      };
    }

    const completedLessonStillPending = completedLessonId
      ? lessons.some(
          (lesson) =>
            lesson?.lesson_id === completedLessonId &&
            lesson?.isPlayed !== true,
        )
      : false;
    const shouldCountCompletedLesson =
      countCompletedLessonTowardStickerProgress && completedLessonStillPending;
    const effectivePlayedCount =
      playedCount + (shouldCountCompletedLesson ? 1 : 0);

    return {
      current: Math.min(Math.max(effectivePlayedCount, minProgress), total),
      total,
    };
  } catch {
    return { current: minProgress, total: STICKER_PROGRESS_TOTAL };
  }
};
