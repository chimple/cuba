import { EVENTS, SOURCE } from '../common/constants';
import {
  getDailyRewardClaimedEvent,
  getPathwayStickerCollectedEvent,
} from './rewardEvents';

describe('reward analytics event resolvers', () => {
  test('resolves pathway-specific sticker collection events', () => {
    expect(getPathwayStickerCollectedEvent('homework_pathway')).toBe(
      EVENTS.HW_PATHWAY_STICKER_COLLECTED,
    );
    expect(getPathwayStickerCollectedEvent('learning_pathway')).toBe(
      EVENTS.HOME_PATHWAY_STICKER_COLLECTED,
    );
  });

  test('resolves pathway-specific daily reward events', () => {
    expect(getDailyRewardClaimedEvent(SOURCE.LEARNING_PATHWAY_HOMEWORK)).toBe(
      EVENTS.HW_DAILY_REWARD_CLAIMED,
    );
    expect(
      getDailyRewardClaimedEvent(SOURCE.LEARNING_PATHWAY_HOME_NO_PAL),
    ).toBe(EVENTS.HOME_DAILY_REWARD_CLAIMED);
    expect(getDailyRewardClaimedEvent(SOURCE.LEARNING_PATHWAY_HOME_PAL)).toBe(
      EVENTS.HOME_DAILY_REWARD_CLAIMED,
    );
  });

  test('keeps existing daily reward event for non-pathway sources', () => {
    expect(getDailyRewardClaimedEvent()).toBe(EVENTS.REWARD_COLLECTED);
    expect(getDailyRewardClaimedEvent(SOURCE.SUBJECT_PAGE)).toBe(
      EVENTS.REWARD_COLLECTED,
    );
  });
});
