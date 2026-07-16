import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import {
  CLASS_PERFORMANCE_STATUS,
  CLASS_PERFORMANCE_STATUS_META,
} from '../../../common/constants';
import type { ClassMetricsForClassListingRow } from '../../../services/api/ServiceApi';
import {
  formatCompactNumber,
  getPercentMeta,
  pickFirstNumber,
} from '../../pages/SchoolList.helpers';

export type ClassMetricValues = {
  onboardedStudents?: number;
  activatedStudents?: number;
  activeStudents?: number;
  avgTimeSpent?: number;
  activeTeachers?: number;
  totalTeachers?: number;
  activitiesAssigned?: number;
  avgAssignmentsCompleted?: number;
  avgActivitiesCompleted?: number;
  activatedPercent: number | null;
  activePercent: number | null;
  activeTeachersPercent: number | null;
};

export const normalizeSchoolModel = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

export const getClassMetricValues = (
  metrics: ClassMetricsForClassListingRow | undefined,
  fallbackStudentCount: unknown,
): ClassMetricValues => {
  const onboardedStudents = pickFirstNumber(
    metrics?.onboarded_students,
    fallbackStudentCount,
  );
  const activatedStudents = pickFirstNumber(metrics?.activated_students);
  const activeStudents = pickFirstNumber(metrics?.active_students);
  const activeTeachers = pickFirstNumber(metrics?.active_teachers);
  const totalTeachers = pickFirstNumber(metrics?.total_teachers);

  return {
    onboardedStudents,
    activatedStudents,
    activeStudents,
    avgTimeSpent: pickFirstNumber(metrics?.avg_time_spent),
    activeTeachers,
    totalTeachers,
    activitiesAssigned: pickFirstNumber(metrics?.activities_assigned),
    avgAssignmentsCompleted: pickFirstNumber(
      metrics?.avg_assignments_completed,
    ),
    avgActivitiesCompleted: pickFirstNumber(metrics?.avg_activities_completed),
    activatedPercent:
      onboardedStudents && activatedStudents !== undefined
        ? (activatedStudents / onboardedStudents) * 100
        : null,
    activePercent:
      activatedStudents && activeStudents !== undefined
        ? (activeStudents / activatedStudents) * 100
        : null,
    activeTeachersPercent:
      totalTeachers && activeTeachers !== undefined
        ? (activeTeachers / totalTeachers) * 100
        : null,
  };
};

export const renderNumberCell = (
  value: unknown,
  suffix = '',
  options?: { maxFractionDigits?: number },
) => {
  const text =
    value === null || value === undefined || value === ''
      ? '--'
      : `${formatCompactNumber(value, options)}${suffix}`;
  return {
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

export const renderNumberWithPercentCell = (
  value: unknown,
  percent: number | null,
  options?: { maxFractionDigits?: number },
) => {
  const metricText =
    value === null || value === undefined || value === ''
      ? '--'
      : formatCompactNumber(value, options);

  return {
    render: (
      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
        <Typography
          variant="subtitle2"
          fontWeight={400}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {metricText}
        </Typography>
        {percent !== null &&
          Number.isFinite(percent) &&
          (() => {
            const meta = getPercentMeta(percent);
            return (
              <Chip
                label={`${Math.round(percent)}%`}
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

const getMetricPerformanceStatus = (percent: number) => {
  if (percent <= 30) return CLASS_PERFORMANCE_STATUS.NEEDS_SUPPORT;
  if (percent >= 70) return CLASS_PERFORMANCE_STATUS.PERFORMING_WELL;
  return CLASS_PERFORMANCE_STATUS.NEEDS_ATTENTION;
};

export const resolveClassPerformanceStatus = (
  metrics?: ClassMetricsForClassListingRow,
) => {
  const onboardedStudents = pickFirstNumber(metrics?.onboarded_students);
  const activatedStudents = pickFirstNumber(metrics?.activated_students);
  const activeStudents = pickFirstNumber(metrics?.active_students);

  if (
    onboardedStudents === undefined ||
    onboardedStudents <= 0 ||
    activatedStudents === undefined
  ) {
    return '';
  }

  const flags = [
    getMetricPerformanceStatus((activatedStudents / onboardedStudents) * 100),
  ];

  if (activatedStudents > 0 && activeStudents !== undefined) {
    flags.push(
      getMetricPerformanceStatus((activeStudents / activatedStudents) * 100),
    );
  }

  if (flags.includes(CLASS_PERFORMANCE_STATUS.NEEDS_SUPPORT)) {
    return CLASS_PERFORMANCE_STATUS.NEEDS_SUPPORT;
  }
  if (flags.includes(CLASS_PERFORMANCE_STATUS.NEEDS_ATTENTION)) {
    return CLASS_PERFORMANCE_STATUS.NEEDS_ATTENTION;
  }
  return CLASS_PERFORMANCE_STATUS.PERFORMING_WELL;
};

export const renderClassPerformanceCell = (
  metrics?: ClassMetricsForClassListingRow,
) => {
  const status = resolveClassPerformanceStatus(metrics);
  const meta =
    CLASS_PERFORMANCE_STATUS_META[status] ??
    CLASS_PERFORMANCE_STATUS_META.default;
  const isKnownStatus = Boolean(status);

  return {
    render: (
      <Chip
        label={isKnownStatus ? t(status) : '--'}
        size="small"
        sx={{
          backgroundColor: `${meta.bg} !important`,
          color: `${meta.color} !important`,
          border: 'none',
          fontWeight: 600,
          height: 24,
          '& .MuiChip-label': {
            px: 1,
            color: `${meta.color} !important`,
            fontWeight: 600,
          },
        }}
      />
    ),
  };
};
