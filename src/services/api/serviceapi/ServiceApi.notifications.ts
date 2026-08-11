export type CampaignNotificationDeliveryMode =
  | 'send_now'
  | 'schedule'
  | 'recurring';

export type CampaignNotificationUserType = 'principal' | 'teacher' | 'student';

export type CampaignNotificationActivityRecency =
  | 'all'
  | 'active_7days'
  | 'inactive_7days';

/**
 * Payload used by the ops-console "New Push Notification" wizard to persist a
 * row in the `campaign_notification` table. The audience is captured as an
 * ad-hoc selection (schools/grades in a program) and materialised into a
 * `campaign_target_audience` row (is_saved=false) by the API implementation.
 */
export type CampaignNotificationPayload = {
  label: string;
  title: string;
  message: string;
  programModel: string;
  userType: CampaignNotificationUserType;
  activityRecency: CampaignNotificationActivityRecency;
  imageUrl?: string | null;
  programId: string;
  schoolIds: string[];
  gradeIds: string[];
  isAllSchools: boolean;
  isAllGrades: boolean;
  deliveryMode: CampaignNotificationDeliveryMode;
  startDate?: string | null;
  sendTime?: string | null;
  endDate?: string | null;
  recurringDays?: string[];
};
