import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import {
  PERCENTAGE_BAND,
  PERCENTAGE_BAND_META,
  PERCENTAGE_BAND_TRANSLATION_KEYS,
  FilteredSchoolsForSchoolListingOps,
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
  SCHOOL_PERFORMANCE_STATUS,
  SCHOOL_PERFORMANCE_STATUS_VALUES,
  SCHOOL_PERFORMANCE_TRANSLATION_KEYS,
  SCHOOL_LISTING_STATUS_META,
  type PercentageBandValue,
  type SchoolPerformanceStatusValue,
} from '../../common/constants';
import type { Column } from '../components/DataTableBody';
import type { SchoolListRow } from './SchoolList.fetcher';

export type SchoolMetricRow = FilteredSchoolsForSchoolListingOps;

export const DEFAULT_DATE_RANGE = '7d';

export const DATE_RANGE_OPTIONS = [
  { label: t('Last 7 Days'), value: '7d' },
  { label: t('Last 15 Days'), value: '15d' },
  { label: t('Last 30 Days'), value: '30d' },
] as const;

export type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]['value'];

export type Filters = Record<string, string[]>;
export type PercentBand = PercentageBandValue;
export type SchoolPerformanceFilterValue = SchoolPerformanceStatusValue;
export type PercentageFilterKey =
  | 'activatedStudents'
  | 'activeStudents'
  | 'activeTeachers';
export type PercentageFilters = Partial<
  Record<PercentageFilterKey, PercentBand>
>;
export type SchoolListExportColumn = {
  key: keyof SchoolListRow;
  label: string;
  part: 'value' | 'percent';
};

export const PERCENTAGE_FILTER_OPTIONS: Array<{
  value: PercentBand;
  label: string;
  description: string;
}> = [
  {
    value: PERCENTAGE_BAND.LOW,
    label: t(PERCENTAGE_BAND_TRANSLATION_KEYS[PERCENTAGE_BAND.LOW]),
    description: t('≤ 30%'),
  },
  {
    value: PERCENTAGE_BAND.MID,
    label: t(PERCENTAGE_BAND_TRANSLATION_KEYS[PERCENTAGE_BAND.MID]),
    description: t('31% - 69%'),
  },
  {
    value: PERCENTAGE_BAND.HIGH,
    label: t(PERCENTAGE_BAND_TRANSLATION_KEYS[PERCENTAGE_BAND.HIGH]),
    description: t('≥ 70%'),
  },
];

export const SCHOOL_PERFORMANCE_FILTER_OPTIONS: SchoolPerformanceFilterValue[] =
  SCHOOL_PERFORMANCE_STATUS_VALUES;

// Shared filter metadata for the school listing drawer.
export const filterConfigsForSchool = [
  { key: 'partner', label: t('Select Partner') },
  { key: 'programManager', label: t('Select Program Manager') },
  { key: 'fieldCoordinator', label: t('Select Field Coordinator') },
  { key: 'programType', label: t('Select Program Type') },
  { key: 'state', label: t('Select State') },
  { key: 'district', label: t('Select District') },
  { key: 'block', label: t('Select Block') },
  { key: 'cluster', label: t('Select Cluster') },
];

// Fresh filter objects keep reset flows predictable across the page.
export const createEmptySchoolFilters = (): Filters => ({
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  state: [],
  district: [],
  block: [],
  cluster: [],
});

// Query-string parsing stays defensive so broken URLs do not break the page.
export const parseSchoolListJsonParam = <T,>(
  param: string | null,
  fallback: T,
) => {
  try {
    return param ? (JSON.parse(param) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const hasSchoolListFilters = (filters: Filters) =>
  Object.values(filters).some((values) => values.length > 0);

// Normalizes API filter payloads back into the UI filter shape.
export const mapSchoolListFilterOptions = (
  data?: Record<string, string[]>,
): Filters => ({
  programType: data?.programType || [],
  partner: data?.partner || [],
  programManager: data?.programManager || [],
  fieldCoordinator: data?.fieldCoordinator || [],
  state: data?.state || [],
  district: data?.district || [],
  block: data?.block || [],
  cluster: data?.cluster || [],
});

// Tabs shown across the top of the school listing.
export const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as PROGRAM_TAB,
  }),
);

export const DEFAULT_PAGE_SIZE = 8;

// Centralized column config keeps the page component focused on behavior.
export const getSchoolListColumns = (): Column<SchoolListRow>[] => [
  {
    key: 'name',
    label: t('School Name'),
    width: '20%',
    headerAlign: 'left',
    sortable: true,
    orderBy: 'name',
  },
  {
    key: 'schoolPerformance',
    label: t('School Performance'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'school_performance',
    schoolPerformanceFilterKey: 'schoolPerformance',
  },
  {
    key: 'onboardedStudents',
    label: t('Onboarded Students'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'onboarded_students',
  },
  {
    key: 'activatedStudents',
    label: t('Activated Students'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'activated_students',
    percentageFilterKey: 'activatedStudents',
  },
  {
    key: 'activeStudents',
    label: t('Active Students'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'active_students',
    percentageFilterKey: 'activeStudents',
  },
  {
    key: 'avgTimeSpent',
    label: t('Avg Time Spent'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'avg_time_spent',
  },
  {
    key: 'activeTeachers',
    label: t('Active Teachers'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'active_teachers',
    percentageFilterKey: 'activeTeachers',
  },
  {
    key: 'activitiesAssigned',
    label: t('Activities Assigned'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'activities_assigned',
  },
  {
    key: 'avgAssignmentsCompleted',
    label: t('Avg Assignments Completed'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'avg_assignments_completed',
  },
  {
    key: 'avgActivitiesCompleted',
    label: t('Avg Activities Completed'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'avg_activities_completed',
  },
  {
    key: 'phoneCallsStudentsParents',
    label: t('Phone Calls - Students / Parents'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'student_parent_calls',
  },
  {
    key: 'phoneCallsTeachersHms',
    label: t('Phone Calls - Teachers & HMs'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'teacher_hm_calls',
  },
  {
    key: 'communityVisits',
    label: t('Community Visits'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'community_visits',
  },
  {
    key: 'parentsReached',
    label: t('Parents Reached'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'community_parents_reached',
  },
  {
    key: 'schoolVisits',
    label: t('School Visits'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'school_visits',
  },
  {
    key: 'parentsOnWhatsapp',
    label: t('On WhatsApp'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'parents_on_whatsapp',
  },
  {
    key: 'parentsInWhatsappGroup',
    label: t('In Group'),
    width: '7.78%',
    align: 'center',
    sortable: true,
    orderBy: 'parents_in_group',
  },
];

// Export columns intentionally mirror the UI while keeping paired % columns.
export const getSchoolListExportColumns = (): SchoolListExportColumn[] => [
  { key: 'name', label: t('School Name'), part: 'value' },
  { key: 'udise', label: t('UDISE'), part: 'value' },
  { key: 'block', label: t('Block'), part: 'value' },
  {
    key: 'schoolPerformance',
    label: t('School Performance'),
    part: 'value',
  },
  { key: 'onboardedStudents', label: t('Onboarded Students'), part: 'value' },
  { key: 'activatedStudents', label: t('Activated Students'), part: 'value' },
  {
    key: 'activatedStudents',
    label: t('Activated Students'),
    part: 'percent',
  },
  { key: 'activeStudents', label: t('Active Students'), part: 'value' },
  { key: 'activeStudents', label: t('Active Students'), part: 'percent' },
  { key: 'avgTimeSpent', label: t('Avg Time Spent'), part: 'value' },
  { key: 'activeTeachers', label: t('Active Teachers'), part: 'value' },
  { key: 'activeTeachers', label: t('Active Teachers'), part: 'percent' },
  {
    key: 'activitiesAssigned',
    label: t('Activities Assigned'),
    part: 'value',
  },
  {
    key: 'avgAssignmentsCompleted',
    label: t('Avg Assignments Completed'),
    part: 'value',
  },
  {
    key: 'avgActivitiesCompleted',
    label: t('Avg Activities Completed'),
    part: 'value',
  },
  {
    key: 'phoneCallsStudentsParents',
    label: t('Phone Calls - Students / Parents'),
    part: 'value',
  },
  {
    key: 'phoneCallsTeachersHms',
    label: t('Phone Calls - Teachers & HMs'),
    part: 'value',
  },
  {
    key: 'communityVisits',
    label: t('Community Visits'),
    part: 'value',
  },
  {
    key: 'parentsReached',
    label: t('Parents Reached'),
    part: 'value',
  },
  { key: 'schoolVisits', label: t('School Visits'), part: 'value' },
  { key: 'parentsOnWhatsapp', label: t('On WhatsApp'), part: 'value' },
  { key: 'parentsInWhatsappGroup', label: t('In Group'), part: 'value' },
];

export const formatCompactNumber = (
  value: unknown,
  options?: { maxFractionDigits?: number },
) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numericValue)) return '--';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits:
      options?.maxFractionDigits ?? (numericValue % 1 === 0 ? 0 : 1),
  }).format(numericValue);
};

export const pickFirstNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;
    if (Number.isFinite(numericValue)) return numericValue;
  }
  return undefined;
};

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const getStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

export const normalizeStatus = (value: unknown) => {
  const text =
    typeof value === 'string'
      ? value.trim().toLowerCase().replace(/[_-]+/g, ' ')
      : '';
  if (!text) return '';
  if (text.includes('green')) return SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL;
  if (text.includes('red')) return SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT;
  if (text.includes('yellow')) return SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getSchoolPerformanceLabel = (status: string) => {
  const translationKey =
    SCHOOL_PERFORMANCE_TRANSLATION_KEYS[status as SchoolPerformanceFilterValue];
  if (!translationKey) return status;

  const translated = t(translationKey);
  return translated === translationKey ? status : translated;
};

export const getPercentageBandLabel = (band: PercentBand) => {
  const translationKey = PERCENTAGE_BAND_TRANSLATION_KEYS[band];
  const translated = t(translationKey);
  return translated === translationKey
    ? `${band.charAt(0).toUpperCase()}${band.slice(1)}`
    : translated;
};

export const getPercentageBandMeta = (band: PercentBand) =>
  PERCENTAGE_BAND_META[band];

export const getStatusMeta = (status: string) => {
  return (
    SCHOOL_LISTING_STATUS_META[status] ?? SCHOOL_LISTING_STATUS_META.default
  );
};

export const resolvePerformanceStatus = (school: SchoolMetricRow) => {
  const explicitStatus = normalizeStatus(school.school_performance);
  if (explicitStatus) return explicitStatus;
  const onboardedStudents = pickFirstNumber(school.onboarded_students);
  const activeStudents = pickFirstNumber(
    school.active_students,
    school.activated_students,
  );
  if (
    onboardedStudents === undefined ||
    activeStudents === undefined ||
    onboardedStudents <= 0
  ) {
    return '';
  }
  const activeRate = activeStudents / onboardedStudents;
  if (activeRate >= 0.8) return SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL;
  if (activeRate >= 0.5) return SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  return SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT;
};

// Kept for future table helpers that need a compact geographic breadcrumb.
export const buildSchoolLocationLabel = (school: SchoolMetricRow) => {
  const locationParts = [getStringValue(school.district)].filter(
    (part) => part.length > 0,
  );
  return locationParts.join(', ');
};

export const buildSchoolUdiseLocationLabel = (school: SchoolMetricRow) => {
  const udise = getStringValue(school.udise);
  const location = buildSchoolLocationLabel(school);

  if (udise && location) return `${udise} - ${location}`;
  return udise || location || '';
};

export const getSchoolCoordinatorList = (school: SchoolMetricRow) =>
  getStringArray(school.field_coordinators);

// Standard metric cell renderer used by the school listing table.
export const renderMetricCell = (
  value: unknown,
  suffix = '',
  options?: { maxFractionDigits?: number },
) => {
  const text =
    value === null || value === undefined || value === ''
      ? '--'
      : `${formatCompactNumber(value, options)}${suffix}`;
  return {
    value,
    text,
    exportValueText: text,
    exportPercentText: '',
    render: (
      <Typography
        variant="subtitle2"
        fontWeight={400}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {text}
      </Typography>
    ),
  };
};

export const formatPercent = (value: unknown) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numericValue)) return null;
  return `${Math.round(numericValue)}%`;
};

export const isPercentInBand = (
  percent: number | null | undefined,
  band: PercentBand,
) => {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) {
    return false;
  }
  const roundedPercent = Math.round(percent);
  if (band === PERCENTAGE_BAND.LOW) return roundedPercent <= 30;
  if (band === PERCENTAGE_BAND.MID)
    return roundedPercent >= 31 && roundedPercent <= 69;
  return roundedPercent >= 70;
};

// Percentage chip palette used by the listing metrics.
export const getPercentMeta = (percent: number) => {
  const roundedPercent = Math.round(percent);
  if (roundedPercent >= 70) return { bg: '#DFF7EB', color: '#2BA980' };
  if (roundedPercent >= 31) return { bg: '#FEF3C7', color: '#E7A54E' };
  return { bg: '#FCE8E6', color: '#D35451' };
};

export const renderMetricWithPercentCell = (
  value: unknown,
  percent: number | null,
  suffix = '',
  options?: { maxFractionDigits?: number },
  showValue = true,
) => {
  const metricValue =
    value === null || value === undefined || value === ''
      ? '--'
      : formatCompactNumber(value, options);
  const percentLabel = percent === null ? null : formatPercent(percent);
  const text = percentLabel
    ? showValue
      ? `${metricValue}${suffix} (${percentLabel})`
      : percentLabel
    : showValue
      ? `${metricValue}${suffix}`
      : '--';

  return {
    value,
    text,
    exportValueText: showValue ? `${metricValue}${suffix}` : '--',
    exportPercentText: percentLabel ?? '--',
    render: (
      <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
        {showValue && (
          <Typography
            variant="subtitle2"
            fontWeight={400}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {`${metricValue}${suffix}`}
          </Typography>
        )}
        {percentLabel &&
          (() => {
            const meta = getPercentMeta(percent as number);
            return (
              <Chip
                label={percentLabel}
                size="small"
                sx={{
                  height: 22,
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  backgroundColor: meta.bg,
                  color: meta.color,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            );
          })()}
      </Box>
    ),
  };
};
