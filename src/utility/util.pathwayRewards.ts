import {
  TableTypes,
  REWARD_LEARNING_PATH,
  STARS_COUNT,
  LATEST_STARS,
  LATEST_LEARNING_PATH,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import logger from './logger';
import { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal';
import { UtilHomeworkPaths } from './util.homeworkPaths';

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
export class UtilPathwayRewards extends UtilHomeworkPaths {
  static [key: string]: any;
  protected static seedPathwayStickerRewardSession({
    studentId,
    stickerAwardResult,
    preAwardCollectedStickerIds,
    rewardLearningPathSnapshot,
  }: {
    studentId: string;
    stickerAwardResult: {
      completed: boolean;
      stickerBookId: string | null;
      awardedStickerId: string | null;
      payload: StickerBookModalData | null;
    };
    preAwardCollectedStickerIds: string[];
    rewardLearningPathSnapshot?: string | null;
  }) {
    const awardedStickerId = stickerAwardResult.awardedStickerId;
    const stickerBookId = stickerAwardResult.stickerBookId;
    const createdAt = new Date().toISOString();

    if (awardedStickerId && rewardLearningPathSnapshot) {
      sessionStorage.setItem(REWARD_LEARNING_PATH, rewardLearningPathSnapshot);
    } else {
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
    }

    if (!awardedStickerId) {
      sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
      sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
      sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
      return;
    }

    sessionStorage.setItem(
      PENDING_PATHWAY_STICKER_REWARD_KEY,
      JSON.stringify({
        studentId,
        awardedStickerId,
        stickerBookId,
        createdAt,
      }),
    );

    if (stickerAwardResult.completed) {
      sessionStorage.setItem(
        AUTO_OPEN_STICKER_PREVIEW_KEY,
        JSON.stringify({
          studentId,
          createdAt,
          awardedStickerId,
          preAwardCollectedStickerIds,
          stickerBookId,
          stickerBookTitle:
            stickerAwardResult.payload?.stickerBookTitle ?? null,
          stickerBookSvgUrl:
            stickerAwardResult.payload?.stickerBookSvgUrl ?? null,
        }),
      );
      sessionStorage.setItem(
        AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
        JSON.stringify({
          studentId,
          stickerBookId,
          createdAt,
          payload: stickerAwardResult.payload,
        }),
      );

      if (stickerAwardResult.payload) {
        window.dispatchEvent(
          new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
            detail: stickerAwardResult.payload,
          }),
        );
      }
      return;
    }

    sessionStorage.setItem(
      AUTO_OPEN_STICKER_PREVIEW_KEY,
      JSON.stringify({
        studentId,
        awardedStickerId,
        preAwardCollectedStickerIds,
        createdAt,
      }),
    );
    sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
  }

  protected static async tryAwardStickerForCompletedPathway(
    studentId: string,
    source: StickerBookModalData['source'] = 'learning_pathway',
  ): Promise<{
    completed: boolean;
    stickerBookId: string | null;
    awardedStickerId: string | null;
    payload: StickerBookModalData | null;
  }> {
    try {
      const api = ServiceConfig.getI().apiHandler;
      const current = await api.getCurrentStickerBookWithProgress(studentId);
      if (!current?.book?.id) {
        return {
          completed: false,
          stickerBookId: null,
          awardedStickerId: null,
          payload: null,
        };
      }

      const nextStickerId = await api.getNextWinnableSticker(
        current.book.id,
        studentId,
      );
      if (!nextStickerId) {
        return {
          completed: false,
          stickerBookId: current.book.id,
          awardedStickerId: null,
          payload: null,
        };
      }

      const currentCollectedStickerIds =
        current.progress?.stickers_collected ?? [];
      const totalStickerCount =
        current.book?.total_stickers ||
        current.book?.stickers_metadata?.length ||
        0;
      const nextCollectedStickerIds = currentCollectedStickerIds.includes(
        nextStickerId,
      )
        ? currentCollectedStickerIds
        : [...currentCollectedStickerIds, nextStickerId];
      const completed =
        totalStickerCount > 0 &&
        nextCollectedStickerIds.length >= totalStickerCount;

      await api.updateStickerWon(current.book.id, nextStickerId, studentId);

      return {
        completed,
        stickerBookId: current.book.id,
        awardedStickerId: nextStickerId,
        payload: completed
          ? {
              source,
              stickerBookId: current.book.id,
              stickerBookTitle: current.book.title || 'Sticker Book',
              stickerBookSvgUrl: current.book.svg_url || '',
              collectedStickerIds: nextCollectedStickerIds,
              totalStickerCount,
            }
          : null,
      };
    } catch (error) {
      logger.warn('[StickerBook] Failed to award pathway sticker:', error);
      return {
        completed: false,
        stickerBookId: null,
        awardedStickerId: null,
        payload: null,
      };
    }
  }

  // this function is created because local sqlite database was updating after UI rendering,
  // so it was showing old learning path until we refresh the page,
  // to avoid this checking the updated_at of learning path in session storage and database and returning the latest one

  public static getLatestLearningPathByUpdatedAt(
    student: TableTypes<'user'>,
  ): string | null {
    try {
      const rewardLearningPath = sessionStorage.getItem(REWARD_LEARNING_PATH);
      if (rewardLearningPath) {
        return rewardLearningPath;
      }

      const latestLearningPathKey = `${LATEST_LEARNING_PATH}:${student.id}`;
      const sessionData = localStorage.getItem(latestLearningPathKey);

      // If nothing in local storage, return DB value
      if (!sessionData) {
        return student?.learning_path ?? null;
      }
      const studentLearningPath = student.learning_path
        ? JSON.parse(student.learning_path)
        : null;
      const parsed = JSON.parse(sessionData);

      // If session data belongs to different student, ignore it
      if (parsed.studentId !== student.id) {
        return student?.learning_path ?? null;
      }

      const sessionUpdatedAt = new Date(parsed.updated_at).getTime();
      const dbUpdatedAt = studentLearningPath?.updated_at
        ? new Date(studentLearningPath.updated_at).getTime()
        : 0;

      // Compare timestamps
      if (sessionUpdatedAt > dbUpdatedAt) {
        return parsed.learningPath;
      }

      return student?.learning_path ?? null;
    } catch (error) {
      logger.error('Error resolving latest learning path:', error);
      return student?.learning_path ?? null;
    }
  }

  // In this.ts or your utility file

  public static getLocalStarsForStudent(
    studentId: string,
    fallback: number = 0,
  ): number {
    try {
      const storedStarsJson = localStorage.getItem(STARS_COUNT);
      const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};
      const localStarsRaw = storedStarsMap[studentId];

      const latestStarsRaw = localStorage.getItem(LATEST_STARS(studentId));

      const localStars = Number.isFinite(+localStarsRaw)
        ? parseInt(localStarsRaw, 10)
        : 0;
      const latestStars = Number.isFinite(+(latestStarsRaw ?? '0'))
        ? parseInt(latestStarsRaw ?? '0', 10)
        : 0;

      // ✅ FIXED: Prioritize local > latest > fallback, seed local if needed
      let bestLocal = Math.max(localStars, latestStars);

      if (bestLocal === 0 && fallback > 0) {
        // First load: seed localStorage with DB value
        bestLocal = fallback;
        this.setLocalStarsForStudent(studentId, bestLocal);
      }
      return bestLocal;
    } catch (e) {
      logger.warn('[this.getLocalStarsForStudent] failed, using fallback', e);
      return fallback;
    }
  }

  public static async fetchCurrentClassAndSchool(): Promise<{
    className: string;
    schoolName: string;
  }> {
    const currentStudent = this.getCurrentStudent();
    let className = '';
    let schoolName = '';
    if (currentStudent?.id) {
      try {
        const api = ServiceConfig.getI().apiHandler;
        const linkedData = await api.getStudentClassesAndSchools(
          currentStudent.id,
        );
        if (linkedData && linkedData.classes.length > 0) {
          const classDoc = linkedData.classes[0];
          className = classDoc.name || '';

          const schoolDoc = linkedData.schools.find(
            (s: any) => s.id === classDoc.school_id,
          );
          schoolName = schoolDoc?.name || '';
        }
      } catch (error) {
        logger.error('Error fetching class/school details:', error);
      }
    }
    return { className, schoolName };
  }

  // Write a specific star count into BOTH STARS_COUNT and LATEST_STARS

  public static setLocalStarsForStudent(
    studentId: string,
    stars: number,
  ): void {
    try {
      const storedStarsJson = localStorage.getItem(STARS_COUNT);
      const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};
      storedStarsMap[studentId] = stars;
      localStorage.setItem(STARS_COUNT, JSON.stringify(storedStarsMap));

      localStorage.setItem(LATEST_STARS(studentId), stars.toString());
    } catch (e) {
      logger.warn('[this.setLocalStarsForStudent] failed', e);
    }
  }

  // Add delta to local stars and fire a DOM event so React screens can react immediately

  public static bumpLocalStarsForStudent(
    studentId: string,
    delta: number,
    fallback: number = 0,
  ): number {
    const current = this.getLocalStarsForStudent(studentId, fallback);
    const next = current + delta;
    this.setLocalStarsForStudent(studentId, next);

    try {
      window.dispatchEvent(
        new CustomEvent('starsUpdated', {
          detail: { studentId, newStars: next },
        }),
      );
    } catch (e) {
      logger.warn('[this.bumpLocalStarsForStudent] event dispatch failed', e);
    }

    return next;
  }

  public static isVersionAllowed(upto: string, current: string): boolean {
    const u = upto.split('.').map((n) => parseInt(n, 10));
    const c = current.split('.').map((n) => parseInt(n, 10));

    for (let i = 0; i < Math.max(u.length, c.length); i++) {
      const nu = u[i] || 0;
      const nc = c[i] || 0;

      if (nu > nc) return true;
      if (nu < nc) return false;
    }

    return true;
  }
}
