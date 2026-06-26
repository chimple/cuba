import { TableTypes } from '../../common/constants';

/**
 * Represents a lesson shape that can be safely stored inside the homework path.
 */
export type HomeworkPathwayLesson = Partial<TableTypes<'lesson'>> & {
  chapter_id?: string | null;
  course_id?: string | null;
};

/**
 * Represents a pending homework assignment enriched with lesson data when available.
 */
export type HomeworkPathwayAssignment = Partial<TableTypes<'assignment'>> & {
  assignment_id?: string | null;
  lesson?: HomeworkPathwayLesson | null;
  subject_id?: string | null;
};

/**
 * Represents one node inside the persisted homework pathway.
 */
export type HomeworkPathwayItem = {
  assignment_id?: string | null;
  id?: string | null;
  lesson_id?: string | null;
  chapter_id?: string | null;
  course_id?: string | null;
  lesson?: HomeworkPathwayLesson | null;
  raw_assignment?: HomeworkPathwayAssignment;
};

/**
 * Fetches each unique lesson once so stale-homework validation does not issue
 * duplicate API requests when multiple assignments point at the same lesson.
 */
export const fetchLessonsById = async <
  TLesson extends HomeworkPathwayLesson = HomeworkPathwayLesson,
>(
  lessonIds: Array<string | null | undefined>,
  getLesson: (lessonId: string) => Promise<TLesson | null | undefined>,
): Promise<Map<string, TLesson>> => {
  const uniqueLessonIds = Array.from(
    new Set(lessonIds.filter((id): id is string => !!id)),
  );

  const lessonEntries = await Promise.all(
    uniqueLessonIds.map(async (lessonId) => {
      const lesson = await getLesson(lessonId);
      return [lessonId, lesson?.id ? lesson : null] as const;
    }),
  );

  return lessonEntries.reduce<Map<string, TLesson>>(
    (lessonMap, [lessonId, lesson]) => {
      if (lesson) lessonMap.set(lessonId, lesson);
      return lessonMap;
    },
    new Map(),
  );
};

/**
 * Represents the stored homework path along with progress metadata.
 */
export interface HomeworkPath {
  path_id: string;
  lessons: HomeworkPathwayItem[];
  currentIndex: number;
  pendingAssignmentIds?: string[];
  isPlaceholderSnapshot?: boolean;
}

/**
 * Compares two string arrays in order so we can detect real pathway changes.
 */
export const areStringArraysEqual = (
  left: string[] = [],
  right: string[] = [],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

/**
 * Normalizes assignment identifiers because some stored items use `id` and others use `assignment_id`.
 */
export const getHomeworkAssignmentId = (
  assignment?: HomeworkPathwayAssignment | HomeworkPathwayItem | null,
): string | null => {
  const rawId = assignment?.assignment_id ?? assignment?.id ?? null;
  return rawId ? String(rawId) : null;
};

/**
 * Rebuilds the playable tail of the path from the latest pending assignments.
 * Completed nodes before `currentIndex` are preserved, and new assignments are
 * allowed to fill starting exactly at `currentIndex`.
 */
export const mergeHomeworkPathWithPendingAssignments = async (
  existingPath: HomeworkPath,
  pendingAssignments: HomeworkPathwayAssignment[],
  pendingAssignmentIds: string[],
  normalizeAssignment: (
    assignment: HomeworkPathwayAssignment,
  ) => Promise<HomeworkPathwayItem | null>,
): Promise<HomeworkPath> => {
  // Keep every completed lesson before the active index exactly as-is.
  const completedCount = Math.min(
    Math.max(existingPath.currentIndex ?? 0, 0),
    existingPath.lessons.length,
  );
  const completedLessons = existingPath.lessons.slice(0, completedCount);
  const remainingSlots = Math.max(5 - completedLessons.length, 0);

  // Prevent already completed assignments from being reinserted into the queue.
  const completedAssignmentIds = new Set(
    completedLessons
      .map((lesson) => getHomeworkAssignmentId(lesson))
      .filter((assignmentId): assignmentId is string => !!assignmentId),
  );

  // Preserve the latest server order so newly assigned work can appear at the active slot.
  const mergedPendingAssignments: HomeworkPathwayAssignment[] = [];
  const usedAssignmentIds = new Set<string>();

  pendingAssignments.forEach((assignment) => {
    if (mergedPendingAssignments.length >= remainingSlots) return;

    const assignmentId = getHomeworkAssignmentId(assignment);
    if (
      !assignmentId ||
      completedAssignmentIds.has(assignmentId) ||
      usedAssignmentIds.has(assignmentId)
    ) {
      return;
    }

    mergedPendingAssignments.push(assignment);
    usedAssignmentIds.add(assignmentId);
  });

  // Normalize the final playable slice before saving it back to local storage.
  const normalizedPendingLessons = (
    await Promise.all(
      mergedPendingAssignments
        .slice(0, remainingSlots)
        .map(async (assignment) => normalizeAssignment(assignment)),
    )
  ).filter((lesson): lesson is HomeworkPathwayItem => lesson !== null);

  return {
    ...existingPath,
    lessons: [...completedLessons, ...normalizedPendingLessons],
    currentIndex: Math.min(
      completedCount,
      completedLessons.length + normalizedPendingLessons.length,
    ),
    pendingAssignmentIds,
  };
};

/**
 * Removes homework nodes that no longer have enough lesson metadata to be played.
 */
export const filterPlayableHomeworkItems = (
  lessons: Array<HomeworkPathwayItem | null | undefined>,
): HomeworkPathwayItem[] =>
  lessons.filter((lesson): lesson is HomeworkPathwayItem => {
    if (!lesson) return false;

    const lessonId = lesson.lesson_id ?? lesson.lesson?.id ?? null;
    return Boolean(lessonId && lesson.lesson?.id);
  });

/**
 * Detects whether the stored path actually changed before we overwrite local storage.
 */
export const hasHomeworkPathChanged = (
  left: HomeworkPath,
  right: HomeworkPath,
): boolean => {
  if (left.currentIndex !== right.currentIndex) return true;
  if (
    !areStringArraysEqual(
      left.pendingAssignmentIds ?? [],
      right.pendingAssignmentIds ?? [],
    )
  ) {
    return true;
  }
  if (left.lessons.length !== right.lessons.length) return true;

  return left.lessons.some((lesson, index) => {
    return (
      getHomeworkAssignmentId(lesson) !==
      getHomeworkAssignmentId(right.lessons[index])
    );
  });
};
