import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import {
  PERCENTAGE_BAND,
  PERCENTAGE_BAND_META,
  PERCENTAGE_BAND_TRANSLATION_KEYS,
  SCHOOL_PERFORMANCE_STATUS,
  SCHOOL_PERFORMANCE_TRANSLATION_KEYS,
  SCHOOL_LISTING_STATUS_META,
} from '../../common/constants';
import type {
  PercentBand,
  SchoolMetricRow,
  SchoolPerformanceFilterValue,
} from './SchoolList.helpers';

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
