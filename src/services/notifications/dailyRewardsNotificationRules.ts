import { SOURCE } from '../../common/constants';
import {
  DailyRewardsActivitySource,
  DailyRewardsNotificationCampaign,
  DailyRewardsNumericCondition,
  DailyRewardsTriggerCondition,
} from './dailyRewardsNotificationsConfig';

export type StudentActivity = {
  records: Array<{ date: string; source: string | null }>;
  dates: Set<string>;
  completedCount: number;
  completedDates: string[];
};
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
export function matchesCampaign(
  campaign: DailyRewardsNotificationCampaign,
  date: Date,
  futureOffset: number,
  activity: StudentActivity,
): boolean {
  const scopedActivity = activityForSources(
    activity,
    campaign.activity_sources,
  );
  if (campaign.trigger) {
    // Future activity is unknown, so evaluate using the child's known
    // history only. This projects inactivity correctly (for example, a
    // four-day inactivity rule starts on the fourth inactive day) while
    // assuming no future pathway lesson is completed.
    return matchesTrigger(campaign.trigger, date, scopedActivity);
  }
  const legacyEligibility =
    campaign.id === 'morning_played'
      ? { activity: 'played' as const, relative_day: 'previous_day' as const }
      : campaign.id === 'morning_missed'
        ? {
            activity: 'not_played' as const,
            relative_day: 'previous_day' as const,
          }
        : {
            activity: 'not_played' as const,
            relative_day: 'same_day' as const,
          };
  const eligibility = campaign.eligibility ?? legacyEligibility;
  const referenceDate = new Date(date);
  if (eligibility.relative_day === 'previous_day') {
    referenceDate.setDate(referenceDate.getDate() - 1);
  }

  // Future activity is unknown. Queue only the "not played" variants and
  // replace the queue as soon as a pathway lesson is completed.
  if (futureOffset > 0) {
    return eligibility.activity === 'not_played';
  }
  const played = playedOn(scopedActivity.dates, referenceDate);
  return eligibility.activity === 'played' ? played : !played;
}

export function matchesTrigger(
  trigger: NonNullable<DailyRewardsNotificationCampaign['trigger']>,
  date: Date,
  activity: StudentActivity,
): boolean {
  if (!Array.isArray(trigger.conditions) || !trigger.conditions.length) {
    return false;
  }
  const results = trigger.conditions.map((condition) =>
    matchesTriggerCondition(condition, date, activity),
  );
  return (trigger.match ?? 'all') === 'any'
    ? results.some(Boolean)
    : results.every(Boolean);
}

export function matchesTriggerCondition(
  condition: DailyRewardsTriggerCondition,
  date: Date,
  activity: StudentActivity,
): boolean {
  if ('type' in condition) {
    if (condition.type === 'inactive_for_days') {
      return (
        Number.isInteger(condition.days) &&
        condition.days > 0 &&
        inactiveDays(activity.dates, date) >= condition.days
      );
    }
    if (condition.type === 'played_streak') {
      if (
        !Number.isInteger(condition.days) ||
        condition.days < 1 ||
        (condition.ending !== 'today' && condition.ending !== 'yesterday')
      ) {
        return false;
      }
      const endingDate = new Date(date);
      if (condition.ending === 'yesterday') {
        endingDate.setDate(endingDate.getDate() - 1);
      }
      return (
        activeDays(activity.dates, endingDate, condition.days) ===
        condition.days
      );
    }
    if (condition.type === 'played_days_ago') {
      if (!Number.isInteger(condition.days) || condition.days < 0) {
        return false;
      }
      const playedDate = new Date(date);
      playedDate.setDate(playedDate.getDate() - condition.days);
      return playedOn(activity.dates, playedDate);
    }
    if (condition.type === 'played' || condition.type === 'not_played') {
      if (condition.day !== 'today' && condition.day !== 'yesterday') {
        return false;
      }
      const referenceDate = new Date(date);
      if (condition.day === 'yesterday') {
        referenceDate.setDate(referenceDate.getDate() - 1);
      }
      const played = playedOn(activity.dates, referenceDate);
      return condition.type === 'played' ? played : !played;
    }
    return false;
  }
  if (!Number.isFinite(condition.value)) return false;
  const referenceDate = new Date(date);
  referenceDate.setDate(
    referenceDate.getDate() + (condition.relative_days ?? 0),
  );
  const windowDays = Math.max(1, Math.floor(condition.window_days ?? 1));
  let actual: number;

  switch (condition.metric) {
    case 'inactive_days':
      actual = inactiveDays(activity.dates, referenceDate);
      break;
    case 'active_days':
      actual = activeDays(activity.dates, referenceDate, windowDays);
      break;
    case 'activity_count':
      actual = condition.window_days
        ? activityCount(activity.completedDates, referenceDate, windowDays)
        : activity.completedCount;
      break;
    default:
      return false;
  }
  return compare(actual, condition.operator, condition.value);
}

function compare(
  actual: number,
  operator: DailyRewardsNumericCondition['operator'],
  expected: number,
): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return actual > expected;
    case 'gte':
      return actual >= expected;
    case 'lt':
      return actual < expected;
    case 'lte':
      return actual <= expected;
    default:
      return false;
  }
}

function activityForSources(
  activity: StudentActivity,
  configuredSources?: DailyRewardsActivitySource[],
): StudentActivity {
  const sources: DailyRewardsActivitySource[] = configuredSources?.length
    ? configuredSources
    : (['home_pathway', 'homework_pathway'] as const);
  const selectedSources = sources.filter(
    (source): source is Exclude<DailyRewardsActivitySource, 'all'> =>
      source !== 'all',
  );
  const records = sources.includes('all')
    ? activity.records
    : activity.records.filter((record) =>
        selectedSources.some((source) =>
          recordMatchesSource(record.source, source),
        ),
      );
  return {
    records,
    dates: new Set(records.map((record) => record.date)),
    completedCount: records.length,
    completedDates: records.map((record) => record.date),
  };
}

function recordMatchesSource(
  resultSource: string | null,
  configuredSource: Exclude<DailyRewardsActivitySource, 'all'>,
): boolean {
  switch (configuredSource) {
    case 'home_pathway':
      return (
        resultSource === SOURCE.LEARNING_PATHWAY_HOME_NO_PAL ||
        resultSource === SOURCE.LEARNING_PATHWAY_HOME_PAL
      );
    case 'homework_pathway':
      return resultSource === SOURCE.LEARNING_PATHWAY_HOMEWORK;
    case 'subject_page':
      return resultSource === SOURCE.SUBJECT_PAGE;
    case 'live_quiz':
      return resultSource === SOURCE.LIVE_QUIZ_ROOM;
    case 'initial_assessment':
      return resultSource === SOURCE.INITIAL_ASSESSMENT;
  }
}

function playedOn(playedDates: Set<string>, date: Date): boolean {
  return playedDates.has(dateKey(date));
}

function inactiveDays(playedDates: Set<string>, date: Date): number {
  const sortedDates = [...playedDates].sort();
  const latest = sortedDates[sortedDates.length - 1];
  if (!latest) return Number.MAX_SAFE_INTEGER;
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const lastActive = new Date(`${latest}T00:00:00`);
  return Math.max(
    0,
    Math.floor((current.getTime() - lastActive.getTime()) / 86_400_000),
  );
}

function activeDays(
  playedDates: Set<string>,
  date: Date,
  windowDays: number,
): number {
  return activityDatesInWindow(playedDates, date, windowDays).size;
}

function activityCount(
  completedDates: string[],
  date: Date,
  windowDays: number,
): number {
  const end = dateKey(date);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - windowDays + 1);
  const start = dateKey(startDate);
  return completedDates.filter(
    (completedDate) => completedDate >= start && completedDate <= end,
  ).length;
}

function activityDatesInWindow(
  playedDates: Set<string>,
  date: Date,
  windowDays: number,
): Set<string> {
  const end = dateKey(date);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - windowDays + 1);
  const start = dateKey(startDate);
  return new Set(
    [...playedDates].filter(
      (playedDate) => playedDate >= start && playedDate <= end,
    ),
  );
}
