import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import {
  PROGRAM_TAB,
  SCHOOL_LISTING_STATUS_META,
} from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import type { Column } from '../components/DataTableBody';
import {
  formatCompactNumber,
  formatPercent,
  getPercentMeta,
  parseSchoolListJsonParam,
  pickFirstNumber,
  type DateRangeValue,
  type Filters,
} from './SchoolList.helpers';
import {
  createEmptyProgramFilters,
  PROGRAM_PERCENT_FILTERS,
} from './ProgramPageConfig';

type ProgramListApiRequest = {
  filters: Filters;
  tab: PROGRAM_TAB;
  limit: number;
  offset: number;
  orderBy: string;
  order: 'asc' | 'desc';
  searchTerm: string;
  page: number;
  page_size: number;
  order_by: string;
  order_dir: 'asc' | 'desc';
  search: string;
  date_range: DateRangeValue;
};

export type ProgramMetricCell = {
  value: string | number | null;
  text: string;
  exportValueText: string;
  exportPercentText: string;
  render: React.ReactNode;
};

export type ProgramListSourceRow = {
  id?: string;
  program_id?: string | null;
  program_name?: string | null;
  state?: string | null;
  metric_window?: string | null;
  total_schools?: number | null;
  performing_well?: number | null;
  needs_attention?: number | null;
  needs_support?: number | null;
  onboarded_students?: number | null;
  target_student_count?: number | null;
  onboarded_students_pct?: number | null;
  activated_students?: number | null;
  activated_students_pct?: number | null;
  active_students?: number | null;
  active_students_pct?: number | null;
  avg_time_spent?: number | null;
  onboarded_teachers?: number | null;
  target_teacher_count?: number | null;
  onboarded_teachers_pct?: number | null;
  activated_teachers?: number | null;
  activated_teachers_pct?: number | null;
  active_teachers?: number | null;
  active_teachers_pct?: number | null;
};

export type ProgramListRow = ProgramListSourceRow & {
  id: string;
  programName: ProgramMetricCell;
  totalSchools: ProgramMetricCell;
  schoolDivision: ProgramMetricCell;
  onboardedStudents: ProgramMetricCell;
  activatedStudents: ProgramMetricCell;
  activeStudents: ProgramMetricCell;
  avgTimeSpent: ProgramMetricCell;
  onboardedTeachers: ProgramMetricCell;
  activatedTeachers: ProgramMetricCell;
  activeTeachers: ProgramMetricCell;
};

type UseProgramListExportParams = {
  api: ServiceApi;
  filters: Filters;
  selectedTab: PROGRAM_TAB;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: DateRangeValue;
  total: number;
  isLoading: boolean;
  isSearchPending: boolean;
  // New: visible columns to determine which export columns to include
  visibleColumns?: Column<ProgramListRow>[];
};

const ORDER_BY_MAP: Record<string, string> = {
  programName: 'program_name',
  totalSchools: 'total_schools',
  onboardedStudents: 'onboarded_students',
  activatedStudents: 'activated_students',
  activeStudents: 'active_students',
  avgTimeSpent: 'avg_time_spent',
  onboardedTeachers: 'onboarded_teachers',
  activatedTeachers: 'activated_teachers',
  activeTeachers: 'active_teachers',
};

export const SORTABLE_PROGRAM_COLUMNS = new Set(Object.keys(ORDER_BY_MAP));

export const parseProgramListJsonParam = parseSchoolListJsonParam;

export const hasProgramListFilters = (filters: Filters) =>
  Object.values(filters).some((values) => values.length > 0);

export const mapProgramFilterOptions = (
  data?: Record<string, string[]>,
): Filters => ({
  ...createEmptyProgramFilters(),
  programType: data?.programType || data?.program_type || [],
  partner: data?.partner || data?.partners || [],
  programManager: data?.programManager || data?.program_managers || [],
  fieldCoordinator: data?.fieldCoordinator || data?.field_coordinators || [],
  state: data?.state || [],
  district: data?.district || [],
  block: data?.block || [],
  cluster: data?.cluster || [],
  onboardedStudentsPct: Object.values(PROGRAM_PERCENT_FILTERS),
  activatedStudentsPct: Object.values(PROGRAM_PERCENT_FILTERS),
  activeStudentsPct: Object.values(PROGRAM_PERCENT_FILTERS),
  onboardedTeachersPct: Object.values(PROGRAM_PERCENT_FILTERS),
  activatedTeachersPct: Object.values(PROGRAM_PERCENT_FILTERS),
  activeTeachersPct: Object.values(PROGRAM_PERCENT_FILTERS),
});

export const getProgramListColumns = (): Column<ProgramListRow>[] => [
  {
    key: 'programName',
    label: t('Program Name'),
    width: 256,
    sortable: true,
    headerIcon: 'sort',
  },
  {
    key: 'totalSchools',
    label: t('Total Schools'),
    width: 160,
    sortable: true,
    headerIcon: 'sort',
  },
  {
    key: 'schoolDivision',
    label: t('School Division'),
    width: 160,
    sortable: false,
  },
  {
    key: 'onboardedStudents',
    label: t('Onboarded Students'),
    width: 160,
    sortable: true,
    headerIcon: 'filter',
  },
  {
    key: 'activatedStudents',
    label: t('Activated Students'),
    width: 160,
    sortable: true,
    headerIcon: 'filter',
  },
  {
    key: 'activeStudents',
    label: t('Active Students'),
    width: 160,
    sortable: true,
    headerIcon: 'filter',
  },
  {
    key: 'avgTimeSpent',
    label: t('Avg Engagement'),
    width: 160,
    sortable: true,
    headerIcon: 'sort',
  },
  {
    key: 'onboardedTeachers',
    label: t('Onboarded Teachers'),
    width: 160,
    sortable: true,
    headerIcon: 'filter',
  },
  {
    key: 'activatedTeachers',
    label: t('Activated Teachers'),
    width: 160,
    sortable: true,
    headerIcon: 'filter',
  },
  {
    key: 'activeTeachers',
    label: t('Active Teachers'),
    width: 160,
    sortable: true,
    headerIcon: 'filter',
  },
];

export const getProgramStatusMeta = (status: string) =>
  SCHOOL_LISTING_STATUS_META[status] ?? SCHOOL_LISTING_STATUS_META.default;

export const formatProgramMetric = (value: number | null | undefined) =>
  value === null || value === undefined ? '--' : formatCompactNumber(value);

export const formatNullablePercent = (
  value: number | null | undefined,
  nullText = '--',
): string =>
  value === null || value === undefined
    ? nullText
    : (formatPercent(value) ?? nullText);

export const buildPercentLabel = (percent: number | null | undefined) =>
  percent === null || percent === undefined ? null : formatPercent(percent);

export const getProgramPercentMeta = (percent: number) =>
  getPercentMeta(percent);

export const resolveProgramId = (row: ProgramListSourceRow) =>
  row.program_id || row.id || '';

export const sumProgramNumbers = (
  ...values: Array<number | null | undefined>
) =>
  values.reduce<number>(
    (total, value) => total + (pickFirstNumber(value) ?? 0),
    0,
  );

const buildTextCell = (
  value: string | number | null,
  text: string,
  render: React.ReactNode,
): ProgramMetricCell => ({
  value,
  text,
  exportValueText: text,
  exportPercentText: '--',
  render,
});

const getPercentBand = (percent: number) => {
  if (percent >= 70) return 'high';
  if (percent >= 31) return 'mid';
  return 'low';
};

const renderMetricWithPercent = (
  value: number | null | undefined,
  percent: number | null | undefined,
  nullPercentText = '--',
): ProgramMetricCell => {
  const valueText = formatProgramMetric(value);
  const percentText = formatNullablePercent(percent, nullPercentText) ?? '--';
  const numericPercent =
    typeof percent === 'number' && Number.isFinite(percent) ? percent : null;

  return {
    value: value ?? null,
    text: `${valueText} ${percentText}`.trim(),
    exportValueText: valueText,
    exportPercentText: percentText,
    render: React.createElement(
      Box,
      { className: 'program-metric-with-percent' },
      React.createElement(
        Typography,
        { className: 'program-metric-value' },
        valueText,
      ),
      numericPercent === null
        ? React.createElement(Chip, {
            label: percentText,
            size: 'small',
            className: 'program-na-chip',
          })
        : React.createElement(Chip, {
            label: buildPercentLabel(numericPercent),
            size: 'small',
            className: `program-percent-chip program-percent-chip-${getPercentBand(
              numericPercent,
            )}`,
          }),
    ),
  };
};

const renderMetricOnly = (
  value: number | null | undefined,
  suffix = '',
): ProgramMetricCell => {
  const valueText = `${formatProgramMetric(value)}${value ? suffix : ''}`;
  return buildTextCell(
    value ?? null,
    valueText,
    React.createElement(
      Typography,
      { className: 'program-metric-value' },
      valueText,
    ),
  );
};

const renderDivision = (row: ProgramListSourceRow): ProgramMetricCell => {
  const red = row.needs_support ?? 0;
  const yellow = row.needs_attention ?? 0;
  const green = row.performing_well ?? 0;

  return buildTextCell(
    `${red}/${yellow}/${green}`,
    `${red}% ${yellow}% ${green}%`,
    React.createElement(
      Box,
      { className: 'program-division-cell' },
      React.createElement(
        'svg',
        {
          className: 'program-division-bar',
          'aria-label': String(t('School Division')),
          viewBox: '0 0 100 6',
          preserveAspectRatio: 'none',
        },
        React.createElement('rect', {
          className: 'program-division-red',
          x: '0',
          y: '0',
          width: red,
          height: '6',
        }),
        React.createElement('rect', {
          className: 'program-division-yellow',
          x: red,
          y: '0',
          width: yellow,
          height: '6',
        }),
        React.createElement('rect', {
          className: 'program-division-green',
          x: red + yellow,
          y: '0',
          width: green,
          height: '6',
        }),
      ),
      React.createElement(
        Box,
        { className: 'program-division-labels' },
        React.createElement(
          'span',
          { className: 'program-division-red-text' },
          `${red}%`,
        ),
        React.createElement(
          'span',
          { className: 'program-division-yellow-text' },
          `${yellow}%`,
        ),
        React.createElement(
          'span',
          { className: 'program-division-green-text' },
          `${green}%`,
        ),
      ),
    ),
  );
};

export const mapProgramRowsToRenderRows = (
  data: ProgramListSourceRow[],
): ProgramListRow[] =>
  data.map((program) => {
    const id = resolveProgramId(program);
    const programName = program.program_name || String(t('Untitled Program'));
    const state = program.state || '';

    return {
      ...program,
      id,
      programName: buildTextCell(
        programName,
        state ? `${programName}\n${state}` : programName,
        React.createElement(
          Box,
          { className: 'program-name-cell' },
          React.createElement(
            Box,
            null,
            React.createElement(
              Typography,
              { className: 'program-name-title' },
              programName,
            ),
            state
              ? React.createElement(
                  Typography,
                  { className: 'program-name-subtitle' },
                  state,
                )
              : null,
          ),
        ),
      ),
      totalSchools: renderMetricOnly(program.total_schools),
      schoolDivision: renderDivision(program),
      onboardedStudents: renderMetricWithPercent(
        program.onboarded_students,
        program.onboarded_students_pct,
        'NA',
      ),
      activatedStudents: renderMetricWithPercent(
        program.activated_students,
        program.activated_students_pct,
      ),
      activeStudents: renderMetricWithPercent(
        program.active_students,
        program.active_students_pct,
      ),
      avgTimeSpent: renderMetricOnly(program.avg_time_spent, ' min'),
      onboardedTeachers: renderMetricWithPercent(
        program.onboarded_teachers,
        program.onboarded_teachers_pct,
        'NA',
      ),
      activatedTeachers: renderMetricWithPercent(
        program.activated_teachers,
        program.activated_teachers_pct,
      ),
      activeTeachers: renderMetricWithPercent(
        program.active_teachers,
        program.active_teachers_pct,
      ),
    };
  });

export const buildProgramListRequest = ({
  filters,
  selectedTab,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
}: {
  filters: Filters;
  selectedTab: PROGRAM_TAB;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: DateRangeValue;
}): ProgramListApiRequest => {
  const cleanedFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => Array.isArray(value) && value.length > 0,
    ),
  ) as Filters;
  const tabFilter: Filters =
    selectedTab !== PROGRAM_TAB.ALL ? { model: [selectedTab] } : {};

  const apiOrderBy = ORDER_BY_MAP[orderBy] ?? orderBy;
  const offset = Math.max(page - 1, 0) * pageSize;

  return {
    filters: { ...cleanedFilters, ...tabFilter },
    tab: selectedTab,
    limit: pageSize,
    offset,
    orderBy: apiOrderBy,
    order: orderDir,
    searchTerm,
    page,
    page_size: pageSize,
    order_by: apiOrderBy,
    order_dir: orderDir,
    search: searchTerm,
    date_range: selectedDateRange,
  };
};

export const fetchProgramListPage = async ({
  api,
  filters,
  selectedTab,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
}: {
  api: ServiceApi;
  filters: Filters;
  selectedTab: PROGRAM_TAB;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: DateRangeValue;
}) =>
  api.getPrograms(
    buildProgramListRequest({
      filters,
      selectedTab,
      page,
      pageSize,
      orderBy,
      orderDir,
      searchTerm,
      selectedDateRange,
    }),
  );
