import { AssignmentSource, TableTypes } from '../../../../common/constants';
import {
  getTrackableIdForItem,
  TRACKABLE_IDS,
  type TrackableId,
} from '../../../../analytics/trackable';
import { Lesson, RecommendedAssignmentsState } from './RecommendedAssignments';

export const getRecommendedAddMoreTrackableId = (
  subjectId: string,
): TrackableId =>
  getTrackableIdForItem(
    TRACKABLE_IDS.TEACHER_RECOMMENDED_ADD_FIVE_MORE_BUTTON,
    subjectId,
  );

export const addNextRecommendedLessons = (
  assignments: RecommendedAssignmentsState,
  subjectId: string,
): RecommendedAssignmentsState | undefined => {
  const subject = assignments[subjectId];
  if (!subject?.allLessons?.length || !subject.lessons.length) return undefined;

  const lastLesson = subject.lessons[subject.lessons.length - 1];
  const lastIndex = subject.allLessons.findIndex(
    (lesson) =>
      lesson.id === lastLesson.id &&
      lesson._chapterId === lastLesson._chapterId,
  );
  if (lastIndex === -1) return undefined;

  const nextFive = subject.allLessons.slice(lastIndex + 1, lastIndex + 6);
  if (!nextFive.length) return undefined;

  return {
    ...assignments,
    [subjectId]: {
      ...subject,
      lessons: [
        ...subject.lessons,
        ...nextFive.map((lesson) => ({
          ...lesson,
          selected: true,
          source: AssignmentSource.RECOMMENDED,
        })),
      ],
    },
  };
};

export const buildRecommendedPayload = (
  recommendedAssignments: RecommendedAssignmentsState,
): {
  selectedAssignments: Record<string, { lessons: Lesson[] }>;
  formattedRecommended: Record<string, { count: string[] }>;
} => {
  const selectedAssignments: Record<string, { lessons: Lesson[] }> = {};
  const formattedRecommended: Record<string, { count: string[] }> = {};

  Object.keys(recommendedAssignments).forEach((subjectId) => {
    const subject = recommendedAssignments[subjectId];

    const selectedLessons = subject.lessons.filter((lesson) => lesson.selected);

    if (!selectedLessons.length) return;

    selectedAssignments[subjectId] = {
      lessons: selectedLessons,
    };

    formattedRecommended[subjectId] = {
      count: selectedLessons.map((lesson) => lesson.id),
    };
  });

  return { selectedAssignments, formattedRecommended };
};
export const getRecommendedLessons = async (
  api: {
    getChaptersForCourse: (
      courseId: string,
    ) => Promise<TableTypes<'chapter'>[]>;
    getLessonsForChapter: (
      chapterId: string,
    ) => Promise<TableTypes<'lesson'>[]>;
    isAssignmentAlreadyAssigned: (
      schoolId: string,
      classId: string,
      courseId: string,
      chapterId: string,
      lessonId: string,
    ) => Promise<boolean>;
  },
  currentClass: {
    id: string;
    school_id: string;
  },
  courseList: TableTypes<'course'>[],
  lastAssignmentsCourseWise: TableTypes<'assignment'>[] | undefined,
): Promise<RecommendedAssignmentsState> => {
  // Object that will store recommended lessons for each course
  const recommended: RecommendedAssignmentsState = {};

  // Loop through each course
  for (const course of courseList) {
    // Initialize course structure
    recommended[course.id] = {
      name: course.name,
      courseCode: course.code!,
      lessons: [],
      allLessons: [],
      sort_index: course.sort_index ?? 0,
      isCollapsed: false,
    };

    // Find last assigned lesson for this course (if any)
    const lastAssignment = lastAssignmentsCourseWise?.find(
      (assignment) => assignment.course_id === course.id,
    );

    // Get all chapters for the course
    const allChapters = await api.getChaptersForCourse(course.id);
    if (!allChapters?.length) continue;

    const allLessons: Lesson[] = [];

    // Fetch lessons from each chapter
    for (const chapter of allChapters) {
      const lessons = await api.getLessonsForChapter(chapter.id);

      // Add lessons to allLessons list
      if (lessons?.length) {
        allLessons.push(
          ...lessons.map((lesson) => ({
            ...lesson,
            _chapterId: chapter.id,
            _chapterName: chapter.name ?? '',
            selected: false,
            source: null,
          })),
        );
      }
    }

    // If no lessons exist, skip this course
    if (!allLessons.length) continue;

    // Store all lessons for reference
    recommended[course.id].allLessons = allLessons;

    let startIndex = 0;

    if (lastAssignment?.lesson_id) {
      const lessonIndex = allLessons.findIndex(
        (lesson) => lesson.id === lastAssignment.lesson_id,
      );

      if (lessonIndex >= 0) {
        startIndex = (lessonIndex + 1) % allLessons.length;
      }
    }

    const nextLessons: Lesson[] = [];

    let i = startIndex;
    let checkedCount = 0;

    while (nextLessons.length < 5 && checkedCount < allLessons.length) {
      const lesson = allLessons[i];
      if (!lesson) break; // extra safety

      const alreadyAssigned = await api.isAssignmentAlreadyAssigned(
        currentClass.school_id,
        currentClass.id,
        course.id,
        lesson._chapterId,
        lesson.id,
      );

      if (!alreadyAssigned) {
        nextLessons.push({
          ...lesson,
          selected: true,
          source: AssignmentSource.RECOMMENDED,
        });
      }

      i = (i + 1) % allLessons.length;
      checkedCount++;
    }
    // Save recommended lessons for this course
    recommended[course.id].lessons = nextLessons;
  }

  return recommended;
};
