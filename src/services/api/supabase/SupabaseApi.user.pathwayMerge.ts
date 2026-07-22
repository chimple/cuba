import { LEARNING_PATHWAY_MODE, TABLES } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiUserStudentMerge } from './SupabaseApi.user.studentMerge';
export interface SupabaseApiUserPathwayMerge {
  [key: string]: any;
}
export class SupabaseApiUserPathwayMerge extends SupabaseApiUserStudentMerge {
  async updateFcUserFormsContactUserId(
    oldStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase not initialized.' };
    }
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from(TABLES.FcUserForms)
      .update({
        contact_user_id: newStudentId,
        updated_at: now,
      })
      .eq('contact_user_id', oldStudentId)
      .eq('is_deleted', false);

    if (error) {
      return {
        success: false,
        message: `Failed to update fc_user_forms contact_user_id: ${error.message}`,
      };
    }
    return { success: true, message: 'fc_user_forms updated successfully.' };
  }
  async mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized.');
    }

    try {
      const now = new Date().toISOString();

      /**
       * Safely parse learning_path JSON
       */
      const parseLearningPath = (value: unknown): any => {
        if (!value) return {};
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        }
        if (typeof value === 'object') return value;
        return {};
      };

      /**
       * Get lesson path safely
       */
      const getPath = (course: any): any[] =>
        Array.isArray(course?.path) ? course.path : [];

      /**
       * Get currently active lesson
       */
      const getActiveLesson = (course: any): any | undefined => {
        const path = getPath(course);
        return (
          path.find((lesson: any) => lesson?.isPlayed === false) ?? path[0]
        );
      };

      /**
       * Get active chapter id
       */
      const getActiveChapterId = (course: any): string | undefined => {
        const chapterId = getActiveLesson(course)?.chapter_id;
        return chapterId ? String(chapterId) : undefined;
      };

      /**
       * Get course id
       */
      const getCourseId = (course: any): string | undefined => {
        const courseId = course?.course_id;
        return courseId !== undefined && courseId !== null
          ? String(courseId)
          : undefined;
      };

      /**
       * Count played lessons
       */
      const getPlayedCount = (course: any): number =>
        getPath(course).filter((l: any) => l?.isPlayed === true).length;

      /**
       * Count remaining lessons
       */
      const getRemainingCount = (course: any): number =>
        getPath(course).filter((l: any) => l?.isPlayed === false).length;

      const hasAssignedAssessment = (course: any): boolean =>
        getPath(course).some(
          (lesson: any) =>
            lesson?.is_assessment === true && lesson?.isPlayed === false,
        );

      const hasCompletedAssessment = (course: any): boolean =>
        getPath(course).some(
          (lesson: any) =>
            lesson?.is_assessment === true && lesson?.isPlayed === true,
        );

      /**
       * Fetch both students learning_path
       */
      const { data: oldUser, error: oldUserError } = await this.supabase
        .from(TABLES.User)
        .select('learning_path')
        .eq('id', existingStudentId)
        .eq('is_deleted', false)
        .single();
      if (oldUserError) {
        throw new Error(
          `Failed to fetch source learning_path: ${oldUserError.message}`,
        );
      }

      const { data: newUser, error: newUserError } = await this.supabase
        .from(TABLES.User)
        .select('learning_path')
        .eq('id', newStudentId)
        .eq('is_deleted', false)
        .single();
      if (newUserError) {
        throw new Error(
          `Failed to fetch destination learning_path: ${newUserError.message}`,
        );
      }

      const oldPathway = parseLearningPath(oldUser?.learning_path);
      const newPathway = parseLearningPath(newUser?.learning_path);

      const oldPathMode = oldPathway?.pathMode;
      const newPathMode = newPathway?.pathMode;

      /**
       * -----------------------------
       * MODE MERGE RULES
       * -----------------------------
       *
       * Priority:
       * PAL > AssessmentOnly > Disabled
       */

      const mergedPathMode = (() => {
        if (
          oldPathMode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE ||
          newPathMode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE
        ) {
          return LEARNING_PATHWAY_MODE.FULL_ADAPTIVE;
        }

        if (
          oldPathMode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY ||
          newPathMode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY
        ) {
          return LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY;
        }

        if (
          oldPathMode === LEARNING_PATHWAY_MODE.DISABLED &&
          newPathMode === LEARNING_PATHWAY_MODE.DISABLED
        ) {
          return LEARNING_PATHWAY_MODE.DISABLED;
        }

        return newPathMode ?? oldPathMode;
      })();

      /**
       * Extract courses
       */
      const oldCourses = Array.isArray(oldPathway?.courses?.courseList)
        ? oldPathway.courses.courseList
        : [];

      const newCourses = Array.isArray(newPathway?.courses?.courseList)
        ? newPathway.courses.courseList
        : [];

      /**
       * Edge case:
       * both pathways empty
       */
      if (!oldCourses.length && !newCourses.length) {
        return {
          success: true,
          message: 'Both pathways empty.',
        };
      }

      /**
       * Fetch chapter sort indexes
       */
      const chapterIds: string[] = Array.from(
        new Set(
          [...oldCourses, ...newCourses]
            .map((course) => getActiveChapterId(course))
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const chapterSortMap = new Map<string, number>();

      if (chapterIds.length) {
        const { data: chapters, error: chaptersError } = await this.supabase
          .from(TABLES.Chapter)
          .select('id, sort_index')
          .in('id', chapterIds);
        if (chaptersError) {
          throw new Error(
            `Failed to fetch chapter sort indexes: ${chaptersError.message}`,
          );
        }

        for (const c of chapters ?? []) {
          chapterSortMap.set(String(c.id), c.sort_index ?? -1);
        }
      }

      const getActiveSortIndex = (course: any): number => {
        const chapterId = getActiveChapterId(course);
        if (!chapterId) return -1;
        return chapterSortMap.get(chapterId) ?? -1;
      };

      /**
       * ----------------------------------------
       * Decide which course is more progressed
       * ----------------------------------------
       */

      const pickMoreProgressedCourse = (
        oldCourse: any,
        newCourse: any,
      ): any => {
        if (!oldCourse) return newCourse;
        if (!newCourse) return oldCourse;

        const oldPlayed = getPlayedCount(oldCourse);
        const newPlayed = getPlayedCount(newCourse);

        const oldRemaining = getRemainingCount(oldCourse);
        const newRemaining = getRemainingCount(newCourse);

        const oldChapterSort = getActiveSortIndex(oldCourse);
        const newChapterSort = getActiveSortIndex(newCourse);

        /**
         * PAL
         */
        if (mergedPathMode === LEARNING_PATHWAY_MODE.FULL_ADAPTIVE) {
          return newCourse ?? oldCourse;
        }

        /**
         * AssessmentOnly rules
         */
        if (mergedPathMode === LEARNING_PATHWAY_MODE.ASSESSMENT_ONLY) {
          const chooseByProgress = (): any => {
            if (oldPlayed !== newPlayed) {
              return oldPlayed > newPlayed ? oldCourse : newCourse;
            }

            if (oldRemaining !== newRemaining) {
              return oldRemaining < newRemaining ? oldCourse : newCourse;
            }

            return newCourse;
          };

          const oldAssessmentCompleted = hasCompletedAssessment(oldCourse);
          const newAssessmentCompleted = hasCompletedAssessment(newCourse);
          const oldHasAssignedAssessment = hasAssignedAssessment(oldCourse);
          const newHasAssignedAssessment = hasAssignedAssessment(newCourse);

          /**
           * If assessment completed → prefer that student
           */
          if (oldAssessmentCompleted !== newAssessmentCompleted) {
            return oldAssessmentCompleted ? oldCourse : newCourse;
          }

          /**
           * If both have assigned assessment → choose more progress.
           */
          if (oldHasAssignedAssessment && newHasAssignedAssessment) {
            return chooseByProgress();
          }

          /**
           * If only one has assigned assessment:
           * - if student without assessment already started lessons, keep them
           * - else choose the assigned-assessment pathway
           */
          if (oldHasAssignedAssessment !== newHasAssignedAssessment) {
            const studentWithoutAssessmentCourse = oldHasAssignedAssessment
              ? newCourse
              : oldCourse;
            const hasStartedWithoutAssessment =
              getPlayedCount(studentWithoutAssessmentCourse) > 0;

            if (hasStartedWithoutAssessment) {
              return studentWithoutAssessmentCourse;
            }

            return oldHasAssignedAssessment ? oldCourse : newCourse;
          }

          /**
           * Fallback for AssessmentOnly: choose more progress.
           */
          return chooseByProgress();
        }

        /**
         * Disabled mode
         * compare chapter progress
         */
        if (mergedPathMode === LEARNING_PATHWAY_MODE.DISABLED) {
          if (oldChapterSort !== newChapterSort) {
            return oldChapterSort > newChapterSort ? oldCourse : newCourse;
          }

          return oldPlayed > newPlayed ? oldCourse : newCourse;
        }

        return newCourse;
      };

      /**
       * Merge courses by course_id
       */

      const mergedByCourseId = new Map<string, any>();

      for (const course of newCourses) {
        const id = getCourseId(course);
        if (id) mergedByCourseId.set(id, course);
      }

      for (const oldCourse of oldCourses) {
        const id = getCourseId(oldCourse);
        if (!id) continue;

        const existing = mergedByCourseId.get(id);

        if (!existing) {
          mergedByCourseId.set(id, oldCourse);
          continue;
        }

        mergedByCourseId.set(id, pickMoreProgressedCourse(oldCourse, existing));
      }

      const mergedCourses = Array.from(mergedByCourseId.values());

      /**
       * Safe currentCourseIndex
       */

      const safeIndex = Math.max(
        0,
        Math.min(
          newPathway?.courses?.currentCourseIndex ??
            oldPathway?.courses?.currentCourseIndex ??
            0,
          mergedCourses.length - 1,
        ),
      );

      /**
       * Final merged pathway
       */

      const updatedPathway = {
        ...oldPathway,
        ...newPathway,
        pathMode: mergedPathMode,
        updated_at: now,
        courses: {
          ...(oldPathway?.courses || {}),
          ...(newPathway?.courses || {}),
          courseList: mergedCourses,
          currentCourseIndex: safeIndex,
        },
      };

      /**
       * Update destination student
       */

      const { error: pathwayUpdateError } = await this.supabase
        .from(TABLES.User)
        .update({
          learning_path: JSON.stringify(updatedPathway),
          updated_at: now,
        })
        .eq('id', newStudentId);
      if (pathwayUpdateError) {
        throw new Error(
          `Failed to update merged learning_path: ${pathwayUpdateError.message}`,
        );
      }

      return {
        success: true,
        message: 'Learning pathway merged successfully.',
      };
    } catch (error: any) {
      logger.error('MERGE PATHWAY ERROR:', error);

      return {
        success: false,
        message: error?.message || 'Failed to merge pathway.',
      };
    }
  }
}
