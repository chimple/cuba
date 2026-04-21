import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import {
  FilteredSchoolsForSchoolListingOps,
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
} from '../../common/constants';

export type SchoolMetricRow = FilteredSchoolsForSchoolListingOps;

export const DEFAULT_DATE_RANGE = '7d';

export const DATE_RANGE_OPTIONS = [
  { label: t('Last 7 Days'), value: '7d' },
  { label: t('Last 15 Days'), value: '15d' },
  { label: t('Last 30 Days'), value: '30d' },
] as const;

export type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]['value'];

export type Filters = Record<string, string[]>;

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

export const INITIAL_FILTERS: Filters = {
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  state: [],
  district: [],
  block: [],
  cluster: [],
};

// Tabs shown across the top of the school listing.
export const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as PROGRAM_TAB,
  }),
);

export const DEFAULT_PAGE_SIZE = 8;

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
  if (text.includes('green')) return 'Performing Well';
  if (text.includes('red')) return 'Needs Support';
  if (text.includes('yellow')) return 'Needs Attention';
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getStatusMeta = (status: string) => {
  switch (status) {
    case 'Performing Well':
      return { bg: '#D1FAE5', color: '#2BA980' };
    case 'Needs Attention':
      return { bg: '#FEF3C7', color: '#E7A54E' };
    case 'Needs Support':
      return { bg: '#FCE8E6', color: '#D35451' };
    default:
      return { bg: '#EEF2F6', color: '#5B6472' };
  }
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
  if (activeRate >= 0.8) return 'Performing Well';
  if (activeRate >= 0.5) return 'Needs Attention';
  return 'Needs Support';
};

// Kept for future table helpers that need a compact geographic breadcrumb.
export const buildSchoolLocationLabel = (school: SchoolMetricRow) => {
  const locationParts = [
    getStringValue(school.state),
    getStringValue(school.district),
    getStringValue(school.block),
    getStringValue(school.cluster),
  ].filter((part) => part.length > 0);
  return locationParts.join(' • ');
};

export const buildSchoolSubtitle = (school: SchoolMetricRow) => {
  const udise = getStringValue(school.udise);
  const district = getStringValue(school.district);
  return udise || district ? `${udise} - ${district}`.trim() : '';
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

// Percentage chip palette used by the listing metrics.
export const getPercentMeta = (percent: number) => {
  if (percent >= 80) return { bg: '#DFF7EB', color: '#2BA980' };
  if (percent >= 60) return { bg: '#FEF3C7', color: '#E7A54E' };
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

  return {
    value,
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
