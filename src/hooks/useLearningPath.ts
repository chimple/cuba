import { useCallback, useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import { palUtil } from "../utility/palUtil";
import { v4 as uuidv4 } from "uuid";
import {
  EVENTS,
  RECOMMENDATION_TYPE,
  LEARNING_PATHWAY_MODE,
  TableTypes,
  LANGUAGE,
} from "../common/constants";
import { updateLocalAttributes, useGbContext } from "../growthbook/Growthbook";

export type LearningPath = {
  courses: {
    courseList: CoursePath[];
    currentCourseIndex: number;
  };
  type: RECOMMENDATION_TYPE;
  pathMode: string;
};

export type CoursePath = {
  path_id: string;
  course_id: string;
  subject_id: string;
  type: RECOMMENDATION_TYPE;
  path: LessonNode[]; // played + ONE active
  completedPath: number;
};

export type LessonNode = {
  lesson_id: string;
  chapter_id?: string | undefined;
  is_assessment: boolean;
  isPlayed: boolean;
};

export const shouldUseAssessment = (mode: string) =>
  mode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY ||
  mode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE;

export const shouldUsePAL = (mode: string) =>
  mode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE;

export async function buildPath({
  student,
  courses,
  mode,
}: {
  student: any;
  courses: any[];
  mode: string;
}): Promise<LearningPath> {
  const isLinked = await ServiceConfig.getI().apiHandler.isStudentLinked(
    student.id,
  );
  const currClassId = isLinked ? schoolUtil.getCurrentClass()?.id : null;
  const courseList = await Promise.all(
    courses.map(async (course) => {
      const activeLesson = await recommendNextLesson({
        student,
        course,
        mode,
        classId: currClassId || undefined,
      });

      return {
        path_id: uuidv4(),
        course_id: course.id,
        subject_id: course.subject_id,
        type: course.framework_id
          ? RECOMMENDATION_TYPE.FRAMEWORK
          : RECOMMENDATION_TYPE.CHAPTER,
        path: activeLesson ? [activeLesson] : [],
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
  };
}

export async function recommendNextLesson({
  student,
  course,
  mode,
  classId,
  coursePath,
}: {
  student: any;
  course: any;
  mode: string;
  classId?: string;
  coursePath?: any;
}): Promise<LessonNode | null> {
  const api = ServiceConfig.getI().apiHandler;

  /* -------------------------------
   * 1️⃣ TEACHER ASSIGNED ASSESSMENT
   * ------------------------------- */
  const rawResults = await api.isStudentPlayedPalLesson(student.id, course.id);
  if (classId) {
    const assessments = await api.getLatestAssessmentGroup(
      classId,
      student,
      course.id,
    );

    if (assessments && assessments.length > 0) {
      const lesosn = {
        lesson_id: assessments[0].lesson_id,
        chapter_id: undefined,
        is_assessment: true,
        isPlayed: false,
      };

      return lesosn;
    }
  }

  /* ------------------------------------------------------------------------------------------
   * 2️⃣ MODE-BASED ASSESSMENT (assessment only/full adaptive mode with pal lesson not played )
   * ------------------------------------------------------------------------------------------ */
  if (shouldUseAssessment(mode) && !rawResults) {
    const res = await api.getSubjectLessonsBySubjectId(
      course.subject_id,
      student,
    );
    if (res && res.id) {
      const lesson = {
        lesson_id: res.lesson_id,
        chapter_id: undefined,
        is_assessment: true,
        isPlayed: false,
      };
      return lesson;
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
      const Lesson = {
        lesson_id: palLesson.lesson_id,
        chapter_id: palLesson.chapter_id,
        is_assessment: false,
        isPlayed: false,
      };
      return Lesson;
    }
  }

  /* -----------------------------------
   * 4️⃣ NORMAL CHAPTER FLOW (DEFAULT)
   * ----------------------------------- */
  const chapters = await api.getChaptersForCourse(course.id);
  for (const ch of chapters) {
    const lessons = await api.getLessonsForChapter(ch.id);
    const lastPlayedLesson = getLastPlayedLesson(coursePath, "normal");
    const next = getNextFromList(
      lessons.map((l: any) => ({ ...l, chapter_id: ch.id })),
      lastPlayedLesson,
      false,
    );

    if (next) return next;
  }

  return null;
}

export function getNextFromList(
  lessons: any[],
  lastPlayedLesson?: LessonNode,
  isAssessment = false,
): LessonNode | null {
  if (!lessons?.length) return null;

  if (!lastPlayedLesson) {
    const first = lessons[0];
    return {
      lesson_id: first.lesson_id ?? first.id,
      chapter_id: first.chapter_id || undefined,
      is_assessment: isAssessment,
      isPlayed: false,
    };
  }

  const index = lessons.findIndex(
    (l) => (l.lesson_id ?? l.id) === lastPlayedLesson.lesson_id,
  );

  const next = lessons[index + 1];
  if (!next) return null;

  return {
    lesson_id: next.lesson_id ?? next.id,
    chapter_id: next.chapter_id || undefined,
    is_assessment: isAssessment,
    isPlayed: false,
  };
}

export const sortCoursesByStudentLanguage = async (
  courses: any[],
  student: any,
) => {
  // 1. Try Local Storage first
  const localLanguageCode = localStorage.getItem(LANGUAGE)?.toLowerCase();
  if (localLanguageCode) {
    const targetCourses = courses.filter(
      (c) => c.code?.toLowerCase() === localLanguageCode,
    );

    if (targetCourses.length > 0) {
      const otherCourses = courses.filter(
        (c) => c.code?.toLowerCase() !== localLanguageCode,
      );
      return [...targetCourses, ...otherCourses];
    }
  }

  // 2. Fallback: API Call
  if (!student?.language_id) return courses;

  try {
    const language = await ServiceConfig.getI().apiHandler.getLanguageWithId(
      student.language_id,
    );
    if (!language) return courses;

    const languageCode = language.code?.toLowerCase();
    const languageName = language.name?.trim().toLowerCase();

    // Priority 1: Match by Code
    if (languageCode) {
      const targetCourses = courses.filter(
        (c) => c.code?.toLowerCase() === languageCode,
      );
      if (targetCourses.length > 0) {
        const otherCourses = courses.filter(
          (c) => c.code?.toLowerCase() !== languageCode,
        );
        return [...targetCourses, ...otherCourses];
      }
    }

    // Priority 2: Match by Name (if code match failed)
    if (languageName) {
      const targetCourses = courses.filter(
        (c) => c.name?.trim().toLowerCase() === languageName,
      );
      if (targetCourses.length > 0) {
        const otherCourses = courses.filter(
          (c) => c.name?.trim().toLowerCase() !== languageName,
        );
        return [...targetCourses, ...otherCourses];
      }
    }
  } catch (e) {
    console.error("Error sorting courses by language", e);
  }

  return courses;
};

export function getLastPlayedLesson(
  coursePath: any,
  type: "assessment" | "normal",
): LessonNode | undefined {
  if (!coursePath?.path?.length) return undefined;

  const wantAssessment = type === "assessment";

  for (let i = coursePath.path.length - 1; i >= 0; i--) {
    const lesson = coursePath.path[i];
    if (lesson.isPlayed === true && lesson.is_assessment === wantAssessment) {
      return lesson;
    }
  }
  return undefined;
}

export const useLearningPath = (opts?: {
  student?: any;
  gb?: any;
  onGbUpdate?: (b: boolean) => void;
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const { setGbUpdated } = useGbContext();

  async function getPath({
    courses,
    mode,
    classId,
  }: {
    courses: any[];
    mode: string;
    classId?: string;
  }) {
    let currentStudent = Util.getCurrentStudent();
    if (!currentStudent) return;
    let learningPath = currentStudent?.learning_path
      ? JSON.parse(currentStudent.learning_path)
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

      if (!currentCourse) return;
      const coursePath = currentCourse.path ?? [];
      if (!coursePath.length) return;

      const activeLesson = coursePath.find((l: any) => l.isPlayed === false);
      const lastPlayedLesson = [...coursePath]
        .reverse()
        .find((l: any) => l.isPlayed === true);

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

      if (!currentCourse) return;
      const coursePath = currentCourse.path ?? [];
      if (!coursePath.length) return;

      const activeLesson = coursePath.find((l: any) => l.isPlayed === false);
      const lastPlayedLesson = [...coursePath]
        .reverse()
        .find((l: any) => l.isPlayed === true);

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
      const hasOldStructure = learningPath.courses.courseList.some(
        (c: any) =>
          c.currentIndex !== undefined ||
          c.startIndex !== undefined ||
          c.pathEndIndex !== undefined,
      );

      if (hasOldStructure) {
        learningPath.courses.courseList = learningPath.courses.courseList.map(
          (coursePath: any) => migrate(coursePath),
        );
        learningPath.pathMode = mode;
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

    // 🔁 Recompute ONLY active lesson
    // for (const coursePath of learningPath.courses.courseList) {
      // let active = coursePath.path.find((l: LessonNode) => !l.isPlayed);
      // if(!active) {
      //   active = await recommendNextLesson({
      //     student:currentStudent,
      //     course: courses.find((c) => c.id === coursePath.course_id),
      //     mode,
      //     classId,
      //     coursePath,
      //   });
      //   }

      //   coursePath.path = [
      //     ...(lastPlayed ? [{ ...lastPlayed, isPlayed: true }] : []),
      //     ...(active ? [active] : []),
      //   ];
    // }

    const total_learning_path_completed =
      learningPath.courses.courseList.reduce(
        (total, course) => total + (course.completedPath ?? 0),
        0
      );

    const learning_path_completed =
      learningPath.courses.courseList[learningPath.courses.currentCourseIndex].completedPath ?? 0;
    // update local attributes    
    updateLocalAttributes({
      learning_path_completed,
      total_learning_path_completed,
    });

    setGbUpdated(true);

    return learningPath;
  }

  const updateLearningPathIfNeeded = async (
    learningPath: any,
    userCourses: any[],
    student: TableTypes<"user">,
    mode: string,
    classId?: string,
  ) => {
    const oldCourseList = learningPath.courses?.courseList || [];

    /* -----------------------------------
     * Save current active courseId
     * ----------------------------------- */
    const oldCurrentIndex = learningPath.courses.currentCourseIndex ?? 0;
    const oldCurrentCourseId = oldCourseList[oldCurrentIndex]?.course_id;

    /* -----------------------------------
     * Identity checks
     * ----------------------------------- */
    const oldIds = oldCourseList.map((c: any) => c.course_id);
    const newIds = userCourses.map((c) => c.id);

    const sameCourses =
      oldIds.length === newIds.length &&
      newIds.every((id) => oldIds.includes(id));

    const sameOrder =
      sameCourses && newIds.every((id, idx) => id === oldIds[idx]);

    if (sameOrder) {
      return { updated: false, learningPath };
    }

    /* -----------------------------------
     * Sync courses (reuse by id)
     * ----------------------------------- */
    const existingMap = new Map<string, any>();
    oldCourseList.forEach((c: any) => existingMap.set(c.course_id, c));

    const newCourseList: any[] = [];

    for (const course of userCourses) {
      const existing = existingMap.get(course.id);

      if (existing) {
        // ✅ Preserve entire course state
        newCourseList.push(existing);
      } else {
        // ➕ New course → build fresh
        const activeLesson = await recommendNextLesson({
          student,
          course,
          mode,
          classId,
        });

        newCourseList.push({
          path_id: uuidv4(),
          course_id: course.id,
          subject_id: course.subject_id,
          type: course.framework_id
            ? RECOMMENDATION_TYPE.FRAMEWORK
            : RECOMMENDATION_TYPE.CHAPTER,
          path: activeLesson ? [activeLesson] : [],
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
    await saveLearningPath(student, learningPath);

    return { updated: true, learningPath };
  };

  async function saveLearningPath(student: any, path: LearningPath) {
    const pathStr = JSON.stringify(path);
    await api.updateLearningPath(student, pathStr, false);
    await Util.setCurrentStudent({ ...student, learning_path: pathStr });
  }

  function migrate(coursePath: any) {
    const lessons = coursePath.path || [];

    const startIndex = coursePath.startIndex ?? 0;
    const currentIndex = coursePath.currentIndex ?? 0;

    // active lesson absolute index
    const activeAbsIndex = startIndex + currentIndex;
    // Correct completed count
    const completedPath = Math.max(0, Math.floor(startIndex / 5));

    // slice exactly the same window user was seeing
    const windowLessons = lessons.slice(0, Math.min(lessons.length, 5));

    const newPath: LessonNode[] = windowLessons
      .filter((_, idx) => startIndex + idx <= activeAbsIndex)
      .map((l: any, idx: number) => {
        const absIndex = startIndex + idx;
        return {
          lesson_id: l.lesson_id,
          chapter_id: l.chapter_id,
          isPlayed: absIndex < activeAbsIndex,
          is_assessment: !!l.is_assessment,
        };
      });

    return {
      path_id: coursePath.path_id,
      course_id: coursePath.course_id,
      subject_id: coursePath.subject_id,
      type: coursePath.type,
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
