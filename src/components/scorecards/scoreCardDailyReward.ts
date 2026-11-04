import {
  DAILY_REWARD_ANIMATION_RECENCY_MS,
  DAILY_REWARD_ANIMATION_SEEN_KEY,
  DAILY_REWARD_ICON_ALT,
  DAILY_REWARD_ICON_SRC,
  DAILY_REWARD_LABEL,
  DAILY_REWARD_ROW_ID,
} from '../../common/constants';
import type { TableTypes } from '../../common/constants';
import type { ScoreCardProgressRowData } from './ScoreCardProgressRows';
import type { DailyRewardSnapshot } from './scoreCardTypes';

const parseDailyRewardSnapshot = (
  reward: string | DailyRewardSnapshot | undefined | null,
): DailyRewardSnapshot => {
  if (!reward) return null;
  if (typeof reward !== 'string') return reward;

  try {
    return JSON.parse(reward) as DailyRewardSnapshot;
  } catch {
    return null;
  }
};

export const getDailyRewardDay = (timestamp?: string | null) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime())
    ? date.toISOString().split('T')[0]
    : null;
};

const getDailyRewardAnimationKey = (
  studentId: string | undefined,
  rewardId: string,
  rewardDay: string,
) =>
  [
    DAILY_REWARD_ANIMATION_SEEN_KEY,
    studentId ?? 'unknown',
    rewardId,
    rewardDay,
  ].join(':');

export const shouldAnimateOnce = (storageKey: string) => {
  if (typeof sessionStorage === 'undefined') return true;
  if (sessionStorage.getItem(storageKey) === 'true') return false;

  sessionStorage.setItem(storageKey, 'true');
  return true;
};

export const shouldAnimateDailyRewardRow = (
  student: TableTypes<'user'> | undefined,
  studentId: string | undefined,
  requestedAnimation: boolean,
): boolean => {
  const reward = parseDailyRewardSnapshot(student?.reward);
  const today = new Date().toISOString().split('T')[0];
  const rewardDay = getDailyRewardDay(reward?.timestamp);

  if (!reward?.reward_id || rewardDay !== today) return false;

  const rewardTime = new Date(reward.timestamp ?? '').getTime();
  const isRecentlyCollected =
    Number.isFinite(rewardTime) &&
    Date.now() - rewardTime >= 0 &&
    Date.now() - rewardTime <= DAILY_REWARD_ANIMATION_RECENCY_MS;

  if (!requestedAnimation && !isRecentlyCollected) return false;

  const storageKey = getDailyRewardAnimationKey(
    studentId ?? student?.id,
    reward.reward_id,
    rewardDay,
  );

  return shouldAnimateOnce(storageKey);
};

export const hasDailyRewardEarnedToday = (
  student: TableTypes<'user'> | undefined,
): boolean => {
  const reward = parseDailyRewardSnapshot(student?.reward);
  return Boolean(
    reward?.reward_id &&
      getDailyRewardDay(reward.timestamp) ===
        new Date().toISOString().split('T')[0],
  );
};

export const buildDailyRewardRow = (
  earned: boolean,
  animateCompletion = false,
): ScoreCardProgressRowData => ({
  id: DAILY_REWARD_ROW_ID,
  label: DAILY_REWARD_LABEL,
  current: earned ? 1 : 0,
  total: 1,
  iconSrc: DAILY_REWARD_ICON_SRC,
  iconAlt: DAILY_REWARD_ICON_ALT,
  completed: earned,
  animateCompletion: earned && animateCompletion,
});
