import { EVENTS, SOURCE } from '../common/constants';

export type PathwayStickerSource = 'learning_pathway' | 'homework_pathway';

export function getPathwayStickerCollectedEvent(
  source?: PathwayStickerSource | string | null,
): EVENTS {
  return source === 'homework_pathway'
    ? EVENTS.HW_PATHWAY_STICKER_COLLECTED
    : EVENTS.HOME_PATHWAY_STICKER_COLLECTED;
}

export function getDailyRewardClaimedEvent(source?: SOURCE | null): EVENTS {
  if (source === SOURCE.LEARNING_PATHWAY_HOMEWORK) {
    return EVENTS.HW_DAILY_REWARD_CLAIMED;
  }

  if (
    source === SOURCE.LEARNING_PATHWAY_HOME_NO_PAL ||
    source === SOURCE.LEARNING_PATHWAY_HOME_PAL
  ) {
    return EVENTS.HOME_DAILY_REWARD_CLAIMED;
  }

  return EVENTS.REWARD_COLLECTED;
}
