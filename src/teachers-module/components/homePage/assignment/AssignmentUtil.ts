import { AssignmentSource, TableTypes } from "../../../../common/constants";
import { Lesson, RecommendedAssignmentsState } from "./RecommendedAssignments";

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
    ) => Promise<TableTypes<"chapter">[]>;
    getLessonsForChapter: (
      chapterId: string,
    ) => Promise<TableTypes<"lesson">[]>;
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
  courseList: TableTypes<"course">[],
  lastAssignmentsCourseWise: TableTypes<"assignment">[] | undefined,
): Promise<RecommendedAssignmentsState> => {
  const recommended: RecommendedAssignmentsState = {};

  for (const course of courseList) {
    recommended[course.id] = {
      name: course.name,
      courseCode: course.code!,
      lessons: [],
      allLessons: [],
      sort_index: course.sort_index ?? 0,
      isCollapsed: false,
    };

    const lastAssignment = lastAssignmentsCourseWise?.find(
      (assignment) => assignment.course_id === course.id,
    );

    const allChapters = await api.getChaptersForCourse(course.id);
    if (!allChapters?.length) continue;

    const allLessons: Lesson[] = [];

    for (const chapter of allChapters) {
      const lessons = await api.getLessonsForChapter(chapter.id);

      if (lessons?.length) {
        allLessons.push(
          ...lessons.map((lesson) => ({
            ...lesson,
            _chapterId: chapter.id,
            selected: false,
            source: null,
          })),
        );
      }
    }

    if (!allLessons.length) continue;

    recommended[course.id].allLessons = allLessons;

    let startIndex = 0;

    if (lastAssignment?.lesson_id) {
      const lessonIndex = allLessons.findIndex(
        (lesson) => lesson.id === lastAssignment.lesson_id,
      );

      startIndex = lessonIndex >= 0 ? lessonIndex + 1 : 0;
    }

    const nextLessons: Lesson[] = [];

    for (let i = startIndex; i < allLessons.length; i++) {
      if (nextLessons.length === 5) break;

      const lesson = allLessons[i];

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
    }

    recommended[course.id].lessons = nextLessons;
  }

  return recommended;
};
