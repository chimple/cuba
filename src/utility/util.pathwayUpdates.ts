import {
  EVENTS,
  TableTypes,
  RECOMMENDATION_TYPE,
  LEARNING_PATHWAY_MODE,
  CURRENT_PATHWAY_MODE,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import {
  CoursePath,
  LessonNode,
  recommendNextLesson,
  shouldUseAssessment,
} from '../hooks/useLearningPath';
import logger from './logger';
import { UtilPathwayPersistence } from './util.pathwayPersistence';

declare global {
  interface Window {
    __LIDO_COMMON_AUDIO_PATH__?: string;
  }
}
export class UtilPathwayUpdates extends UtilPathwayPersistence {
  static [key: string]: any;
  public static async updateLearningPath(
    currentStudent: TableTypes<'user'>,
    isRewardLesson: boolean,
    isFullPathwayTerminated: boolean = false,
    abortCourseId?: string,
    isAssessmentLesson: boolean = false,
  ) {
    if (!currentStudent) return;
    const storedPathwayMode = localStorage.getItem(CURRENT_PATHWAY_MODE);
    const pathToParse = this.getLatestLearningPathByUpdatedAt(currentStudent);
    const learningPath = pathToParse ? JSON.parse(pathToParse) : null;

    if (!learningPath) return;
    learningPath.updated_at = new Date().toISOString();
    // ABORT CASE: refresh current lesson with PAL recommendation only
    // ABORT CASE: Assessment aborted → rebuild learning path (legacy flow)
    if (isFullPathwayTerminated && abortCourseId && isAssessmentLesson) {
      const courses = learningPath.courses as {
        courseList: CoursePath[];
        currentCourseIndex: number;
      };
      let courseIndex = courses.courseList.findIndex(
        (coursePath: CoursePath) => coursePath.course_id === abortCourseId,
      );

      if (courseIndex === -1) return;

      let course = courses.courseList[courseIndex];
      const courseCodeById = new Map<string, string | null>();
      const getCourseCode = async (coursePath: CoursePath) => {
        const storedCode = coursePath.course_code?.trim().toLowerCase();
        if (storedCode) return storedCode;

        const courseId = coursePath.course_id;
        if (courseCodeById.has(courseId)) {
          return courseCodeById.get(courseId) ?? null;
        }

        try {
          const courseMeta =
            await ServiceConfig.getI().apiHandler.getCourse(courseId);
          const code = courseMeta?.code?.trim().toLowerCase() || null;
          courseCodeById.set(courseId, code);
          return code;
        } catch (error) {
          logger.warn('[LearningPath] Unable to resolve course code', {
            courseId,
            error,
          });
          courseCodeById.set(courseId, null);
          return null;
        }
      };
      course.path.length = 0;
      const nextQueuedLesson = course.path.find(
        (lesson: LessonNode) => lesson.isPlayed === false,
      );
      const nextLesson =
        nextQueuedLesson ??
        (await recommendNextLesson({
          student: currentStudent,
          course: {
            id: course.course_id,
            subject_id: course.subject_id,
            framework_id:
              course.type === RECOMMENDATION_TYPE.FRAMEWORK
                ? 'framework'
                : null,
          },
          mode: storedPathwayMode || LEARNING_PATHWAY_MODE.DISABLED,
          coursePath: course,
          skipAssessment: true,
        }));

      if (nextLesson && !nextQueuedLesson) {
        course.path.push(nextLesson);
      }

      if (
        shouldUseAssessment(
          storedPathwayMode || LEARNING_PATHWAY_MODE.DISABLED,
        ) &&
        course.subject_id
      ) {
        const activeCourseCode = await getCourseCode(course);
        for (const peerCourse of courses.courseList) {
          const peerCourseCode = await getCourseCode(peerCourse);
          if (
            peerCourse === course ||
            peerCourse.subject_id !== course.subject_id ||
            !activeCourseCode ||
            peerCourseCode !== activeCourseCode
          ) {
            continue;
          }

          peerCourse.path.length = 0;
          const peerNextLesson = await recommendNextLesson({
            student: currentStudent,
            course: {
              id: peerCourse.course_id,
              subject_id: peerCourse.subject_id,
              framework_id:
                peerCourse.type === RECOMMENDATION_TYPE.FRAMEWORK
                  ? 'framework'
                  : null,
            },
            mode: storedPathwayMode || LEARNING_PATHWAY_MODE.DISABLED,
            coursePath: peerCourse,
            skipAssessment: true,
          });

          if (peerNextLesson) {
            peerCourse.path.push(peerNextLesson);
          }
        }
      }

      courseIndex += 1;
      if (courseIndex >= courses.courseList.length) {
        courseIndex = 0;
      }
      courses.currentCourseIndex = courseIndex;
      await ServiceConfig.getI().apiHandler.updateLearningPath(
        currentStudent,
        JSON.stringify(learningPath),
      );

      const updatedStudent =
        await ServiceConfig.getI().apiHandler.getUserByDocId(currentStudent.id);

      if (updatedStudent) {
        this.setCurrentStudent(updatedStudent);
      }

      return; // EXIT — do not continue normal flow
    }

    try {
      const PATH_SIZE = 5;
      const api = ServiceConfig.getI().apiHandler;

      const courses = learningPath.courses as {
        courseList: CoursePath[];
        currentCourseIndex: number;
      };
      let courseIndex = courses.currentCourseIndex;
      let course = courses.courseList[courseIndex];
      if (!course) return;
      const courseCodeById = new Map<string, string | null>();
      const getCourseCode = async (coursePath: CoursePath) => {
        const storedCode = coursePath.course_code?.trim().toLowerCase();
        if (storedCode) return storedCode;

        const courseId = coursePath.course_id;
        if (courseCodeById.has(courseId)) {
          return courseCodeById.get(courseId) ?? null;
        }

        try {
          const courseMeta = await api.getCourse(courseId);
          const code = courseMeta?.code?.trim().toLowerCase() || null;
          courseCodeById.set(courseId, code);
          return code;
        } catch (error) {
          logger.warn('[LearningPath] Unable to resolve course code', {
            courseId,
            error,
          });
          courseCodeById.set(courseId, null);
          return null;
        }
      };
      const activeLessonIndex = course.path.findIndex(
        (lesson: LessonNode) => lesson.isPlayed === false,
      );
      const activeLesson =
        activeLessonIndex !== -1 ? course.path[activeLessonIndex] : null;
      if (!activeLesson) {
        logger.warn(
          '[LearningPath] No active lesson found while updating pathway',
          {
            studentId: currentStudent.id,
            courseId: course.course_id,
            courseIndex,
            pathLength: course.path?.length ?? 0,
          },
        );
        return;
      }
      const prevData = {
        pathId: course.path_id,
        courseId: course.course_id,
        lessonId: activeLesson.lesson_id,
        chapterId: activeLesson.chapter_id,
        prevPath_id: course.path_id,
      };
      course.path[activeLessonIndex] = {
        ...activeLesson,
        isPlayed: true,
      };

      const hasQueuedAssessmentInPath = course.path
        .slice(activeLessonIndex + 1)
        .some(
          (lesson: LessonNode) =>
            lesson.isPlayed === false &&
            lesson.is_assessment === true &&
            !!lesson.assignment_id,
        );

      const syncSameSubjectAssessmentPaths = async (
        nextAssessmentLesson: LessonNode | null,
      ) => {
        if (
          !shouldUseAssessment(
            storedPathwayMode || LEARNING_PATHWAY_MODE.DISABLED,
          ) ||
          !activeLesson ||
          !activeLesson.is_assessment ||
          (!course.subject_id && !course.framework_id)
        ) {
          return;
        }

        const activeCourseCode = await getCourseCode(course);
        if (!activeCourseCode) return;

        for (const peerCourse of courses.courseList) {
          const isSameAssessmentGroup =
            !!course.framework_id &&
            !!peerCourse.framework_id &&
            peerCourse.framework_id === course.framework_id
              ? true
              : !!course.subject_id &&
                peerCourse.subject_id === course.subject_id;

          if (peerCourse === course || !isSameAssessmentGroup) {
            continue;
          }

          const peerCourseCode = await getCourseCode(peerCourse);
          if (!peerCourseCode || peerCourseCode !== activeCourseCode) {
            continue;
          }

          const peerActiveLessonIndex = peerCourse.path.findIndex(
            (lesson: LessonNode) =>
              lesson.isPlayed === false &&
              lesson.is_assessment === true &&
              lesson.lesson_id === activeLesson.lesson_id,
          );

          if (peerActiveLessonIndex === -1) continue;

          const peerActiveLesson = peerCourse.path[peerActiveLessonIndex];
          peerCourse.path[peerActiveLessonIndex] = {
            ...peerActiveLesson,
            isPlayed: true,
          };

          if (nextAssessmentLesson) {
            peerCourse.path.push({ ...nextAssessmentLesson });
          }

          if (peerCourse.path.length > PATH_SIZE) {
            const peerActive = peerCourse.path.find(
              (lesson: LessonNode) => !lesson.isPlayed,
            );
            peerCourse.path.length = 0;
            if (peerActive) peerCourse.path.push(peerActive);
            peerCourse.path_id = uuidv4();
            peerCourse.completedPath = (peerCourse.completedPath ?? 0) + 1;
          }
        }
      };

      const completedPathwaySnapshot = JSON.stringify(learningPath);
      const nextLesson = hasQueuedAssessmentInPath
        ? null
        : await recommendNextLesson({
            student: currentStudent,
            course: {
              id: course.course_id,
              subject_id: course.subject_id,
              framework_id:
                course.type === RECOMMENDATION_TYPE.FRAMEWORK
                  ? 'framework'
                  : null,
            },
            mode: storedPathwayMode || LEARNING_PATHWAY_MODE.DISABLED,
            coursePath: course,
          });

      if (nextLesson) {
        course.path.push(nextLesson);
      }
      await syncSameSubjectAssessmentPaths(nextLesson);

      let pathCompleted = false;

      if (course.path.length > PATH_SIZE) {
        // if exceeding max path size i.e '5', remove played lessons from old path keep active lesson from currentPath
        const active = course.path.find(
          (lesson: LessonNode) => !lesson.isPlayed,
        );
        course.path.length = 0;
        if (active) course.path.push(active);
        pathCompleted = true;
      }
      if (pathCompleted) {
        let preAwardCollectedStickerIds: string[] = [];
        try {
          // The active API handler already resolves to sqlite while offline,
          // so use it for the drag-popup seed data in both modes.
          const currentBookWithProgress =
            await ServiceConfig.getI().apiHandler.getCurrentStickerBookWithProgress(
              currentStudent.id,
            );
          preAwardCollectedStickerIds =
            currentBookWithProgress?.progress?.stickers_collected ?? [];
        } catch {
          preAwardCollectedStickerIds = [];
        }
        const newpathId = uuidv4();
        course.path_id = newpathId;
        prevData.pathId = newpathId;
        course.completedPath += 1;
        courseIndex += 1;
        await ServiceConfig.getI().apiHandler.setStarsForStudents(
          currentStudent.id,
          10,
        );
        // If stickers are available (and we're online), award the next sticker for completing this pathway.
        const stickerAwardResult =
          await this.tryAwardStickerForCompletedPathway(currentStudent.id);
        this.seedPathwayStickerRewardSession({
          studentId: currentStudent.id,
          stickerAwardResult,
          preAwardCollectedStickerIds,
          rewardLearningPathSnapshot: completedPathwaySnapshot,
        });
        if (courseIndex >= courses.courseList.length) {
          courseIndex = 0;
        }
        courses.currentCourseIndex = courseIndex;
      }
      const newCourse = courses.courseList[courses.currentCourseIndex];
      const newActiveLesson = newCourse.path.find(
        (lesson: LessonNode) => lesson.isPlayed === false,
      );

      const eventPayload = {
        user_id: currentStudent.id,
        current_path_id: newCourse.path_id,
        current_course_id: newCourse.course_id,
        current_lesson_id: newActiveLesson?.lesson_id ?? null,
        current_chapter_id: newActiveLesson?.chapter_id ?? null,
        path_id: prevData.pathId,
        prev_path_id: prevData.prevPath_id,
        prev_course_id: prevData.courseId,
        lesson_id: prevData.lessonId,
        prev_chapter_id: prevData.chapterId,
        timestamp: new Date().toISOString(),
      };

      const events: EVENTS[] = [EVENTS.PATHWAY_LESSON_END];
      if (pathCompleted) {
        events.push(EVENTS.PATHWAY_COMPLETED, EVENTS.PATHWAY_COURSE_CHANGED);
      }
      await Promise.all([
        api.updateLearningPath(currentStudent, JSON.stringify(learningPath)),
        ...events.map((e) => this.logEvent(e, eventPayload)),
      ]);

      const updatedStudent = await api.getUserByDocId(currentStudent.id);
      if (updatedStudent) {
        this.setCurrentStudent(updatedStudent);
      }
    } catch (error) {
      logger.error('Error updating learning path:', error);
    }
  }
}
