import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { v4 as uuidv4 } from 'uuid';
import { EVENTS, RECOMMENDATION_TYPE, TableTypes } from '../common/constants';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import {
  LearningPath,
  LearningPathStudent,
  LearningPathCourseInput,
  StoredCoursePath,
  LegacyCoursePath,
  LegacyLessonNode,
  LessonNode,
  shouldUseAssessment,
  buildPath,
  hasAssessmentProgress,
  buildSameFrameworkAssessmentPath,
  hasInProgressAssessmentPath,
  mergeAssignedAssessmentIdsIntoPath,
  toAssignedAssessmentPath,
  getAssignedAssessmentNodeKey,
  recommendNextLesson,
} from './useLearningPath.helpers';
import { normalizeCourseToken } from './useLearningPath.courseSorting';

export * from './useLearningPath.helpers';
export * from './useLearningPath.courseSorting';

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
      if (shouldUseAssessment(pathMode) && shouldUseAssessment(mode)) {
        learningPath.pathMode = mode;
        const res = await updateLearningPathIfNeeded(
          learningPath,
          courses,
          currentStudent,
          mode,
          classId,
        );
        if (res.updated) learningPath = res.learningPath;
        learningPath.pathMode = mode;
        learningPath.updated_at = new Date().toISOString();
        await saveLearningPath(currentStudent, learningPath);
        return learningPath;
      }

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

    const findSameAssessmentPath = (course: LearningPathCourseInput) => {
      const frameworkId = course.framework_id;
      const courseCode = normalizeCourseToken(course.code);
      if (!frameworkId && (!course.subject_id || !courseCode)) return null;

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

          if (!hasAssessmentProgress(coursePath.path)) return false;
          if (coursePath.subject_id !== (course.subject_id ?? null)) {
            return false;
          }
          if (pathCourseCode && courseCode && pathCourseCode !== courseCode) {
            return false;
          }
          if (!frameworkId && (!pathCourseCode || !courseCode)) {
            return false;
          }

          return frameworkId ? pathFrameworkId === frameworkId : true;
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
        const sameFrameworkAssessmentSource = findSameAssessmentPath(course);
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
