import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  PENDING_FINAL_HOMEWORK_COMPLETE_AFTER_STICKER_FLOW_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
} from '../common/constants';
import { Util } from './util';

type PendingFinalHomeworkStickerFlow = {
  studentId: string;
  createdAt: string;
};

const matchesCurrentStudent = (studentId?: string | null): boolean => {
  const currentStudentId = Util.getCurrentStudent()?.id;
  return Boolean(
    studentId && currentStudentId && studentId === currentStudentId,
  );
};

const hasStudentScopedSessionValue = (storageKey: string): boolean => {
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    return matchesCurrentStudent(parsed?.studentId);
  } catch {
    return false;
  }
};

export const getPendingFinalHomeworkStickerFlow =
  (): PendingFinalHomeworkStickerFlow | null => {
    const raw = sessionStorage.getItem(
      PENDING_FINAL_HOMEWORK_COMPLETE_AFTER_STICKER_FLOW_KEY,
    );
    if (!raw) return null;

    try {
      const parsed = JSON.parse(
        raw,
      ) as Partial<PendingFinalHomeworkStickerFlow>;
      if (!matchesCurrentStudent(parsed.studentId)) return null;
      if (!parsed.createdAt || typeof parsed.createdAt !== 'string') {
        return null;
      }

      return {
        studentId: parsed.studentId!,
        createdAt: parsed.createdAt,
      };
    } catch {
      return null;
    }
  };

export const hasPendingFinalHomeworkStickerFlow = (): boolean =>
  Boolean(getPendingFinalHomeworkStickerFlow());

export const hasPendingHomeworkStickerSession = (): boolean =>
  hasStudentScopedSessionValue(AUTO_OPEN_STICKER_PREVIEW_KEY) ||
  hasStudentScopedSessionValue(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY) ||
  hasStudentScopedSessionValue(PENDING_PATHWAY_STICKER_REWARD_KEY);

export const hasPendingHomeworkStickerFlow = (): boolean =>
  hasPendingHomeworkStickerSession() || hasPendingFinalHomeworkStickerFlow();

export const setPendingFinalHomeworkStickerFlow = (studentId: string): void => {
  if (!studentId) return;

  sessionStorage.setItem(
    PENDING_FINAL_HOMEWORK_COMPLETE_AFTER_STICKER_FLOW_KEY,
    JSON.stringify({
      studentId,
      createdAt: new Date().toISOString(),
    }),
  );
};

export const clearPendingFinalHomeworkStickerFlow = (): void => {
  sessionStorage.removeItem(
    PENDING_FINAL_HOMEWORK_COMPLETE_AFTER_STICKER_FLOW_KEY,
  );
};
