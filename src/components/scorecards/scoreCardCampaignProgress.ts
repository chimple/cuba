import {
  CAMPAIGN_GOAL_ANIMATION_SEEN_KEY,
  CAMPAIGN_ICON_ALT,
  CAMPAIGN_ICON_SRC,
  CAMPAIGN_ROW_ID,
  CAMPAIGN_ROW_LABEL,
} from '../../common/constants';
import type { ScoreCardProgressRowData } from './scoreCardTypes';
import { shouldAnimateOnce } from './scoreCardDailyReward';
import { SqliteApi } from '../../services/api/SqliteApi';

export const buildCampaignRow = async (
  studentId?: string,
  courseId?: string,
  assignmentIds?: string[],
): Promise<ScoreCardProgressRowData | null> => {
  if (!studentId || !courseId || !assignmentIds?.length) return null;

  try {
    const progress = await SqliteApi.getI().getActiveCampaignGoalProgress(
      studentId,
      courseId,
      assignmentIds,
    );
    if (
      !progress ||
      !Number.isFinite(progress.current) ||
      !Number.isFinite(progress.total) ||
      progress.total <= 0
    ) {
      return null;
    }

    const total = Math.max(1, progress.total);
    const current = Math.min(Math.max(progress.current, 0), total);
    const completed = current >= total;
    const animateCompletion =
      completed &&
      shouldAnimateOnce(
        [CAMPAIGN_GOAL_ANIMATION_SEEN_KEY, studentId, progress.campaignId].join(
          ':',
        ),
      );

    return {
      id: CAMPAIGN_ROW_ID,
      label: CAMPAIGN_ROW_LABEL,
      current,
      total,
      // Use the supplied local campaign SVG because campaign assignments carry no icon URL.
      iconSrc: CAMPAIGN_ICON_SRC,
      iconAlt: CAMPAIGN_ICON_ALT,
      completed,
      animateCompletion,
    };
  } catch {
    return null;
  }
};
