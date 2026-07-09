export type CampaignsOverviewDisplayValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type CampaignsOverviewDisplayObject = Record<
  string,
  CampaignsOverviewDisplayValue
>;

export interface CampaignsOverviewField {
  key: string;
  label: string;
  value: string;
  durationDayCount?: string;
  isStatus: boolean;
  statusTone?: CampaignsOverviewStatusTone;
}

export interface CampaignsOverviewMetric {
  key: string;
  label: string;
  value: string;
  hasInfo: boolean;
  info: string;
}

export interface CampaignsOverviewCancellationDetails {
  canceledBy: string;
  canceledOn: string;
  messageToAdmin: string;
}

export interface CampaignsOverviewApiResponse {
  data?: CampaignsOverviewApiData | null;
}

export interface CampaignsOverviewApiData {
  campaignId?: string | null;
  campaign?: CampaignsOverviewApiCampaign | null;
  dashboardMetrics?: CampaignsOverviewDashboardMetrics | null;
  avgWeeklyActiveUsers?: number | null;
  avgWeeklyEngagementTimeMinutes?: number | null;
  status?: CampaignListingStatus | string | null;
}

export interface CampaignsOverviewDashboardMetrics {
  campaign_id?: string | null;
  campaign_name?: string | null;
  program_id?: string | null;
  target_audience_id?: string | null;
  is_all_schools?: boolean | null;
  is_all_grades?: boolean | null;
  participating_schools?: number | null;
  total_students?: number | null;
  average_weekly_engagement_time?: number | null;
  active_students?: number | null;
}

export interface CampaignsOverviewApiCampaign {
  comments?: string | null;
  name?: string | null;
  objective?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  updated_at?: string | null;
  campaign_status?: CampaignStatus | null;
  manager?: CampaignsOverviewApiPerson | null;
  program?: CampaignsOverviewApiProgram | null;
}

export interface CampaignsOverviewApiPerson {
  name?: string | null;
}

export interface CampaignsOverviewApiProgram {
  name?: string | null;
  institutes_count?: string | number | null;
  students_count?: string | number | null;
}

export interface CampaignsOverviewViewModel {
  breadcrumb: readonly string[];
  campaignStatus: CampaignsOverviewResolvedStatus;
  summaryData: CampaignsOverviewDisplayObject;
  performanceData: CampaignsOverviewDisplayObject;
  cancellationDetails: CampaignsOverviewCancellationDetails;
}

const EMPTY_VALUE = '--';
const STATUS_KEY = 'status';
const INFO_SUFFIX = 'Info';
const CAMPAIGN_DURATION_KEY = 'campaign duration';
const DAYS_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const CAMPAIGN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_LISTING_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export type CampaignListingStatus =
  (typeof CAMPAIGN_LISTING_STATUS)[keyof typeof CAMPAIGN_LISTING_STATUS];

export type CampaignsOverviewResolvedStatus =
  | CampaignListingStatus
  | typeof EMPTY_VALUE;

export type CampaignsOverviewStatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

const DEFAULT_PERFORMANCE_TOOLTIP_BY_LABEL: Record<string, string> = {
  'Participating Schools':
    'Total number of schools that are part of this campaign.',
  'Total Students': 'Total number of students participating in this campaign.',
  'Average Weekly Engagement Time':
    'Displays the average time students actively spent using the application during the last 7 days.',
  'Avg Weekly Engagement Time':
    'Displays the average time students actively spent using the application during the last 7 days.',
  'Campaign Completion':
    'Displays the percentage of the campaign duration completed.',
  'Active Students':
    'Displays the total number of unique active students during the last 7 days.',
  'Active Participants':
    'Displays the total number of unique active students during the last 7 days.',
};

const STATUS_TONE_BY_VALUE: Record<string, CampaignsOverviewStatusTone> = {
  [CAMPAIGN_STATUS.ACTIVE]: 'success',
  [CAMPAIGN_STATUS.INACTIVE]: 'danger',
  [CAMPAIGN_LISTING_STATUS.IN_PROGRESS]: 'success',
  [CAMPAIGN_LISTING_STATUS.NOT_STARTED]: 'warning',
  [CAMPAIGN_LISTING_STATUS.CANCELLED]: 'danger',
  [CAMPAIGN_LISTING_STATUS.COMPLETED]: 'neutral',
};

export const DEFAULT_CAMPAIGNS_OVERVIEW_TITLE = 'Campaigns';
export const DEFAULT_CAMPAIGNS_OVERVIEW_BREADCRUMB = [
  'Campaigns',
  EMPTY_VALUE,
] as const;
export const DEFAULT_CAMPAIGNS_OVERVIEW_TABS = [
  'Overview',
  'Assignments',
  'Messages',
  'Reports',
] as const;

const formatFieldLabel = (key: string): string =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatValue = (value: CampaignsOverviewDisplayValue): string => {
  if (value === null || value === undefined) return EMPTY_VALUE;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value).trim();
  return text.length > 0 ? text : EMPTY_VALUE;
};

const formatPhrase = (value: CampaignsOverviewDisplayValue): string =>
  formatValue(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const parseDateOnly = (dateText?: string | null): Date | null => {
  if (!dateText) return null;
  const normalizedDateText = dateText.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!normalizedDateText) return null;

  const parts = normalizedDateText.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
};

const formatDateOnly = (dateText?: string | null): string => {
  const date = parseDateOnly(dateText);
  if (!date) return EMPTY_VALUE;
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()} ${date.getUTCFullYear()}`;
};

const formatDateTime = (dateText?: string | null): string => {
  if (!dateText) return EMPTY_VALUE;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(date);
};

const addUtcDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const isUtcSunday = (date: Date): boolean => date.getUTCDay() === 0;

const countCampaignDaysWithoutSundays = (
  startDate?: string | null,
  endDate?: string | null,
): number | null => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end || end < start) return null;

  let dayCount = 0;
  for (
    let dateCursor = start;
    dateCursor <= end;
    dateCursor = addUtcDays(dateCursor, 1)
  ) {
    if (!isUtcSunday(dateCursor)) {
      dayCount += 1;
    }
  }

  return dayCount;
};

const formatCampaignDuration = (
  startDate?: string | null,
  endDate?: string | null,
): string => {
  const durationDays = countCampaignDaysWithoutSundays(startDate, endDate);
  if (durationDays === null) return EMPTY_VALUE;

  return `${formatDateOnly(startDate)} to ${formatDateOnly(endDate)} (${durationDays} Days)`;
};

const formatMinutes = (minutes?: number | null): string =>
  typeof minutes === 'number' && Number.isFinite(minutes)
    ? `${Math.max(0, Math.round(minutes))}m`
    : EMPTY_VALUE;

const normalizeCampaignListingStatus = (
  listingStatus?: CampaignListingStatus | string | null,
  campaignStatus?: CampaignStatus | null,
): CampaignsOverviewResolvedStatus => {
  if (listingStatus) {
    const matchedStatus = Object.values(CAMPAIGN_LISTING_STATUS).find(
      (status) => status.toLowerCase() === listingStatus.toLowerCase(),
    );
    if (matchedStatus) return matchedStatus;
  }

  if (campaignStatus === CAMPAIGN_STATUS.ACTIVE) {
    return CAMPAIGN_LISTING_STATUS.IN_PROGRESS;
  }

  if (campaignStatus === CAMPAIGN_STATUS.INACTIVE) {
    return CAMPAIGN_LISTING_STATUS.COMPLETED;
  }

  return EMPTY_VALUE;
};

const getStatusTone = (status: string): CampaignsOverviewStatusTone => {
  const normalizedStatus = status.trim().toLowerCase();
  return (
    STATUS_TONE_BY_VALUE[normalizedStatus] ||
    STATUS_TONE_BY_VALUE[status] ||
    'neutral'
  );
};

const calculateCampaignCompletion = (
  startDate?: string | null,
  endDate?: string | null,
): string => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return EMPTY_VALUE;

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const totalDays = (end.getTime() - start.getTime()) / DAYS_IN_MILLISECONDS;
  if (totalDays <= 0) return EMPTY_VALUE;

  const elapsedDays = (todayUtc - start.getTime()) / DAYS_IN_MILLISECONDS;
  const percentage = Math.min(
    100,
    Math.max(0, (elapsedDays / totalDays) * 100),
  );

  return `${Math.round(percentage)}%`;
};

export const buildCampaignsOverviewFields = (
  data: CampaignsOverviewDisplayObject,
): CampaignsOverviewField[] =>
  Object.entries(data).map(([key, value]) => {
    const label = formatFieldLabel(key);
    const formattedValue = formatValue(value);
    const isStatus = key.trim().toLowerCase() === STATUS_KEY;
    const durationMatch =
      key.trim().toLowerCase() === CAMPAIGN_DURATION_KEY
        ? formattedValue.match(/^(.*)\((\d+)\s+Days\)$/)
        : null;

    return {
      key,
      label,
      value: durationMatch ? durationMatch[1].trim() : formattedValue,
      durationDayCount: durationMatch ? durationMatch[2] : undefined,
      isStatus,
      statusTone: isStatus ? getStatusTone(formattedValue) : undefined,
    };
  });

export const buildCampaignsOverviewMetrics = (
  data: CampaignsOverviewDisplayObject,
): CampaignsOverviewMetric[] =>
  Object.entries(data)
    .filter(([key]) => !key.endsWith(INFO_SUFFIX))
    .map(([key, value]) => {
      const label = formatFieldLabel(key);
      const infoKey = `${key}${INFO_SUFFIX}`;
      const customInfo = data[infoKey];
      const defaultInfo = DEFAULT_PERFORMANCE_TOOLTIP_BY_LABEL[label] || '';
      const info = customInfo ? formatValue(customInfo) : defaultInfo;

      return {
        key,
        label,
        value: formatValue(value),
        hasInfo: info.length > 0,
        info,
      };
    });

export const buildCampaignsOverviewViewModel = (
  response?: CampaignsOverviewApiResponse,
): CampaignsOverviewViewModel => {
  const campaign = response?.data?.campaign;
  const metrics = response?.data?.dashboardMetrics;
  const program = campaign?.program;
  const status = normalizeCampaignListingStatus(
    response?.data?.status,
    campaign?.campaign_status,
  );
  const campaignName = formatValue(campaign?.name);

  return {
    breadcrumb:
      campaignName === EMPTY_VALUE
        ? DEFAULT_CAMPAIGNS_OVERVIEW_BREADCRUMB
        : ['Campaigns', campaignName],
    campaignStatus: status,
    summaryData: {
      'Campaign Name': campaignName,
      Program: program?.name,
      Objective: formatPhrase(campaign?.objective),
      'Campaign Manager': campaign?.manager?.name,
      'Campaign Duration': formatCampaignDuration(
        campaign?.start_date,
        campaign?.end_date,
      ),
      Status: status,
    },
    performanceData: {
      'Participating Schools':
        metrics?.participating_schools ?? program?.institutes_count,
      'Total Students': metrics?.total_students ?? program?.students_count,
      'Avg Weekly Engagement Time': formatMinutes(
        metrics?.average_weekly_engagement_time ??
          response?.data?.avgWeeklyEngagementTimeMinutes,
      ),
      'Campaign Completion': calculateCampaignCompletion(
        campaign?.start_date,
        campaign?.end_date,
      ),
      'Active Participants':
        metrics?.active_students ?? response?.data?.avgWeeklyActiveUsers,
    },
    cancellationDetails: {
      canceledBy: formatValue(campaign?.manager?.name),
      canceledOn: formatDateTime(campaign?.updated_at),
      messageToAdmin: formatValue(campaign?.comments),
    },
  };
};
