import {
  CHIMPLE_DIGITAL_SKILLS,
  CURRENT_SELECTED_COURSE,
  LEARNING_PATHWAY_MODE,
  TableTypes,
} from '../../common/constants';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import { ServiceConfig } from '../ServiceConfig';
import type {
  PredictiveDownloadContext,
  PredictiveDownloadDependencies,
  PredictiveDownloadQueue,
  PredictiveDownloadType,
  StoredLearningPath,
} from './PredictiveDownloadService';

const DIGITAL_SKILLS_NAME = 'digital skills';

const parseLearningPath = (
  value: string | null | undefined,
): StoredLearningPath | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as StoredLearningPath;
  } catch {
    return null;
  }
};

export class PredictiveDownloadServiceNotJoined {
  public static async run(
    student: TableTypes<'user'>,
    dependencies: PredictiveDownloadDependencies,
  ): Promise<void> {
    const learningPath = parseLearningPath(student.learning_path);
    const courses = await this.getCourses(student.id, learningPath);
    if (!courses.length) {
      logger.info('[***] No courses found', {
        page:
          typeof window === 'undefined' ? 'unknown' : window.location.pathname,
      });
      return;
    }
    const eligibleCourses = await this.getEligibleCourses(courses);
    if (!eligibleCourses.length) {
      logger.info('[***] No eligible courses', {
        availableCourseCount: courses.length,
        availableCourses: courses.map((course) => ({
          id: course.id,
          name: course.name,
        })),
      });
      return;
    }

    logger.info('[***] Assignment check: mode=no_class, pending=0');
    const queue: PredictiveDownloadQueue = {
      lessonIds: [],
      courseByLessonId: new Map(),
    };

    // No class means no assignment lookup; assessment is followed by the
    // sequential fallback for the remaining slots.
    for (const course of eligibleCourses) {
      const assessmentIsClosed = dependencies.completedAssessmentCourses.has(
        `${student.id}:${course.id}`,
      );
      const assessments = assessmentIsClosed
        ? []
        : await this.getIndependentAssessmentIds(course, student);
      this.addCourseLessons(queue, course, assessments, 'assessment');

      // Completed or terminated assessments resolve to no pending lessons;
      // use all five slots for the normal non-PAL pathway in that case.
      const remainingSlots = Math.max(
        dependencies.bufferSize - assessments.length,
        0,
      );
      const isNonPalCourse =
        learningPath?.pathMode !== LEARNING_PATHWAY_MODE.FULL_ADAPTIVE ||
        !course.framework_id;
      if (!isNonPalCourse || remainingSlots === 0) continue;

      const normalLessons = await this.getNextSequentialLessons(
        course,
        learningPath,
        remainingSlots,
      );
      this.addCourseLessons(queue, course, normalLessons, 'normal');
    }

    await dependencies.downloadMissingLessons(
      queue.lessonIds,
      queue.courseByLessonId,
    );
  }

  private static async getCourses(
    studentId: string,
    learningPath: StoredLearningPath | null,
  ): Promise<TableTypes<'course'>[]> {
    const api = ServiceConfig.getI().apiHandler;
    let courses = await api.getCoursesForPathway(studentId);
    if (!courses.length) {
      // On native/offline login, user_course can be empty while learning_path
      // already contains the student's valid course assignments.
      const courseIds = (learningPath?.courses?.courseList ?? [])
        .map((course) => course.course_id)
        .filter((courseId): courseId is string => Boolean(courseId));
      const pathwayCourses = await api.getCourses([...new Set(courseIds)]);
      const coursesById = new Map(
        pathwayCourses.map((course) => [course.id, course]),
      );
      courses = courseIds
        .map((courseId) => coursesById.get(courseId))
        .filter((course): course is TableTypes<'course'> => Boolean(course));
    }
    return this.orderSelectedCourse(courses);
  }

  private static orderSelectedCourse(
    courses: TableTypes<'course'>[],
  ): TableTypes<'course'>[] {
    let selectedCourseId: string | undefined =
      Util.getCurrentCourse(undefined)?.id;
    if (!selectedCourseId) {
      try {
        selectedCourseId = (
          JSON.parse(
            localStorage.getItem(CURRENT_SELECTED_COURSE) || 'null',
          ) as { id?: string } | null
        )?.id;
      } catch {
        selectedCourseId = undefined;
      }
    }
    if (!selectedCourseId) return courses;
    const selectedIndex = courses.findIndex(
      (course) => course.id === selectedCourseId,
    );
    if (selectedIndex <= 0) return courses;
    return [
      courses[selectedIndex],
      ...courses.slice(0, selectedIndex),
      ...courses.slice(selectedIndex + 1),
    ];
  }

  private static async getEligibleCourses(
    courses: TableTypes<'course'>[],
  ): Promise<TableTypes<'course'>[]> {
    const eligibleCourses: TableTypes<'course'>[] = [];
    for (const course of courses) {
      if (!(await this.isExcludedCourse(course))) {
        eligibleCourses.push(course);
      }
    }
    return eligibleCourses;
  }

  private static async isExcludedCourse(
    course: TableTypes<'course'>,
  ): Promise<boolean> {
    if (course.id === CHIMPLE_DIGITAL_SKILLS) return true;
    if (!course.subject_id) return false;
    const subject = await ServiceConfig.getI().apiHandler.getSubject(
      course.subject_id,
    );
    return subject?.name?.trim().toLowerCase() === DIGITAL_SKILLS_NAME;
  }

  private static async getIndependentAssessmentIds(
    course: TableTypes<'course'>,
    student: TableTypes<'user'>,
  ): Promise<string[]> {
    // Assessment state is independent from the pathway snapshot. The API
    // filters completed/terminated lessons for this exact student and course.
    if (!course.subject_id) return [];

    const subjectLessons =
      await ServiceConfig.getI().apiHandler.getSubjectLessonsBySubjectId(
        course.subject_id,
        student,
        course.id,
        true,
      );
    return Array.from(
      new Set(
        subjectLessons
          .map((lesson) => lesson.lesson_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ).slice(0, 5);
  }

  private static async getNextSequentialLessons(
    course: TableTypes<'course'>,
    learningPath: StoredLearningPath | null,
    limit: number,
  ): Promise<string[]> {
    const api = ServiceConfig.getI().apiHandler;
    const chapters = await api.getChaptersForCourse(course.id);
    let orderedLessonIds = (
      await Promise.all(
        chapters.map((chapter) => api.getLessonsForChapter(chapter.id)),
      )
    )
      .flat()
      .map((lesson) => lesson.id);

    const coursePath = learningPath?.courses?.courseList?.find(
      (path) => path.course_id === course.id,
    );
    if (!orderedLessonIds.length) {
      orderedLessonIds = (coursePath?.path ?? [])
        .filter((lesson) => lesson.lesson_id && !lesson.is_assessment)
        .map((lesson) => lesson.lesson_id)
        .filter((lessonId): lessonId is string => Boolean(lessonId));
    }
    if (!orderedLessonIds.length) return [];

    const playedIds = (coursePath?.path ?? [])
      .filter((lesson) => lesson.isPlayed && !lesson.is_assessment)
      .map((lesson) => lesson.lesson_id);
    let lastPlayedId = playedIds[playedIds.length - 1];
    if (!lastPlayedId) {
      const lastPlayed = await api.getLessonLastPlayed(orderedLessonIds);
      lastPlayedId = [...lastPlayed]
        .sort(
          (a, b) =>
            new Date(b.last_played ?? 0).getTime() -
            new Date(a.last_played ?? 0).getTime(),
        )
        .find((lesson) => lesson.last_played)?.lesson_id;
    }

    const lastIndex = orderedLessonIds.findIndex(
      (lessonId) => lessonId === lastPlayedId,
    );
    return orderedLessonIds.slice(
      Math.max(lastIndex + 1, 0),
      Math.max(lastIndex + 1, 0) + limit,
    );
  }

  private static addCourseLessons(
    queue: PredictiveDownloadQueue,
    course: TableTypes<'course'>,
    lessonIds: string[],
    download: PredictiveDownloadType,
  ): void {
    for (const lessonId of lessonIds) {
      if (queue.courseByLessonId.has(lessonId)) continue;
      const context: PredictiveDownloadContext = {
        courseId: course.id,
        courseName: course.name,
        download,
        subject: course.name?.trim() || course.id,
      };
      queue.courseByLessonId.set(lessonId, context);
      queue.lessonIds.push(lessonId);
    }
  }
}
