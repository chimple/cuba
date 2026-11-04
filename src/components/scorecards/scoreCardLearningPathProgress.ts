import {
  AssignmentSource,
  LATEST_LEARNING_PATH,
  REWARD_LEARNING_PATH,
  STICKER_PROGRESS_TOTAL,
} from '../../common/constants';
import type { TableTypes } from '../../common/constants';
import { Util } from '../../utility/util';
import type {
  LearningPathCourse,
  LearningPathData,
  PathwayGoalAssignment,
} from './scoreCardTypes';

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
  completedAssignmentId,
  completedHomeworkIndex,
  countCompletedLessonTowardStickerProgress = true,
  allowZeroStickerProgress = false,
  stickerProgressCurrentOverride,
  pathwayAssignments,
}: {
  student?: TableTypes<'user'>;
  completedCourseId?: string;
  completedLessonId?: string;
  completedAssignmentId?: string;
  completedHomeworkIndex?: number;
  countCompletedLessonTowardStickerProgress?: boolean;
  allowZeroStickerProgress?: boolean;
  stickerProgressCurrentOverride?: number;
  pathwayAssignments?: PathwayGoalAssignment[];
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
    pathwayAssignments
  ) {
    // Campaign assignments have their own goal and must not advance sticker progress.
    const isCampaignAssignment = (assignment: PathwayGoalAssignment) =>
      assignment.source === AssignmentSource.CAMPAIGN ||
      Boolean(assignment.campaignId);
    const normalAssignments = pathwayAssignments.filter(
      (assignment) =>
        assignment.assignmentId && !isCampaignAssignment(assignment),
    );
    const completedNormalAssignments = pathwayAssignments
      .slice(0, completedHomeworkIndex + 1)
      .filter(
        (assignment) =>
          assignment.assignmentId && !isCampaignAssignment(assignment),
      ).length;
    const total = Math.min(
      normalAssignments.length || STICKER_PROGRESS_TOTAL,
      STICKER_PROGRESS_TOTAL,
    );

    return { current: Math.min(completedNormalAssignments, total), total };
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

  const campaignAssignmentIds = new Set(
    (pathwayAssignments ?? [])
      .filter(
        (assignment) =>
          assignment.source === AssignmentSource.CAMPAIGN ||
          Boolean(assignment.campaignId),
      )
      .map((assignment) => assignment.assignmentId)
      .filter((id): id is string => Boolean(id)),
  );
  const campaignLessonIds = new Set(
    (pathwayAssignments ?? [])
      .filter(
        (assignment) =>
          assignment.source === AssignmentSource.CAMPAIGN ||
          Boolean(assignment.campaignId),
      )
      .map((assignment) => assignment.lessonId)
      .filter((id): id is string => Boolean(id)),
  );

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
    const normalLessons = lessons.filter((lesson) =>
      lesson?.assignment_id
        ? !campaignAssignmentIds.has(lesson.assignment_id)
        : !campaignLessonIds.has(lesson?.lesson_id ?? ''),
    );
    const playedCount = normalLessons.filter(
      (lesson) => lesson?.isPlayed,
    ).length;
    const completedLessonIndex = completedAssignmentId
      ? normalLessons.findIndex(
          (lesson) => lesson?.assignment_id === completedAssignmentId,
        )
      : completedLessonId
        ? normalLessons.findIndex(
            (lesson) => lesson?.lesson_id === completedLessonId,
          )
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
      ? normalLessons.some(
          (lesson) =>
            (completedAssignmentId
              ? lesson?.assignment_id === completedAssignmentId
              : lesson?.lesson_id === completedLessonId) &&
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
