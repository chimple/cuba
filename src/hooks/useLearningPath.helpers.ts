import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import { palUtil } from '../utility/palUtil';
import { v4 as uuidv4 } from 'uuid';
import {
  EVENTS,
  RECOMMENDATION_TYPE,
  LEARNING_PATHWAY_MODE,
  TableTypes,
  LANGUAGE,
  COURSES,
  SOURCE,
} from '../common/constants';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import logger from '../utility/logger';

export type LearningPath = {
  courses: {
    courseList: CoursePath[];
    currentCourseIndex: number;
  };
  type: RECOMMENDATION_TYPE;
  pathMode: string;
  updated_at: string;
};

export type CoursePath = {
  path_id: string;
  course_id: string;
  subject_id: string | null;
  framework_id?: string | null;
  course_code?: string | null;
  display_name?: string;
  is_pal_consolidated?: boolean;
  type: RECOMMENDATION_TYPE;
  path: LessonNode[]; // played + ONE active
  completedPath: number;
};

export type LearningPathCourse = TableTypes<'course'> & {
  pathway_display_name?: string;
  is_pal_consolidated?: boolean;
};

export type LessonNode = {
  lesson_id: string;
  chapter_id?: string | undefined;
  skill_id?: string | undefined;
  assignment_id?: string | undefined;
  source?: SOURCE;
  is_assessment: boolean;
  isPlayed: boolean;
};

export type LearningPathStudent = Pick<TableTypes<'user'>, 'id'> &
  Partial<TableTypes<'user'>>;

export type LearningPathCourseInput = Pick<TableTypes<'course'>, 'id'> &
  Partial<TableTypes<'course'>> & {
    pathway_display_name?: string;
    is_pal_consolidated?: boolean;
  };

export type StoredCoursePath = CoursePath & {
  lastPlayedLesson?: LessonNode;
};

export type LegacyLessonNode = Pick<LessonNode, 'lesson_id'> &
  Partial<Omit<LessonNode, 'lesson_id'>>;

export type LegacyCoursePath = Omit<
  StoredCoursePath,
  'path' | 'type' | 'completedPath'
> & {
  path?: LegacyLessonNode[];
  type: RECOMMENDATION_TYPE | string;
  completedPath?: number;
  currentIndex?: number;
  startIndex?: number;
  pathEndIndex?: number;
};

export type LessonListItem = Pick<LessonNode, 'chapter_id'> & {
  id?: string | null;
  lesson_id?: string | null;
};

export const getLessonListItemId = (lesson: LessonListItem) =>
  lesson.lesson_id ?? lesson.id ?? null;

export const ASSIGNED_ASSESSMENT_PATH_SIZE = 5;

export const toAssignedAssessmentNode = (
  assignment: TableTypes<'assignment'>,
): LessonNode => ({
  lesson_id: assignment.lesson_id,
  chapter_id: undefined,
  assignment_id: assignment.id,
  source: SOURCE.INITIAL_ASSESSMENT,
  is_assessment: true,
  isPlayed: false,
});

export const toAssignedAssessmentPath = (
  assignments: TableTypes<'assignment'>[],
) =>
  assignments
    .slice(0, ASSIGNED_ASSESSMENT_PATH_SIZE)
    .map(toAssignedAssessmentNode);

export const getAssignedAssessmentNodeKey = (node: LessonNode) =>
  node.assignment_id ?? node.lesson_id;

export const hasInProgressAssessmentPath = (path: LessonNode[] = []) =>
  path.some((node) => node.is_assessment === true && node.isPlayed === false);

export const mergeAssignedAssessmentIdsIntoPath = (
  path: LessonNode[] = [],
  assessmentPath: LessonNode[],
) => {
  const assignmentByLessonId = new Map(
    assessmentPath.map((node) => [node.lesson_id, node.assignment_id]),
  );
  let updated = false;

  const mergedPath = path.map((node) => {
    if (
      node.is_assessment !== true ||
      node.assignment_id ||
      !assignmentByLessonId.has(node.lesson_id)
    ) {
      return node;
    }

    updated = true;
    return {
      ...node,
      assignment_id: assignmentByLessonId.get(node.lesson_id),
      source: SOURCE.INITIAL_ASSESSMENT,
    };
  });

  return updated ? mergedPath : path;
};

export const hasAssessmentProgress = (path: LessonNode[] = []) =>
  path.some((node) => node.is_assessment === true);

export const buildSameFrameworkAssessmentPath = (
  sourcePath: LessonNode[] = [],
  activeLesson: LessonNode | null,
) => {
  if (!activeLesson?.is_assessment || !sourcePath.length) return null;

  const assessmentPath = sourcePath.filter(
    (node) => node.is_assessment === true,
  );
  if (!assessmentPath.length) return null;

  const activeIndex = assessmentPath.findIndex(
    (node) => node.isPlayed === false,
  );
  if (activeIndex === -1) {
    const alreadyExists = assessmentPath.some(
      (node) => node.lesson_id === activeLesson.lesson_id,
    );
    return alreadyExists
      ? assessmentPath
      : [...assessmentPath, { ...activeLesson }];
  }

  return assessmentPath.map((node, index) =>
    index === activeIndex ? { ...activeLesson } : { ...node },
  );
};

export const getAssignedAssessmentPath = async ({
  student,
  course,
  classId,
}: {
  student: LearningPathStudent;
  course: LearningPathCourseInput;
  classId?: string | null;
}): Promise<LessonNode[]> => {
  if (!classId) return [];

  const assessments =
    await ServiceConfig.getI().apiHandler.getLatestAssessmentGroup(
      classId,
      student as TableTypes<'user'>,
      course.id,
    );

  return assessments?.length ? toAssignedAssessmentPath(assessments) : [];
};

export const shouldUseAssessment = (mode: string) =>
  mode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY ||
  mode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE;

export const shouldUsePAL = (mode: string) =>
  mode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE;

export const isPalEnabledCourse = (course?: TableTypes<'course'> | null) =>
  !!course?.subject_id && !!course?.framework_id;

export const consolidatePalEnabledCourses = async (
  courses: TableTypes<'course'>[],
  mode: string,
): Promise<LearningPathCourse[]> => {
  if (mode !== LEARNING_PATHWAY_MODE.FULL_ADAPTIVE) return courses;

  const api = ServiceConfig.getI().apiHandler;
  const palSubjectsAdded = new Set<string>();
  const subjectNameById = new Map<string, string>();
  const consolidatedCourses: LearningPathCourse[] = [];

  for (const course of courses) {
    const subjectId = course.subject_id;

    if (!subjectId || !isPalEnabledCourse(course)) {
      consolidatedCourses.push(course);
      continue;
    }

    if (palSubjectsAdded.has(subjectId)) continue;

    palSubjectsAdded.add(subjectId);

    let displayName = subjectNameById.get(subjectId);
    if (!displayName) {
      try {
        const subject = await api.getSubject(subjectId);
        displayName = subject?.name?.trim() || course.name;
      } catch (e) {
        logger.error('Error resolving PAL subject display name', e);
        displayName = course.name;
      }
      subjectNameById.set(subjectId, displayName);
    }

    consolidatedCourses.push({
      ...course,
      pathway_display_name: displayName,
      is_pal_consolidated: true,
    });
  }

  return consolidatedCourses;
};

export async function buildPath({
  student,
  courses,
  mode,
}: {
  student: LearningPathStudent;
  courses: LearningPathCourseInput[];
  mode: string;
}): Promise<LearningPath> {
  const isLinked = await ServiceConfig.getI().apiHandler.isStudentLinked(
    student.id,
  );
  const currClassId = isLinked ? schoolUtil.getCurrentClass()?.id : null;
  const courseList = await Promise.all(
    courses.map(async (course) => {
      const assignedAssessmentPath = await getAssignedAssessmentPath({
        student,
        course,
        classId: currClassId,
      });
      const activeLesson = assignedAssessmentPath.length
        ? null
        : await recommendNextLesson({
            student,
            course,
            mode,
            classId: currClassId || undefined,
          });

      return {
        path_id: uuidv4(),
        course_id: course.id,
        subject_id: course.subject_id ?? null,
        framework_id: course.framework_id ?? null,
        course_code: course.code ?? null,
        display_name: course.pathway_display_name,
        is_pal_consolidated: course.is_pal_consolidated,
        type: course.framework_id
          ? RECOMMENDATION_TYPE.FRAMEWORK
          : RECOMMENDATION_TYPE.CHAPTER,
        path: assignedAssessmentPath.length
          ? assignedAssessmentPath
          : activeLesson
            ? [activeLesson]
            : [],
        completedPath: 0,
      };
    }),
  );

  const hasFramework = courseList.some(
    (c) => c.type === RECOMMENDATION_TYPE.FRAMEWORK,
  );

  return {
    courses: {
      courseList,
      currentCourseIndex: 0,
    },
    type: hasFramework
      ? RECOMMENDATION_TYPE.FRAMEWORK
      : RECOMMENDATION_TYPE.CHAPTER,
    pathMode: mode,
    updated_at: new Date().toISOString(),
  };
}

export async function recommendNextLesson({
  student,
  course,
  mode,
  classId,
  coursePath,
  skipAssessment = false,
}: {
  student: LearningPathStudent;
  course: LearningPathCourseInput;
  mode: string;
  classId?: string;
  coursePath?: Pick<CoursePath, 'path'> | null;
  skipAssessment?: boolean;
}): Promise<LessonNode | null> {
  const api = ServiceConfig.getI().apiHandler;
  const hasAssessmentProgressInPath =
    coursePath?.path?.some((node) => node.is_assessment === true) ?? false;
  const hasPendingAssessmentInPath =
    coursePath?.path?.some(
      (node) => node.is_assessment === true && node.isPlayed === false,
    ) ?? false;
  const hasPlayedNormalLessonInPath =
    coursePath?.path?.some(
      (node) => node.is_assessment === false && node.isPlayed === true,
    ) ?? false;

  /* -------------------------------
   * 1️⃣ TEACHER ASSIGNED ASSESSMENT
   * ------------------------------- */
  const hasCompletedInitialAssessment = shouldUsePAL(mode)
    ? hasPlayedNormalLessonInPath ||
      (!hasAssessmentProgressInPath &&
        !hasPendingAssessmentInPath &&
        (await api.isStudentPlayedPalLesson(student.id, course.id)))
    : false;
  if (!skipAssessment && classId) {
    const assessments = await api.getLatestAssessmentGroup(
      classId,
      student as TableTypes<'user'>,
      course.id,
    );

    if (assessments && assessments.length > 0) {
      return {
        lesson_id: assessments[0].lesson_id,
        chapter_id: undefined,
        assignment_id: assessments[0].id,
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      };
    }
  }

  /* ------------------------------------------------------------------------------------------
   * 2️⃣ MODE-BASED ASSESSMENT (assessment only/full adaptive mode with pal lesson not played )
   * ------------------------------------------------------------------------------------------ */
  if (
    shouldUseAssessment(mode) &&
    !skipAssessment &&
    !hasCompletedInitialAssessment &&
    course.subject_id
  ) {
    const res = await api.getSubjectLessonsBySubjectId(
      course.subject_id,
      student as TableTypes<'user'>,
      course.id,
    );
    if (res && res.id) {
      return {
        lesson_id: res.lesson_id,
        chapter_id: undefined,
        source: SOURCE.INITIAL_ASSESSMENT,
        is_assessment: true,
        isPlayed: false,
      };
    }
  }

  /* ------------------------------------------------------
   * 3️⃣ PAL (FULL_ADAPTIVE) + completed/aborted assessment
   * ------------------------------------------------------ */
  if (shouldUsePAL(mode)) {
    const palLesson = await palUtil.getPalLessonPathForCourse(
      course.id,
      student.id,
    );

    if (palLesson) {
      return {
        lesson_id: palLesson.lesson_id,
        chapter_id: palLesson.chapter_id,
        skill_id: palLesson.skill_id,
        source: SOURCE.LEARNING_PATHWAY_HOME_PAL,
        is_assessment: false,
        isPlayed: false,
      };
    }
  }

  /* -----------------------------------
   * 4️⃣ NORMAL CHAPTER FLOW (DEFAULT)
   * ----------------------------------- */
  const chapters = await api.getChaptersForCourse(course.id);
  if (!chapters?.length) return null;
  const lastPlayedLesson = getLastPlayedLesson(coursePath, 'normal');
  let idx = 0;

  // 🔥 Find chapter index of last played lesson
  if (lastPlayedLesson?.chapter_id) {
    const foundIndex = chapters.findIndex(
      (ch) => ch.id === lastPlayedLesson.chapter_id,
    );

    if (foundIndex !== -1) {
      idx = foundIndex;
    }
  }

  for (let i = idx; i < chapters.length; i++) {
    const ch = chapters[i];
    const lessons = await api.getLessonsForChapter(ch.id);
    const next = getNextFromList(
      lessons.map((lesson) => ({ ...lesson, chapter_id: ch.id })),
      lastPlayedLesson,
      false,
    );

    if (next) return next;
  }

  // If nothing found → loop back to start and recommend first lesson of first chapter
  const firstLessons = await api.getLessonsForChapter(chapters[0].id);
  if (!firstLessons?.length) return null;

  return {
    lesson_id: firstLessons[0].id,
    chapter_id: chapters[0].id,
    source: SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
    is_assessment: false,
    isPlayed: false,
  };
}

export function getNextFromList(
  lessons: LessonListItem[],
  lastPlayedLesson?: LessonNode,
  isAssessment = false,
): LessonNode | null {
  if (!lessons?.length) return null;

  if (!lastPlayedLesson) {
    const first = lessons[0];
    const lessonId = getLessonListItemId(first);
    if (!lessonId) return null;

    return {
      lesson_id: lessonId,
      chapter_id: first.chapter_id || undefined,
      source: SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
      is_assessment: isAssessment,
      isPlayed: false,
    };
  }

  const index = lessons.findIndex(
    (l) => getLessonListItemId(l) === lastPlayedLesson.lesson_id,
  );

  const next = lessons[index + 1];
  if (!next) return null;
  const nextLessonId = getLessonListItemId(next);
  if (!nextLessonId) return null;

  return {
    lesson_id: nextLessonId,
    chapter_id: next.chapter_id || undefined,
    source: SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
    is_assessment: isAssessment,
    isPlayed: false,
  };
}

export function getLastPlayedLesson(
  coursePath: Pick<CoursePath, 'path'> | null | undefined,
  type: 'assessment' | 'normal',
): LessonNode | undefined {
  if (!coursePath?.path?.length) return undefined;

  const wantAssessment = type === 'assessment';

  for (let i = coursePath.path.length - 1; i >= 0; i--) {
    const lesson = coursePath.path[i];
    if (lesson.isPlayed === true && lesson.is_assessment === wantAssessment) {
      return lesson;
    }
  }
  return undefined;
}
