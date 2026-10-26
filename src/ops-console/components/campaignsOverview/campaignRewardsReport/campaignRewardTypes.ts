export type CampaignRewardRow = {
  id: string;
  studentId: string;
  classId: string;
  studentName: string;
  school: string;
  className: string;
  completionPercent: number;
  rewardRank: number | null;
  rewardLabel: string;
  calculatedAt: string | null;
};

export type CampaignRewardSummaryCard = {
  key: string;
  label: string;
  count: number;
  percent: number | null;
  info: string;
};

export const CAMPAIGN_REPORT_SUBTABS = [
  'School Performance',
  'Assignments',
  'Messages',
  'Rewards',
] as const;

export const CAMPAIGN_REPORT_SUBTAB_KEYS = {
  SCHOOL_PERFORMANCE: CAMPAIGN_REPORT_SUBTABS[0],
  ASSIGNMENTS: CAMPAIGN_REPORT_SUBTABS[1],
  MESSAGES: CAMPAIGN_REPORT_SUBTABS[2],
  REWARDS: CAMPAIGN_REPORT_SUBTABS[3],
} as const;

export const CAMPAIGN_REWARD_PAGE_SIZE = 10;
export const CAMPAIGN_REWARD_EXPORT_FILE_NAME = 'CampaignRewards.xlsx';
export const CAMPAIGN_REWARD_EXPORT_SHEET_NAME = 'Campaign Rewards';
export const EMPTY_VALUE = '---';
