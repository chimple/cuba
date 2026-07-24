import {
  CoursePath,
  LearningPath,
  LessonNode,
} from './useLearningPath';

type CachedLesson = Partial<import('../common/constants').TableTypes<'lesson'>> | null;

type EnsurePlayableLearningPathResult = {
  currentCourse: CoursePath | null;
  learningPath: LearningPath;
  updated: boolean;
};

type LearningPathRepairOptions = {
  allowCourseSwitch?: boolean;
  allowReplacementLesson?: boolean;
};

const getCourseResolutionOrder = (
  preferredIndex: number,
  totalCourses: number,
): number[] => {
  if (totalCourses <= 0) return [];

  const safeIndex = Math.min(Math.max(preferredIndex, 0), totalCourses - 1);
  const remainingIndexes = Array.from(
    { length: totalCourses },
    (_, index) => index,
  ).filter((index) => index !== safeIndex);

  return [safeIndex, ...remainingIndexes];
};

const hasCoursePathContent = (course?: Pick<CoursePath, 'path'> | null) =>
  Boolean(course?.path?.length);

export const sanitizeLearningPathCourse = async ({
  course,
  getCachedLesson,
  resolveNextLesson,
  allowReplacementLesson = true,
}: {
  course: CoursePath;
  getCachedLesson: (lessonId: string) => Promise<CachedLesson>;
  resolveNextLesson: (course: CoursePath) => Promise<LessonNode | null>;
  allowReplacementLesson?: boolean;
}): Promise<{ course: CoursePath; updated: boolean }> => {
  const validPath: LessonNode[] = [];
  for (const pathItem of course.path) {
    if (!pathItem?.lesson_id) {
      continue;
    }

    const lesson = await getCachedLesson(pathItem.lesson_id);
    if (lesson?.id) {
      validPath.push({ ...pathItem });
    }
  }

  const removedStaleLessons = validPath.length !== course.path.length;
  const hasActiveLesson = validPath.some((pathItem) => !pathItem.isPlayed);
  let rebuiltPath = validPath;
  let appendedReplacementLesson = false;

  if (!hasActiveLesson && allowReplacementLesson) {
    const nextLesson = await resolveNextLesson({
      ...course,
      path: validPath,
    });

    if (nextLesson) {
      rebuiltPath = [...validPath, nextLesson];
      appendedReplacementLesson = true;
    }
  }

  if (!removedStaleLessons && !appendedReplacementLesson) {
    return { course, updated: false };
  }

  return {
    course: {
      ...course,
      path: rebuiltPath,
    },
    updated: true,
  };
};

export const ensurePlayableLearningPath = async ({
  learningPath,
  getCachedLesson,
  resolveNextLesson,
  options,
}: {
  learningPath: LearningPath;
  getCachedLesson: (lessonId: string) => Promise<CachedLesson>;
  resolveNextLesson: (course: CoursePath) => Promise<LessonNode | null>;
  options?: LearningPathRepairOptions;
}): Promise<EnsurePlayableLearningPathResult> => {
  const allowCourseSwitch = options?.allowCourseSwitch ?? true;
  const allowReplacementLesson = options?.allowReplacementLesson ?? true;
  const courseList = learningPath.courses?.courseList ?? [];
  const courseResolutionOrder = getCourseResolutionOrder(
    learningPath.courses?.currentCourseIndex ?? 0,
    courseList.length,
  );

  if (!courseResolutionOrder.length) {
    return { currentCourse: null, learningPath, updated: false };
  }

  const nextCourseList = [...courseList];
  let currentCourseIndex = learningPath.courses.currentCourseIndex ?? 0;
  let updated = false;

  for (const courseIndex of courseResolutionOrder) {
    const course = nextCourseList[courseIndex];
    if (!course) continue;

    const sanitizedCourse = await sanitizeLearningPathCourse({
      course,
      getCachedLesson,
      resolveNextLesson,
      allowReplacementLesson,
    });

    if (sanitizedCourse.updated) {
      nextCourseList[courseIndex] = sanitizedCourse.course;
      updated = true;
    }

    if (hasCoursePathContent(nextCourseList[courseIndex])) {
      if (allowCourseSwitch && currentCourseIndex !== courseIndex) {
        currentCourseIndex = courseIndex;
        updated = true;
      }
      break;
    }

    if (!allowCourseSwitch && courseIndex === currentCourseIndex) {
      break;
    }
  }

  const currentCourse = nextCourseList[currentCourseIndex] ?? null;

  if (!updated) {
    return {
      currentCourse,
      learningPath,
      updated: false,
    };
  }

  return {
    currentCourse,
    updated: true,
    learningPath: {
      ...learningPath,
      updated_at: new Date().toISOString(),
      courses: {
        ...learningPath.courses,
        courseList: nextCourseList,
        currentCourseIndex,
      },
    },
  };
};
