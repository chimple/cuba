import {
  BADGE_GOAL_ANIMATION_SEEN_KEY,
  BADGE_ICON_ALT,
  BADGE_ROW_ID,
  BADGE_ROW_LABEL,
} from '../../common/constants';
import {
  BADGE_MILESTONE_STEP,
  LAST_BADGE_MILESTONE,
} from '../../common/Badges/badgeProgress';
import type { TableTypes } from '../../common/constants';
import type {
  ScoreCardLogicApi,
  ScoreCardProgressRowData,
} from './scoreCardTypes';
import { shouldAnimateOnce } from './scoreCardDailyReward';

export const buildBadgeRow = async (
  api: ScoreCardLogicApi,
  studentId: string | undefined,
  completedLessonId: string | undefined,
  progressSnapshot?: TableTypes<'user_badge_progress'>,
  milestoneReached?: number | null,
): Promise<ScoreCardProgressRowData | null> => {
  if (!studentId || !completedLessonId || !api.getUserBadgeProgress) {
    return null;
  }

  try {
    const progress =
      progressSnapshot ?? (await api.getUserBadgeProgress(studentId));
    const rawLessonsPlayed = progress?.lessons_played_count ?? 0;
    if (!Number.isFinite(rawLessonsPlayed)) return null;
    const lessonsPlayed = Math.max(0, rawLessonsPlayed);
    if (
      lessonsPlayed > LAST_BADGE_MILESTONE ||
      (lessonsPlayed === LAST_BADGE_MILESTONE &&
        milestoneReached !== LAST_BADGE_MILESTONE)
    ) {
      return null;
    }

    const total = BADGE_MILESTONE_STEP;
    const completedMilestone =
      milestoneReached === lessonsPlayed &&
      lessonsPlayed > 0 &&
      lessonsPlayed % total === 0;
    const current = completedMilestone ? total : lessonsPlayed % total;
    const badgeMilestone = Math.min(
      completedMilestone
        ? lessonsPlayed
        : (Math.floor(lessonsPlayed / total) + 1) * total,
      LAST_BADGE_MILESTONE,
    );
    const normalizedCurrent = current;
    const completed = normalizedCurrent === total;
    const animateCompletion =
      completed &&
      milestoneReached === badgeMilestone &&
      shouldAnimateOnce(
        [BADGE_GOAL_ANIMATION_SEEN_KEY, studentId, badgeMilestone].join(':'),
      );

    return {
      id: BADGE_ROW_ID,
      label: BADGE_ROW_LABEL,
      current: normalizedCurrent,
      total,
      iconAlt: BADGE_ICON_ALT,
      badgeMilestone,
      completed,
      animateCompletion,
    };
  } catch {
    return null;
  }
};
