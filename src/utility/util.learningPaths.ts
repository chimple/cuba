import {
  EVENTS,
  DAILY_USER_REWARD,
  HOMEWORK_PATHWAY,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { ASSIGNMENT_COMPLETED_IDS } from '../common/courseConstants';
import logger from './logger';
import { UtilRewards } from './util.rewards';

declare global {
  interface Window {
    __LIDO_COMMON_AUDIO_PATH__?: string;
  }
}

export interface HotUpdateState {
  status: string;
  progress: number;
  channel: string;
  lastChecked: string;
  lastUpdated: string;
  error: string;
  isAuto: boolean;
}
export class UtilLearningPaths extends UtilRewards {
  static [key: string]: any;
  public static retrieveUserReward() {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) return {};
    const studentId = currentStudent.id;
    try {
      const allRewards = JSON.parse(
        localStorage.getItem(DAILY_USER_REWARD) || '{}',
      );

      if (!allRewards[studentId]) {
        allRewards[studentId] = {};
      }
      const currentReward = allRewards[studentId];

      return currentReward;
    } catch (error) {
      logger.error('Error managing daily user reward in localStorage:', error);
      return {};
    }
  }

  public static async updateHomeworkPath(completedIndex?: number) {
    try {
      const storedPath = localStorage.getItem(HOMEWORK_PATHWAY);
      if (!storedPath) {
        logger.error('Could not find homework path in localStorage to update.');
        return;
      }

      // Snapshot path early to avoid races
      const homeworkPath = JSON.parse(storedPath) as {
        path_id?: string;
        lessons?: any[];
        currentIndex?: number;
      };

      const student = this.getCurrentStudent();
      const studentId = student?.id ?? null;

      // If caller provided which index completed, use that
      if (typeof completedIndex === 'number') {
        const lessons = homeworkPath.lessons ?? [];
        const completedLesson = lessons[completedIndex] ?? null;

        // --- 1) LOG ASSIGNMENT COMPLETED (deduped locally) ---
        try {
          const assignmentId = completedLesson?.assignment_id ?? null;
          if (assignmentId && studentId) {
            const completedKey = ASSIGNMENT_COMPLETED_IDS;
            const temp = localStorage.getItem(completedKey);
            const completedMap = temp ? JSON.parse(temp) : {};
            const studentCompleted = completedMap[studentId] || [];

            if (!studentCompleted.includes(assignmentId)) {
              const assignmentPayload = {
                user_id: studentId,
                student_id: studentId,
                path_id: homeworkPath.path_id ?? null,
                assignment_id: assignmentId,
                lesson_id:
                  completedLesson?.lesson_id ??
                  completedLesson?.lesson?.id ??
                  null,
                chapter_id: completedLesson?.chapter_id ?? null,
                course_id: completedLesson?.course_id ?? null,
                index_in_path: completedIndex,
                completed_at: new Date().toISOString(),
              };

              try {
                this.logEvent(
                  EVENTS.HOMEWORK_PATHWAY_ASSIGNMENT_COMPLETED,
                  assignmentPayload,
                );
              } catch (e) {
                logger.warn(
                  '[Analytics] Failed to log HOMEWORK_PATHWAY_ASSIGNMENT_COMPLETED',
                  e,
                );
              }

              // mark as logged locally
              studentCompleted.push(assignmentId);
              completedMap[studentId] = studentCompleted;
              localStorage.setItem(completedKey, JSON.stringify(completedMap));
            }
          }
        } catch (e) {
          logger.warn('[Analytics] assignment-completed block failed', e);
        }

        // --- 2) Decide if this was the last lesson in the path ---
        const lessonsLen = homeworkPath.lessons?.length ?? 0;
        const newCurrentIndex = completedIndex + 1;
        const isNowComplete = newCurrentIndex >= lessonsLen;

        if (isNowComplete) {
          if (studentId) {
            let preAwardCollectedStickerIds: string[] = [];
            try {
              const currentBookWithProgress =
                await ServiceConfig.getI().apiHandler.getCurrentStickerBookWithProgress(
                  studentId,
                );
              preAwardCollectedStickerIds =
                currentBookWithProgress?.progress?.stickers_collected ?? [];
            } catch {
              preAwardCollectedStickerIds = [];
            }

            const stickerAwardResult =
              await this.tryAwardStickerForCompletedPathway(
                studentId,
                'homework_pathway',
              );
            this.seedPathwayStickerRewardSession({
              studentId,
              stickerAwardResult,
              preAwardCollectedStickerIds,
            });
          } else {
            this.clearPathwayStickerRewardSession();
          }

          // Build and log pathway completed event (using snapshot)
          try {
            const prevIndex = Math.max(completedIndex, 0); // the lesson just completed
            const prev = homeworkPath.lessons?.[prevIndex] ?? null;

            const lessonIds = (homeworkPath.lessons ?? []).map(
              (l: any) => l.lesson_id ?? l.lesson?.id ?? null,
            );
            const assignmentIds = (homeworkPath.lessons ?? []).map(
              (l: any) => l.assignment_id ?? l.id ?? null,
            );

            const completedEvent = {
              user_id: studentId,
              student_id: studentId,
              completed_path_id: homeworkPath.path_id ?? null,
              completed_course_id: prev?.course_id ?? null,
              completed_lesson_id: prev?.lesson_id ?? prev?.lesson?.id ?? null,
              assignment_id: prev?.assignment_id ?? null,
              completed_chapter_id: prev?.chapter_id ?? null,
              total_lessons_in_path: lessonsLen,
              lesson_ids: lessonIds,
              assignment_ids: assignmentIds,
              completed_at: new Date().toISOString(),
              source: 'updateHomeworkPath',
            };

            try {
              this.logEvent(EVENTS.HOMEWORK_PATHWAY_COMPLETED, completedEvent);
            } catch (e) {
              logger.warn(
                '[Analytics] Failed to log HOMEWORK_PATHWAY_COMPLETED',
                e,
              );
            }
          } catch (e) {
            logger.warn('[Analytics] pathway-completed block failed', e);
          }

          // finally remove the path from storage
          localStorage.removeItem(HOMEWORK_PATHWAY);
        } else {
          // Not complete → advance index and persist
          homeworkPath.currentIndex = newCurrentIndex;
          localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(homeworkPath));
        }

        return; // finished handling completedIndex case
      }

      // --- fallback: no completedIndex provided — preserve existing behaviour ---
      const newCurrentIndexFallback = (homeworkPath.currentIndex ?? 0) + 1;
      if (newCurrentIndexFallback >= (homeworkPath.lessons?.length ?? 0)) {
        // path finished
        if (studentId) {
          let preAwardCollectedStickerIds: string[] = [];
          try {
            const currentBookWithProgress =
              await ServiceConfig.getI().apiHandler.getCurrentStickerBookWithProgress(
                studentId,
              );
            preAwardCollectedStickerIds =
              currentBookWithProgress?.progress?.stickers_collected ?? [];
          } catch {
            preAwardCollectedStickerIds = [];
          }

          const stickerAwardResult =
            await this.tryAwardStickerForCompletedPathway(
              studentId,
              'homework_pathway',
            );
          this.seedPathwayStickerRewardSession({
            studentId,
            stickerAwardResult,
            preAwardCollectedStickerIds,
          });
        } else {
          this.clearPathwayStickerRewardSession();
        }

        try {
          // log completed event similar to above (best-effort)
          const lessons = homeworkPath.lessons ?? [];
          const prevIndex = Math.max((homeworkPath.currentIndex ?? 0) - 1, 0);
          const prev = lessons[prevIndex] ?? null;

          const lessonIds = lessons.map(
            (l: any) => l.lesson_id ?? l.lesson?.id ?? null,
          );
          const assignmentIds = lessons.map(
            (l: any) => l.assignment_id ?? l.id ?? null,
          );

          const completedEvent = {
            user_id: studentId,
            student_id: studentId,
            completed_path_id: homeworkPath.path_id ?? null,
            completed_course_id: prev?.course_id ?? null,
            completed_lesson_id: prev?.lesson_id ?? prev?.lesson?.id ?? null,
            assignment_id: prev?.assignment_id ?? null,
            completed_chapter_id: prev?.chapter_id ?? null,
            total_lessons_in_path: lessons.length,
            lesson_ids: lessonIds,
            assignment_ids: assignmentIds,
            completed_at: new Date().toISOString(),
            source: 'updateHomeworkPath',
          };

          try {
            this.logEvent(EVENTS.HOMEWORK_PATHWAY_COMPLETED, completedEvent);
          } catch (e) {
            logger.warn(
              '[Analytics] Failed to log HOMEWORK_PATHWAY_COMPLETED (fallback)',
              e,
            );
          }
        } catch (e) {
          logger.warn('[Analytics] pathway completed (fallback) failed', e);
        }

        localStorage.removeItem(HOMEWORK_PATHWAY);
      } else {
        homeworkPath.currentIndex = newCurrentIndexFallback;
        localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(homeworkPath));
      }
    } catch (error) {
      logger.error('Failed to update homework path:', error);
    }
  }
}
