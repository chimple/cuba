import React from 'react';
import { Box, Typography } from '@mui/material';
import { PROGRAM_TAB, PROGRAM_TAB_LABELS } from '../../common/constants';

export type Filters = Record<string, string[]>;
export type MigrationTab = 'migrate' | 'migrated';

export const INITIAL_FILTERS: Filters = {
  program: [],
  programType: [],
  state: [],
  district: [],
  cluster: [],
  block: [],
};

export const FILTER_KEYS = [
  'program',
  'programType',
  'state',
  'district',
  'cluster',
  'block',
] as const;

export const parseJSONParam = <T>(param: string | null, fallback: T): T => {
  try {
    return param ? (JSON.parse(param) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const normalizeFiltersFromQuery = (value: unknown): Filters => {
  if (!value || typeof value !== 'object') return INITIAL_FILTERS;
  const source = value as Record<string, unknown>;
  return FILTER_KEYS.reduce<Filters>(
    (acc, key) => {
      acc[key] = Array.isArray(source[key])
        ? (source[key] as unknown[]).filter(
            (item): item is string =>
              typeof item === 'string' && item.trim().length > 0,
          )
        : [];
      return acc;
    },
    { ...INITIAL_FILTERS },
  );
};

export const normalizeAcademicYear = (value: any): string => {
  if (Array.isArray(value)) {
    const years = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
    return years.join(', ');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0)
            .join(', ');
        }
      } catch (_err) {
        return trimmed;
      }
    }

    return trimmed;
  }

  return '';
};

export const normalizeLatestAcademicYear = (value: any): string => {
  if (Array.isArray(value)) {
    const years = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
    return years.at(-1) || '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const years = parsed
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0);
          return years.at(-1) || '';
        }
      } catch (_err) {
        return trimmed;
      }
    }

    return trimmed;
  }

  return '';
};

export const normalizeProgramModel = (value: any): string => {
  const toLabel = (model: string): string => {
    const normalized = model.trim().toLowerCase();
    if (normalized === PROGRAM_TAB.AT_HOME) {
      return PROGRAM_TAB_LABELS[PROGRAM_TAB.AT_HOME].replace(/\s+/g, '-');
    }
    if (normalized === PROGRAM_TAB.AT_SCHOOL) {
      return PROGRAM_TAB_LABELS[PROGRAM_TAB.AT_SCHOOL].replace(/\s+/g, '-');
    }
    if (normalized === PROGRAM_TAB.HYBRID) {
      return PROGRAM_TAB_LABELS[PROGRAM_TAB.HYBRID];
    }
    return model;
  };

  if (Array.isArray(value)) {
    const models = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0)
      .map(toLabel);
    return models.join(', ');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0)
            .map(toLabel)
            .join(', ');
        }
      } catch (_err) {
        return toLabel(trimmed);
      }
    }

    return toLabel(trimmed);
  }

  return '';
};

type MigratedMetricKey =
  | 'ukg_student_count'
  | 'class_1_student_count'
  | 'class_2_student_count'
  | 'class_3_student_count'
  | 'class_4_student_count'
  | 'class_5_student_count';
type MigratedMetricValue = number | null | undefined;
type MigratedMetricSource = Partial<
  Record<MigratedMetricKey, MigratedMetricValue>
>;

const normalizeMigratedMetricValue = (
  value: MigratedMetricValue,
): string | number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  return 'NA';
};

export const resolveMigratedMetricValue = (
  row: MigratedMetricSource,
  school: MigratedMetricSource,
  program: MigratedMetricSource,
  migrationMetrics: MigratedMetricSource,
  candidateKeys: readonly MigratedMetricKey[],
): string | number => {
  const sources = [migrationMetrics, row, school, program];

  for (const source of sources) {
    for (const key of candidateKeys) {
      if (source && Object.prototype.hasOwnProperty.call(source, key)) {
        return normalizeMigratedMetricValue(source[key]);
      }
    }
  }

  return 'NA';
};

export const buildNameCell = (
  schoolName: string,
  schoolUdise: string,
  schoolState: string,
) => {
  const subtitle =
    schoolUdise || schoolState
      ? `${schoolUdise ?? ''} - ${schoolState ?? ''}`.trim()
      : '--';

  return {
    value: schoolName,
    render: React.createElement(
      Box,
      {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      React.createElement(
        Typography,
        { className: 'migrate-schools-name' },
        schoolName,
      ),
      React.createElement(
        Typography,
        { className: 'migrate-schools-subname' },
        subtitle,
      ),
    ),
  };
};
