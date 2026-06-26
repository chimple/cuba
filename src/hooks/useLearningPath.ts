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

type LearningPathStudent = Pick<TableTypes<'user'>, 'id'> &
  Partial<TableTypes<'user'>>;

type LearningPathCourseInput = Pick<TableTypes<'course'>, 'id'> &
  Partial<TableTypes<'course'>> & {
    pathway_display_name?: string;
    is_pal_consolidated?: boolean;
  };

type StoredCoursePath = CoursePath & {
  lastPlayedLesson?: LessonNode;
};

type LegacyLessonNode = Pick<LessonNode, 'lesson_id'> &
  Partial<Omit<LessonNode, 'lesson_id'>>;

type LegacyCoursePath = Omit<
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

type LessonListItem = Pick<LessonNode, 'chapter_id'> & {
  id?: string | null;
  lesson_id?: string | null;
};

const getLessonListItemId = (lesson: LessonListItem) =>
  lesson.lesson_id ?? lesson.id ?? null;

const ASSIGNED_ASSESSMENT_PATH_SIZE = 5;

const toAssignedAssessmentNode = (
  assignment: TableTypes<'assignment'>,
): LessonNode => ({
  lesson_id: assignment.lesson_id,
  chapter_id: undefined,
  assignment_id: assignment.id,
  source: SOURCE.INITIAL_ASSESSMENT,
  is_assessment: true,
  isPlayed: false,
});

const toAssignedAssessmentPath = (assignments: TableTypes<'assignment'>[]) =>
  assignments
    .slice(0, ASSIGNED_ASSESSMENT_PATH_SIZE)
    .map(toAssignedAssessmentNode);

const getAssignedAssessmentNodeKey = (node: LessonNode) =>
  node.assignment_id ?? node.lesson_id;

const hasInProgressAssessmentPath = (path: LessonNode[] = []) =>
  path.some((node) => node.is_assessment === true && node.isPlayed === false);

const mergeAssignedAssessmentIdsIntoPath = (
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

const hasAssessmentProgress = (path: LessonNode[] = []) =>
  path.some((node) => node.is_assessment === true);

const buildSameFrameworkAssessmentPath = (
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
  if (activeIndex === -1) return null;

  return assessmentPath.map((node, index) =>
    index === activeIndex ? { ...activeLesson } : { ...node },
  );
};

const getAssignedAssessmentPath = async ({
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

  /* -------------------------------
   * 1️⃣ TEACHER ASSIGNED ASSESSMENT
   * ------------------------------- */
  const hasCompletedInitialAssessment = shouldUsePAL(mode)
    ? !hasAssessmentProgressInPath &&
      !hasPendingAssessmentInPath &&
      (await api.isStudentPlayedPalLesson(student.id, course.id))
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
    course.subject_id &&
    course.framework_id != null
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

const LANGUAGE_VARIANT_PATTERN = /^(.+?)-([a-z]{2,3})$/i;

const normalizeCourseToken = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

const getCourseCodeBase = (course?: TableTypes<'course'>) => {
  const normalizedCode = normalizeCourseToken(course?.code);
  const matches = normalizedCode.match(LANGUAGE_VARIANT_PATTERN);
  return matches?.[1] ?? normalizedCode;
};

const isMathCourse = (course?: TableTypes<'course'>) =>
  getCourseCodeBase(course) === COURSES.MATHS;

const isLanguageMatchedCourse = (
  course: TableTypes<'course'>,
  languageCode: string,
) => {
  const normalizedCode = normalizeCourseToken(course.code);
  const normalizedName = normalizeCourseToken(course.name);
  const normalizedLanguageCode = normalizeCourseToken(languageCode);

  if (!normalizedLanguageCode) return false;

  return (
    normalizedCode === normalizedLanguageCode ||
    normalizedCode.endsWith(`-${normalizedLanguageCode}`) ||
    normalizedName === normalizedLanguageCode ||
    normalizedName.endsWith(`-${normalizedLanguageCode}`)
  );
};

const getMathCourseGroupKey = (course: TableTypes<'course'>) =>
  [
    course.subject_id ?? '',
    course.curriculum_id ?? '',
    course.grade_id ?? '',
    course.framework_id ?? '',
    getCourseCodeBase(course),
  ].join('|');

const getMathCoursePreferenceScore = (
  course: TableTypes<'course'>,
  languageCode: string,
) => {
  if (isLanguageMatchedCourse(course, languageCode)) return 0;
  if (
    isLanguageMatchedCourse(course, COURSES.ENGLISH) ||
    normalizeCourseToken(course.code) === getCourseCodeBase(course)
  ) {
    return 1;
  }
  return 2;
};

const preferStudentLanguageMathCourses = (
  courses: TableTypes<'course'>[],
  languageCode: string,
) => {
  if (!languageCode) return courses;

  const preferredByGroup = new Map<string, TableTypes<'course'>>();

  courses.forEach((course) => {
    if (!isMathCourse(course)) return;

    const groupKey = getMathCourseGroupKey(course);
    const current = preferredByGroup.get(groupKey);
    if (!current) {
      preferredByGroup.set(groupKey, course);
      return;
    }

    const courseScore = getMathCoursePreferenceScore(course, languageCode);
    const currentScore = getMathCoursePreferenceScore(current, languageCode);
    if (courseScore < currentScore) {
      preferredByGroup.set(groupKey, course);
    }
  });

  const emittedMathGroups = new Set<string>();
  const resolvedCourses: TableTypes<'course'>[] = [];

  courses.forEach((course) => {
    if (!isMathCourse(course)) {
      resolvedCourses.push(course);
      return;
    }

    const groupKey = getMathCourseGroupKey(course);
    const preferredCourse = preferredByGroup.get(groupKey) ?? course;

    // Emit preferred course first
    if (!emittedMathGroups.has(groupKey)) {
      emittedMathGroups.add(groupKey);
      resolvedCourses.push(preferredCourse);
    }

    // Allow additional variants too
    if (course.id !== preferredCourse.id) {
      resolvedCourses.push(course);
    }
  });

  return resolvedCourses;
};

const resolveStudentLanguageCode = async (
  studentOrLanguageId?: TableTypes<'user'> | string | null,
) => {
  const localLanguageCode = normalizeCourseToken(
    localStorage.getItem(LANGUAGE),
  );
  if (localLanguageCode) return localLanguageCode;

  const languageId =
    typeof studentOrLanguageId === 'string'
      ? studentOrLanguageId
      : studentOrLanguageId?.language_id;
  if (!languageId) return '';

  try {
    const language =
      await ServiceConfig.getI().apiHandler.getLanguageWithId(languageId);
    return normalizeCourseToken(language?.code);
  } catch (e) {
    logger.error('Error resolving student language', e);
    return '';
  }
};

export const sortCoursesByStudentLanguage = async (
  courses: TableTypes<'course'>[],
  studentOrLanguageId?: TableTypes<'user'> | string | null,
) => {
  const languageCode = await resolveStudentLanguageCode(studentOrLanguageId);
  const languagePreferredCourses = preferStudentLanguageMathCourses(
    courses,
    languageCode,
  );

  if (languageCode) {
    const targetCourses = languagePreferredCourses.filter(
      (c) => normalizeCourseToken(c.code) === languageCode,
    );

    if (targetCourses.length > 0) {
      const otherCourses = languagePreferredCourses.filter(
        (c) => normalizeCourseToken(c.code) !== languageCode,
      );
      return [...targetCourses, ...otherCourses];
    }
  }

  if (typeof studentOrLanguageId !== 'object' || !studentOrLanguageId) {
    return languagePreferredCourses;
  }
  if (!studentOrLanguageId.language_id) {
    return languagePreferredCourses;
  }

  try {
    const language = await ServiceConfig.getI().apiHandler.getLanguageWithId(
      studentOrLanguageId.language_id,
    );
    if (!language) return languagePreferredCourses;

    const languageName = normalizeCourseToken(language.name);

    if (languageName) {
      const targetCourses = languagePreferredCourses.filter(
        (c) => normalizeCourseToken(c.name) === languageName,
      );
      if (targetCourses.length > 0) {
        const otherCourses = languagePreferredCourses.filter(
          (c) => normalizeCourseToken(c.name) !== languageName,
        );
        return [...targetCourses, ...otherCourses];
      }
    }
  } catch (e) {
    logger.error('Error sorting courses by language', e);
  }

  return languagePreferredCourses;
};

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

export const useLearningPath = (opts?: {
  student?: LearningPathStudent;
  gb?: unknown;
  onGbUpdate?: (b: boolean) => void;
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const { setGbUpdated } = useGbContext();

  async function getPath({
    courses,
    mode,
    classId,
  }: {
    courses: LearningPathCourseInput[];
    mode: string;
    classId?: string;
  }) {
    let currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    const pathToParse = Util.getLatestLearningPathByUpdatedAt(currentStudent);
    let learningPath: LearningPath | null = pathToParse
      ? (JSON.parse(pathToParse) as LearningPath)
      : null;
    // check if learning path is empty, if empty build it
    if (!learningPath) {
      learningPath = await buildPath({
        student: currentStudent,
        courses,
        mode,
      });
      await saveLearningPath(currentStudent, learningPath);

      const currentCourse =
        learningPath.courses.courseList[
          learningPath.courses.currentCourseIndex
        ];

      if (!currentCourse) {
        return;
      }
      const coursePath = currentCourse.path ?? [];
      if (!coursePath.length) {
        return;
      }

      const activeLesson = coursePath.find((l) => l.isPlayed === false);
      const lastPlayedLesson = [...coursePath]
        .reverse()
        .find((l) => l.isPlayed === true);

      const eventData = {
        user_id: currentStudent?.id,
        path_id: currentCourse.path_id,
        current_course_id: currentCourse.course_id,
        current_lesson_id: activeLesson?.lesson_id ?? null,
        current_chapter_id: activeLesson?.chapter_id ?? null,
        last_played_lesson_id: lastPlayedLesson?.lesson_id ?? null,
        last_played_chapter_id: lastPlayedLesson?.chapter_id ?? null,
        is_assessment_active: activeLesson?.is_assessment ?? false,
      };

      await Util.logEvent(EVENTS.PATHWAY_CREATED, eventData);
      return learningPath;
    }

    // check if learning path mode is different from current mode, if so rebuild it
    const pathMode = learningPath.pathMode;
    if (!mode || !pathMode) {
      // check if learning path has old structure, if so migrate it
      if (learningPath?.courses?.courseList) {
        const courseList = learningPath.courses
          .courseList as LegacyCoursePath[];
        const hasOldStructure = courseList.some(
          (c) =>
            c.currentIndex !== undefined ||
            c.startIndex !== undefined ||
            c.pathEndIndex !== undefined,
        );
        if (hasOldStructure) {
          learningPath.courses.courseList = courseList.map((coursePath) =>
            migrate(coursePath),
          );
          learningPath.pathMode = mode;
          learningPath.updated_at = new Date().toISOString();
          await saveLearningPath(currentStudent, learningPath);
          return learningPath;
        }
      }
      return learningPath;
    }
    if (mode != pathMode) {
      learningPath = await buildPath({
        student: currentStudent,
        courses,
        mode,
      });
      await saveLearningPath(currentStudent, learningPath);

      const currentCourse =
        learningPath.courses.courseList[
          learningPath.courses.currentCourseIndex
        ];

      if (!currentCourse) {
        return;
      }
      const coursePath = currentCourse.path ?? [];
      if (!coursePath.length) {
        return;
      }

      const activeLesson = coursePath.find((l) => l.isPlayed === false);
      const lastPlayedLesson = [...coursePath]
        .reverse()
        .find((l) => l.isPlayed === true);

      const eventData = {
        user_id: currentStudent?.id,
        path_id: currentCourse.path_id,
        current_course_id: currentCourse.course_id,
        current_lesson_id: activeLesson?.lesson_id ?? null,
        current_chapter_id: activeLesson?.chapter_id ?? null,
        last_played_lesson_id: lastPlayedLesson?.lesson_id ?? null,
        last_played_chapter_id: lastPlayedLesson?.chapter_id ?? null,
        is_assessment_active: activeLesson?.is_assessment ?? false,
      };

      await Util.logEvent(EVENTS.PATHWAY_CREATED, eventData);
      return learningPath;
    }

    // check if learning path has old structure, if so migrate it
    if (learningPath?.courses?.courseList) {
      const courseList = learningPath.courses.courseList as LegacyCoursePath[];
      const hasOldStructure = courseList.some(
        (c) =>
          c.currentIndex !== undefined ||
          c.startIndex !== undefined ||
          c.pathEndIndex !== undefined,
      );
      if (hasOldStructure) {
        learningPath.courses.courseList = courseList.map((coursePath) =>
          migrate(coursePath),
        );
        learningPath.pathMode = mode;
        learningPath.updated_at = new Date().toISOString();
        await saveLearningPath(currentStudent, learningPath);
        return;
      }
    }

    // 🔄 Sync courses between API and stored learningPath
    const res = await updateLearningPathIfNeeded(
      learningPath,
      courses,
      currentStudent,
      mode,
      classId,
    );

    if (res.updated) learningPath = res.learningPath;

    const total_learning_path_completed =
      learningPath.courses.courseList.reduce(
        (total: number, course: { completedPath?: number }) =>
          total + (course.completedPath ?? 0),
        0,
      );

    const learning_path_completed =
      learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
        .completedPath ?? 0;
    // update local attributes
    updateLocalAttributes({
      learning_path_completed,
      total_learning_path_completed,
    });

    setGbUpdated(true);

    return learningPath;
  }

  const updateLearningPathIfNeeded = async (
    learningPath: LearningPath,
    userCourses: LearningPathCourseInput[],
    student: TableTypes<'user'>,
    mode: string,
    classId?: string,
  ) => {
    const oldCourseList: StoredCoursePath[] =
      learningPath.courses?.courseList || [];

    /* -----------------------------------
     * Save current active courseId
     * ----------------------------------- */
    const oldCurrentIndex = learningPath.courses.currentCourseIndex ?? 0;
    const oldCurrentCourseId = oldCourseList[oldCurrentIndex]?.course_id;

    /* -----------------------------------
     * Identity checks
     * ----------------------------------- */
    const oldIds = oldCourseList.map((c) => c.course_id);
    const newIds = userCourses.map((c) => c.id);

    const sameCourses =
      oldIds.length === newIds.length &&
      newIds.every((id) => oldIds.includes(id));

    const sameOrder =
      sameCourses && newIds.every((id, idx) => id === oldIds[idx]);

    const sameMetadata =
      sameOrder &&
      userCourses.every((course, idx) => {
        const oldCourse = oldCourseList[idx];
        return (
          (oldCourse?.display_name ?? undefined) ===
            (course.pathway_display_name ?? undefined) &&
          !!oldCourse?.is_pal_consolidated === !!course.is_pal_consolidated
        );
      });

    const assignedAssessmentSync = await syncAssignedAssessmentPaths(
      oldCourseList,
      userCourses,
      student,
      classId,
    );

    if (assignedAssessmentSync.updated) {
      learningPath.courses.currentCourseIndex =
        assignedAssessmentSync.currentCourseIndex;
      learningPath.updated_at = new Date().toISOString();
      await saveLearningPath(student, learningPath);
      return { updated: true, learningPath };
    }

    if (sameOrder && sameMetadata) {
      return { updated: false, learningPath };
    }

    /* -----------------------------------
     * Sync courses (reuse by id)
     * ----------------------------------- */
    const existingMap = new Map<string, StoredCoursePath>();
    oldCourseList.forEach((c) => existingMap.set(c.course_id, c));
    const courseInputMap = new Map(
      userCourses.map((course) => [course.id, course]),
    );

    const findSameFrameworkAssessmentPath = (
      course: LearningPathCourseInput,
    ) => {
      const frameworkId = course.framework_id;
      if (!frameworkId) return null;

      return (
        oldCourseList.find((coursePath) => {
          const pathFrameworkId =
            coursePath.framework_id ??
            courseInputMap.get(coursePath.course_id)?.framework_id ??
            null;
          const pathCourseCode = normalizeCourseToken(
            coursePath.course_code ??
              courseInputMap.get(coursePath.course_id)?.code,
          );
          const courseCode = normalizeCourseToken(course.code);

          return (
            pathFrameworkId === frameworkId &&
            coursePath.subject_id === (course.subject_id ?? null) &&
            (!pathCourseCode || !courseCode || pathCourseCode === courseCode) &&
            hasAssessmentProgress(coursePath.path)
          );
        }) ?? null
      );
    };

    const newCourseList: StoredCoursePath[] = [];
    for (const course of userCourses) {
      const existing = existingMap.get(course.id);

      if (existing) {
        // ✅ Preserve entire course state
        newCourseList.push({
          ...existing,
          framework_id: course.framework_id ?? existing.framework_id ?? null,
          course_code: course.code ?? existing.course_code ?? null,
          display_name: course.pathway_display_name,
          is_pal_consolidated: course.is_pal_consolidated,
        });
      } else {
        // ➕ New course → build fresh
        const sameFrameworkAssessmentSource =
          findSameFrameworkAssessmentPath(course);
        const activeLesson = await recommendNextLesson({
          student,
          course,
          mode,
          classId,
          coursePath: sameFrameworkAssessmentSource,
        });
        const sameFrameworkAssessmentPath = buildSameFrameworkAssessmentPath(
          sameFrameworkAssessmentSource?.path,
          activeLesson,
        );

        newCourseList.push({
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
          path:
            sameFrameworkAssessmentPath ?? (activeLesson ? [activeLesson] : []),
          completedPath: 0,
          lastPlayedLesson: undefined,
        });
      }
    }

    /* ----------------------------------
     * Restore correct currentCourseIndex
     * ---------------------------------- */
    let newCurrentIndex = 0;

    if (oldCurrentCourseId) {
      const foundIndex = newCourseList.findIndex(
        (c) => c.course_id === oldCurrentCourseId,
      );

      if (foundIndex !== -1) {
        newCurrentIndex = foundIndex;
      }
    }

    learningPath.courses.courseList = newCourseList;
    learningPath.courses.currentCourseIndex = newCurrentIndex;
    learningPath.updated_at = new Date().toISOString();
    await saveLearningPath(student, learningPath);

    return { updated: true, learningPath };
  };

  const syncAssignedAssessmentPaths = async (
    oldCourseList: StoredCoursePath[],
    userCourses: LearningPathCourseInput[],
    student: TableTypes<'user'>,
    classId?: string,
  ): Promise<{ updated: boolean; currentCourseIndex: number }> => {
    if (!classId || !oldCourseList.length || !userCourses.length) {
      return {
        updated: false,
        currentCourseIndex: learningPathSafeIndex(oldCourseList, 0),
      };
    }

    for (const course of userCourses) {
      const courseIndex = oldCourseList.findIndex(
        (coursePath) => coursePath.course_id === course.id,
      );
      if (courseIndex === -1) continue;

      const assignments = await api.getLatestAssessmentGroup(
        classId,
        student,
        course.id,
      );
      if (!assignments?.length) continue;
      const assessmentPath = toAssignedAssessmentPath(assignments);

      const coursePath = oldCourseList[courseIndex];
      if (hasInProgressAssessmentPath(coursePath.path)) {
        const mergedPath = mergeAssignedAssessmentIdsIntoPath(
          coursePath.path,
          assessmentPath,
        );

        if (mergedPath !== coursePath.path) {
          coursePath.path = mergedPath;
          coursePath.display_name = course.pathway_display_name;
          coursePath.is_pal_consolidated = course.is_pal_consolidated;
          coursePath.framework_id = course.framework_id ?? null;
          coursePath.course_code =
            course.code ?? coursePath.course_code ?? null;
          coursePath.type = course.framework_id
            ? RECOMMENDATION_TYPE.FRAMEWORK
            : RECOMMENDATION_TYPE.CHAPTER;
          coursePath.subject_id = course.subject_id ?? null;

          return { updated: true, currentCourseIndex: courseIndex };
        }

        continue;
      }

      const activeAssessment = coursePath.path?.find(
        (node: LessonNode) =>
          node.isPlayed === false && node.is_assessment === true,
      );
      const currentPendingAssessmentIds = (coursePath.path ?? [])
        .filter(
          (node: LessonNode) =>
            node.isPlayed === false && node.is_assessment === true,
        )
        .map(getAssignedAssessmentNodeKey);
      const assignedAssessmentIds = assessmentPath.map(
        getAssignedAssessmentNodeKey,
      );
      const hasSamePendingAssessmentSequence =
        currentPendingAssessmentIds.length === assignedAssessmentIds.length &&
        assignedAssessmentIds.every(
          (assignmentId, index) =>
            currentPendingAssessmentIds[index] === assignmentId,
        );

      if (
        activeAssessment?.assignment_id === assignments[0].id &&
        hasSamePendingAssessmentSequence
      ) {
        continue;
      }

      coursePath.path_id = uuidv4();
      coursePath.path = assessmentPath;
      coursePath.display_name = course.pathway_display_name;
      coursePath.is_pal_consolidated = course.is_pal_consolidated;
      coursePath.framework_id = course.framework_id ?? null;
      coursePath.course_code = course.code ?? coursePath.course_code ?? null;
      coursePath.type = course.framework_id
        ? RECOMMENDATION_TYPE.FRAMEWORK
        : RECOMMENDATION_TYPE.CHAPTER;
      coursePath.subject_id = course.subject_id ?? null;
      coursePath.completedPath = coursePath.completedPath ?? 0;

      return { updated: true, currentCourseIndex: courseIndex };
    }

    return {
      updated: false,
      currentCourseIndex: learningPathSafeIndex(oldCourseList, 0),
    };
  };

  const learningPathSafeIndex = (
    courseList: readonly StoredCoursePath[],
    fallback: number,
  ) =>
    courseList.length > 0
      ? Math.min(Math.max(fallback, 0), courseList.length - 1)
      : 0;

  async function saveLearningPath(
    student: TableTypes<'user'> | LearningPathStudent,
    path: LearningPath,
  ) {
    const pathStr = JSON.stringify(path);
    await api.updateLearningPath(student as TableTypes<'user'>, pathStr);
    await Util.setCurrentStudent({
      ...(student as TableTypes<'user'>),
      learning_path: pathStr,
    });
  }

  function migrate(coursePath: LegacyCoursePath): StoredCoursePath {
    const lessons: LegacyLessonNode[] = coursePath.path || [];

    const startIndex = coursePath.startIndex ?? 0;
    const currentIndex = coursePath.currentIndex ?? 0;

    // active lesson absolute index
    const activeAbsIndex = startIndex + currentIndex;
    // Correct completed count
    const completedPath = Math.max(0, Math.floor(startIndex / 5));

    // slice exactly the same window user was seeing
    const windowLessons = lessons.slice(0, Math.min(lessons.length, 5));

    const newPath: LessonNode[] = windowLessons
      .filter(
        (_lesson: LegacyLessonNode, idx: number) =>
          startIndex + idx <= activeAbsIndex,
      )
      .map((l: LegacyLessonNode, idx: number) => {
        const absIndex = startIndex + idx;
        return {
          lesson_id: l.lesson_id,
          chapter_id: l.chapter_id,
          skill_id: l.skill_id,
          assignment_id: l.assignment_id,
          source: l.source,
          isPlayed: absIndex < activeAbsIndex,
          is_assessment: !!l.is_assessment,
        };
      });

    return {
      path_id: coursePath.path_id,
      course_id: coursePath.course_id,
      subject_id: coursePath.subject_id,
      framework_id: coursePath.framework_id,
      course_code: coursePath.course_code,
      display_name: coursePath.display_name,
      is_pal_consolidated: coursePath.is_pal_consolidated,
      type: coursePath.type as RECOMMENDATION_TYPE,
      path: newPath,
      completedPath: completedPath,
    };
  }

  return {
    getPath,
    saveLearningPath,
    migrate,
  };
};
