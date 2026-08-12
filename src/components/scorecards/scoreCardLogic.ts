import type { ScoreCardProgressRowData } from './ScoreCardProgressRows';
import {
  buildDailyRewardRow,
  shouldAnimateDailyRewardRow,
} from './scoreCardDailyReward';
import { buildStickerRow } from './scoreCardStickerProgress';
import type { BuildScoreCardProgressRowsParams } from './scoreCardTypes';

export type { ScoreCardProgressRowData } from './ScoreCardProgressRows';
export type { ScoreCardLogicApi } from './scoreCardTypes';

export const buildScoreCardProgressRows = async ({
  api,
  student,
  studentId,
  completedCourseId,
  completedLessonId,
  completedHomeworkIndex,
  animateDailyReward = false,
  showDailyReward = true,
  showStickerProgress = true,
  countCompletedLessonTowardStickerProgress = true,
  allowZeroStickerProgress = false,
  stickerProgressCurrentOverride,
}: BuildScoreCardProgressRowsParams): Promise<ScoreCardProgressRowData[]> => {
  const stickerRow = await buildStickerRow({
    api,
    student,
    studentId,
    completedCourseId,
    completedLessonId,
    completedHomeworkIndex,
    showStickerProgress,
    countCompletedLessonTowardStickerProgress,
    allowZeroStickerProgress,
    stickerProgressCurrentOverride,
  });

  const shouldAnimateDailyReward =
    showDailyReward &&
    shouldAnimateDailyRewardRow(student, studentId, animateDailyReward);
  const dailyRewardRow = showDailyReward
    ? buildDailyRewardRow(shouldAnimateDailyReward)
    : null;

  return [dailyRewardRow, stickerRow].filter(
    (row): row is ScoreCardProgressRowData => Boolean(row),
  );
};
