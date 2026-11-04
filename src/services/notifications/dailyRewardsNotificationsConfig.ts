export const DAILY_REWARDS_NOTIFICATIONS_CONFIG =
  'daily_rewards_notifications_config';

/** A numeric fact calculated locally from a student's completed activities. */
export type DailyRewardsTriggerMetric =
  | 'inactive_days'
  | 'active_days'
  | 'activity_count';

/** Lesson origins that a campaign may include in its activity calculation. */
export type DailyRewardsActivitySource =
  | 'all'
  | 'home_pathway'
  | 'homework_pathway'
  | 'subject_page'
  | 'live_quiz'
  | 'initial_assessment';

/** Readable day-based rules for common notification campaigns. */
export type DailyRewardsNamedCondition =
  | { type: 'played' | 'not_played'; day: 'today' | 'yesterday' }
  | { type: 'inactive_for_days'; days: number }
  | { type: 'played_streak'; days: number; ending: 'today' | 'yesterday' }
  | { type: 'played_days_ago'; days: number };

/** Existing numeric rule format remains supported for advanced conditions. */
export type DailyRewardsNumericCondition = {
  /**
   * `inactive_days`: calendar days since the most recent activity.
   * `active_days`: distinct activity dates in `window_days` (default 1).
   * `activity_count`: completed activities in `window_days`; omitted means all time.
   */
  metric: DailyRewardsTriggerMetric;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: number;
  /** Calendar-day window for active_days/activity_count. Must be at least 1. */
  window_days?: number;
  /** Shifts the evaluation date; -1 means the day before the notification. */
  relative_days?: number;
};

export type DailyRewardsTriggerCondition =
  | DailyRewardsNamedCondition
  | DailyRewardsNumericCondition;

export type DailyRewardsLanguage = 'en' | 'hi' | 'kn';

/**
 * A JSON-only rule evaluated for each child. New thresholds and combinations
 * can be published in GrowthBook without a client release.
 */
export type DailyRewardsTrigger = {
  match?: 'all' | 'any';
  conditions: DailyRewardsTriggerCondition[];
};

export type DailyRewardsNotificationCampaign = {
  id: string;
  trigger_time: string;
  /** Android notification channel configured in the GrowthBook channels object. */
  channel_id?: string;
  /** Overrides the global template repeat window for this campaign. */
  cooldown_days?: number;
  /** Defaults to Home and Homework pathways for existing configurations. */
  activity_sources?: DailyRewardsActivitySource[];
  /** JSON-controlled user activity condition for this timing. */
  eligibility?: {
    activity: 'played' | 'not_played';
    relative_day: 'same_day' | 'previous_day';
  };
  /** Preferred configurable rule. Takes precedence over legacy eligibility. */
  trigger?: DailyRewardsTrigger;
  templates: Array<{
    id: string;
    weight: number;
    title: string;
    body: string;
    /** Optional student-language copy. English title/body above are the fallback. */
    translations?: Partial<
      Record<
        Exclude<DailyRewardsLanguage, 'en'>,
        {
          id?: string;
          title: string;
          body: string;
          fallback_child_name?: string;
        }
      >
    >;
    fallback_child_name?: string;
    image_id?: string;
    /** Full HTTPS image URL. Takes precedence over image_id + asset_base_url. */
    image_url?: string;
    deep_links: Array<'home' | 'homework'>;
  }>;
};

export type DailyRewardsNotificationsConfig = {
  global_enable: boolean;
  /** Legacy image folder; unnecessary when templates use image_url. */
  asset_base_url?: string;
  asset_version?: string;
  max_lookahead_days: number;
  anti_spam_cooldown_days: number;
  channels: Record<string, { name: string; description: string }>;
  campaigns: DailyRewardsNotificationCampaign[];
};

// Safe fallback: notifications are not sent until GrowthBook enables the flag.
export const DAILY_REWARDS_NOTIFICATIONS_DEFAULT: DailyRewardsNotificationsConfig =
  {
    global_enable: false,
    asset_base_url: '',
    asset_version: '1',
    max_lookahead_days: 7,
    anti_spam_cooldown_days: 2,
    channels: {
      daily_rewards: {
        name: 'Daily rewards',
        description: 'Daily learning reward reminders',
      },
    },
    campaigns: [],
  };
