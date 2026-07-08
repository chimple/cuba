import { Box, Chip, Typography } from '@mui/material';
import { t } from 'i18next';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHistory, useLocation } from 'react-router';
import type * as XLSXModule from 'xlsx-js-style';
import {
  PAGES,
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
  SCHOOL_LISTING_STATUS_META,
} from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
} from '../../utility/xlsxExportUtils';
import type { Column } from '../components/DataTableBody';
import { useDebouncedValue } from './SchoolList.fetcher';
import {
  DATE_RANGE_OPTIONS,
  DEFAULT_DATE_RANGE as SCHOOL_DEFAULT_DATE_RANGE,
  formatCompactNumber,
  formatPercent,
  getPercentMeta,
  parseSchoolListJsonParam,
  pickFirstNumber,
  type DateRangeValue,
  type Filters,
} from './SchoolList.helpers';

export { DATE_RANGE_OPTIONS };
export const DEFAULT_DATE_RANGE = SCHOOL_DEFAULT_DATE_RANGE;
export type { DateRangeValue, Filters };

export const DEFAULT_PROGRAM_PAGE_SIZE = 20;
const EXPORT_SHEET_NAME = 'Programs';
const EXPORT_FILE_NAME = 'ProgramMetrics.xlsx';
const EXPORT_PAGE_SIZE = 500;

type XlsxModule = typeof XLSXModule;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

export const PROGRAM_PERCENT_FILTERS = {
  LOW: 'Low',
  MID: 'Mid',
  HIGH: 'High',
} as const;

export const programTabOptions = [
  PROGRAM_TAB.ALL,
  PROGRAM_TAB.AT_SCHOOL,
  PROGRAM_TAB.AT_HOME,
  PROGRAM_TAB.HYBRID,
].map((value) => ({
  label:
    value === PROGRAM_TAB.ALL
      ? t('All Programs')
      : t(PROGRAM_TAB_LABELS[value]),
  value,
}));

export const createEmptyProgramFilters = (): Filters => ({
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  state: [],
  district: [],
  block: [],
  cluster: [],
  onboardedStudentsPct: [],
  activatedStudentsPct: [],
  activeStudentsPct: [],
  onboardedTeachersPct: [],
  activatedTeachersPct: [],
  activeTeachersPct: [],
});

export const programFilterConfigs = [
  { key: 'partner', label: t('Select Partner') },
  { key: 'programManager', label: t('Select Program Manager') },
  { key: 'programType', label: t('Select Program Type') },
  { key: 'state', label: t('Select State') },
  { key: 'district', label: t('Select District') },
];

const PROGRAM_SELECTED_FILTER_LABELS: Record<string, string> = {
  partner: t('Partner'),
  programManager: t('Program Manager'),
  programType: t('Program Type'),
  fieldCoordinator: t('Field Coordinator'),
  state: t('State'),
  district: t('District'),
  block: t('Block'),
  cluster: t('Cluster'),
  model: t('Program Model'),
  onboardedStudentsPct: t('Onboarded Students'),
  activatedStudentsPct: t('Activated Students'),
  activeStudentsPct: t('Active Users'),
  onboardedTeachersPct: t('Onboarded Teachers'),
  activatedTeachersPct: t('Activated Teachers'),
  activeTeachersPct: t('Active Teachers'),
};

const PROGRAM_PERCENT_FILTER_LABELS: Record<string, string> = {
  [PROGRAM_PERCENT_FILTERS.LOW]: '\u2264 30%',
  [PROGRAM_PERCENT_FILTERS.MID]: '31% \u2013 69%',
  [PROGRAM_PERCENT_FILTERS.HIGH]: '\u2265 70%',
};

export const getProgramSelectedFilterLabel = (
  key: string,
  value: string,
): React.ReactNode => {
  const label = PROGRAM_SELECTED_FILTER_LABELS[key] ?? key;
  const displayValue = PROGRAM_PERCENT_FILTER_LABELS[value] ?? value;
  return React.createElement(
    React.Fragment,
    null,
    `${label}: `,
    React.createElement('strong', null, displayValue),
  );
};

export const getProgramSelectedFilterText = (
  key: string,
  value: string,
): string => {
  const label = PROGRAM_SELECTED_FILTER_LABELS[key] ?? key;
  const displayValue = PROGRAM_PERCENT_FILTER_LABELS[value] ?? value;
  return `${label}: ${displayValue}`;
};

export const PROGRAM_HEADER_PERCENT_FILTER_BY_COLUMN: Record<string, string> = {
  onboardedStudents: 'onboardedStudentsPct',
  activatedStudents: 'activatedStudentsPct',
  activeStudents: 'activeStudentsPct',
  onboardedTeachers: 'onboardedTeachersPct',
  activatedTeachers: 'activatedTeachersPct',
  activeTeachers: 'activeTeachersPct',
};

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

const SORTABLE_PROGRAM_COLUMNS = new Set(Object.keys(ORDER_BY_MAP));

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
    label: t('Active Users'),
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

const useProgramListData = ({
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
}) => {
  const [programs, setPrograms] = useState<ProgramListSourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetchProgramListPage({
          api,
          filters,
          selectedTab,
          page,
          pageSize,
          orderBy,
          orderDir,
          searchTerm,
          selectedDateRange,
        });
        if (!active) return;
        setPrograms(response.data);
        setTotal(response.total ?? response.data.length);
      } catch {
        if (!active) return;
        setPrograms([]);
        setTotal(0);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [
    api,
    filters,
    orderBy,
    orderDir,
    page,
    pageSize,
    searchTerm,
    selectedDateRange,
    selectedTab,
  ]);

  return { programs, total, isLoading };
};

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

type ExportCellValue = string | number;

const safeExportNumber = (value?: number | null) => value ?? 0;
const toExportText = (value: unknown): string => String(value ?? '');

const formatExportPercent = (
  value: number | null | undefined,
  nullText = 'NA',
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return nullText;
  }

  return `${Number(value.toFixed(2))}%`;
};

const getProgramExportDateRangeLabel = (value: DateRangeValue): string =>
  toExportText(
    DATE_RANGE_OPTIONS.find((option) => option.value === value)?.label ?? value,
  );

const buildProgramAppliedFilterLabels = (
  filters: Filters,
  selectedTab: PROGRAM_TAB,
): string[] => {
  const tabFilter =
    selectedTab === PROGRAM_TAB.ALL
      ? []
      : [
          `${toExportText(t('Program Model'))}: ${toExportText(
            t(PROGRAM_TAB_LABELS[selectedTab]),
          )}`,
        ];
  const selectedFilterLabels = Object.entries(filters).flatMap(
    ([key, values]) =>
      values
        .filter((value) => value.trim() !== '')
        .map((value) => getProgramSelectedFilterText(key, value)),
  );

  return [...tabFilter, ...selectedFilterLabels];
};

const buildProgramExportMetadataRows = (
  filters: Filters,
  selectedDateRange: DateRangeValue,
  selectedTab: PROGRAM_TAB,
): ExportCellValue[][] => {
  const appliedFilters = buildProgramAppliedFilterLabels(filters, selectedTab);
  const filterRows = appliedFilters.length
    ? appliedFilters.map((filterLabel, index) => [
        index === 0 ? toExportText(t('Applied Filters')) : '',
        filterLabel,
      ])
    : [[toExportText(t('Applied Filters')), toExportText(t('None'))]];

  return [
    [
      toExportText(t('Date Range')),
      getProgramExportDateRangeLabel(selectedDateRange),
    ],
    ...filterRows,
    [],
  ];
};

const calculateProgramExportPercentages = (row: ProgramListSourceRow) => {
  const onboardedStudents = safeExportNumber(row.onboarded_students);
  const targetStudentCount = row.target_student_count ?? null;
  const activatedStudents = safeExportNumber(row.activated_students);
  const activeStudents = safeExportNumber(row.active_students);

  const onboardedTeachers = safeExportNumber(row.onboarded_teachers);
  const targetTeacherCount = row.target_teacher_count ?? null;
  const activatedTeachers = safeExportNumber(row.activated_teachers);
  const activeTeachers = safeExportNumber(row.active_teachers);

  return {
    onboardedStudentsPct:
      targetStudentCount && targetStudentCount > 0
        ? (onboardedStudents / targetStudentCount) * 100
        : null,

    activatedStudentsPct:
      onboardedStudents > 0 ? (activatedStudents / onboardedStudents) * 100 : 0,

    activeStudentsPct:
      activatedStudents > 0 ? (activeStudents / activatedStudents) * 100 : 0,

    onboardedTeachersPct:
      targetTeacherCount && targetTeacherCount > 0
        ? (onboardedTeachers / targetTeacherCount) * 100
        : null,

    activatedTeachersPct:
      onboardedTeachers > 0 ? (activatedTeachers / onboardedTeachers) * 100 : 0,

    activeTeachersPct:
      activatedTeachers > 0 ? (activeTeachers / activatedTeachers) * 100 : 0,
  };
};

const buildProgramMetricExportRow = (
  row: ProgramListSourceRow,
): ExportCellValue[] => {
  const percentages = calculateProgramExportPercentages(row);

  return [
    row.state
      ? `${row.program_name || '--'}\n${row.state}`
      : row.program_name || '--',

    safeExportNumber(row.total_schools),

    safeExportNumber(row.performing_well),
    safeExportNumber(row.needs_attention),
    safeExportNumber(row.needs_support),

    safeExportNumber(row.onboarded_students),
    formatExportPercent(percentages.onboardedStudentsPct, 'NA'),

    safeExportNumber(row.activated_students),
    formatExportPercent(percentages.activatedStudentsPct, '0%'),

    safeExportNumber(row.active_students),
    formatExportPercent(percentages.activeStudentsPct, '0%'),

    `${safeExportNumber(row.avg_time_spent)} min`,

    safeExportNumber(row.onboarded_teachers),
    formatExportPercent(percentages.onboardedTeachersPct, 'NA'),

    safeExportNumber(row.activated_teachers),
    formatExportPercent(percentages.activatedTeachersPct, '0%'),

    safeExportNumber(row.active_teachers),
    formatExportPercent(percentages.activeTeachersPct, '0%'),
  ];
};

const buildProgramMetricExportRows = (
  rows: ProgramListSourceRow[],
  filters: Filters,
  selectedDateRange: DateRangeValue,
  selectedTab: PROGRAM_TAB,
): ExportCellValue[][] => [
  ...buildProgramExportMetadataRows(filters, selectedDateRange, selectedTab),
  [
    toExportText(t('Program Name')),
    toExportText(t('Total Schools')),
    toExportText(t('School Division')),
    '',
    '',
    toExportText(t('Onboarded Students')),
    '',
    toExportText(t('Activated Students')),
    '',
    toExportText(t('Active Users')),
    '',
    toExportText(t('Avg Engagement')),
    toExportText(t('Onboarded Teachers')),
    '',
    toExportText(t('Activated Teachers')),
    '',
    toExportText(t('Active Teachers')),
    '',
  ],
  [
    '',
    '',
    toExportText(t('Performing Well')),
    toExportText(t('Needs Attention')),
    toExportText(t('Needs Support')),
    toExportText(t('Count')),
    '%',
    toExportText(t('Count')),
    '%',
    toExportText(t('Count')),
    '%',
    '',
    toExportText(t('Count')),
    '%',
    toExportText(t('Count')),
    '%',
    toExportText(t('Count')),
    '%',
  ],
  ...rows.map(buildProgramMetricExportRow),
];

const buildWorkbook = async (
  sheetRows: ExportCellValue[][],
  tableHeaderRowIndex: number,
) => {
  const XLSX = await getXlsx();
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const subHeaderRowIndex = tableHeaderRowIndex + 1;
  const firstDataCell = `B${subHeaderRowIndex + 2}`;
  const sheetFreeze = {
    [EXPORT_SHEET_NAME]: {
      xSplit: 1,
      ySplit: subHeaderRowIndex + 1,
      topLeftCell: firstDataCell,
      activePane: 'bottomRight',
    } satisfies FreezePaneConfig,
  };

  const metadataMergeRows = Array.from(
    { length: Math.max(tableHeaderRowIndex - 1, 0) },
    (_, rowIndex) => ({
      s: { r: rowIndex, c: 1 },
      e: { r: rowIndex, c: 17 },
    }),
  );

  worksheet['!merges'] = [
    ...metadataMergeRows,
    { s: { r: tableHeaderRowIndex, c: 0 }, e: { r: subHeaderRowIndex, c: 0 } },
    { s: { r: tableHeaderRowIndex, c: 1 }, e: { r: subHeaderRowIndex, c: 1 } },
    {
      s: { r: tableHeaderRowIndex, c: 2 },
      e: { r: tableHeaderRowIndex, c: 4 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 5 },
      e: { r: tableHeaderRowIndex, c: 6 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 7 },
      e: { r: tableHeaderRowIndex, c: 8 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 9 },
      e: { r: tableHeaderRowIndex, c: 10 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 11 },
      e: { r: subHeaderRowIndex, c: 11 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 12 },
      e: { r: tableHeaderRowIndex, c: 13 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 14 },
      e: { r: tableHeaderRowIndex, c: 15 },
    },
    {
      s: { r: tableHeaderRowIndex, c: 16 },
      e: { r: tableHeaderRowIndex, c: 17 },
    },
  ];

  worksheet['!cols'] = [
    { wch: 58 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
  ];

  const borderStyle = {
    top: { style: 'thin', color: { rgb: 'BFBFBF' } },
    bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
    left: { style: 'thin', color: { rgb: 'BFBFBF' } },
    right: { style: 'thin', color: { rgb: 'BFBFBF' } },
  };

  const baseCellStyle = {
    border: borderStyle,
    alignment: {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true,
    },
  };

  const headerStyle = {
    ...baseCellStyle,
    fill: { fgColor: { rgb: '0070C0' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true },
  };

  const subHeaderStyle = {
    ...baseCellStyle,
    fill: { fgColor: { rgb: 'F2F2F2' } },
    font: { bold: true },
  };

  const subHeaderGreenStyle = {
    ...subHeaderStyle,
    fill: { fgColor: { rgb: 'C6EFCE' } },
  };

  const subHeaderYellowStyle = {
    ...subHeaderStyle,
    fill: { fgColor: { rgb: 'FFE699' } },
  };

  const subHeaderRedStyle = {
    ...subHeaderStyle,
    fill: { fgColor: { rgb: 'F4CCCC' } },
  };

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:R1');

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: 's', v: '' };
      }

      if (rowIndex < tableHeaderRowIndex) {
        worksheet[cellRef].s = {
          ...baseCellStyle,
          alignment: {
            horizontal: colIndex === 0 ? 'left' : 'left',
            vertical: 'center',
            wrapText: true,
          },
          font: colIndex === 0 ? { bold: true } : undefined,
        };
      } else if (rowIndex === tableHeaderRowIndex) {
        worksheet[cellRef].s = headerStyle;
      } else if (rowIndex === subHeaderRowIndex) {
        if (colIndex === 2) {
          worksheet[cellRef].s = subHeaderGreenStyle;
        } else if (colIndex === 3) {
          worksheet[cellRef].s = subHeaderYellowStyle;
        } else if (colIndex === 4) {
          worksheet[cellRef].s = subHeaderRedStyle;
        } else {
          worksheet[cellRef].s = subHeaderStyle;
        }
      } else {
        worksheet[cellRef].s = baseCellStyle;
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME);

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer;
  return applyFreezePanesToWorkbook(output, [EXPORT_SHEET_NAME], sheetFreeze);
};

const fetchAllProgramsForExport = async ({
  api,
  filters,
  selectedTab,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
}: Omit<
  UseProgramListExportParams,
  'total' | 'isLoading' | 'isSearchPending'
>) => {
  const allPrograms: ProgramListSourceRow[] = [];
  let currentPage = 1;
  let exportTotal = 0;

  while (currentPage === 1 || allPrograms.length < exportTotal) {
    const response = await fetchProgramListPage({
      api,
      filters,
      selectedTab,
      page: currentPage,
      pageSize: EXPORT_PAGE_SIZE,
      orderBy,
      orderDir,
      searchTerm,
      selectedDateRange,
    });

    exportTotal = response.total ?? response.data.length;
    allPrograms.push(...response.data);

    if (
      response.data.length === 0 ||
      response.data.length < EXPORT_PAGE_SIZE ||
      allPrograms.length >= exportTotal
    ) {
      break;
    }
    currentPage += 1;
  }

  return allPrograms;
};

const useProgramListExport = ({
  api,
  filters,
  selectedTab,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
  total,
  isLoading,
  isSearchPending,
  visibleColumns,
}: UseProgramListExportParams & {
  visibleColumns: Column<ProgramListRow>[];
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const isExportDisabled =
    isLoading || isSearchPending || isExporting || total === 0;

  const handleExportPrograms = useCallback(async () => {
    if (isExportDisabled) return;

    setIsExporting(true);
    try {
      const rows = await fetchAllProgramsForExport({
        api,
        filters,
        selectedTab,
        orderBy,
        orderDir,
        searchTerm,
        selectedDateRange,
      });
      const metadataRows = buildProgramExportMetadataRows(
        filters,
        selectedDateRange,
        selectedTab,
      );
      const sheetRows = buildProgramMetricExportRows(
        rows,
        filters,
        selectedDateRange,
        selectedTab,
      );
      const output = await buildWorkbook(sheetRows, metadataRows.length);
      const blob = new Blob([output], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      await Util.handleBlobDownloadAndSave(blob, EXPORT_FILE_NAME);
    } catch (error) {
      logger.error('Failed to export program listing', error);
    } finally {
      setIsExporting(false);
    }
  }, [
    api,
    filters,
    isExportDisabled,
    orderBy,
    orderDir,
    searchTerm,
    selectedDateRange,
    selectedTab,
  ]);

  return { isExporting, isExportDisabled, handleExportPrograms };
};

export const useProgramPageLogic = () => {
  const api = ServiceConfig.getI().apiHandler;
  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);
  const [selectedTab, setSelectedTab] = useState<PROGRAM_TAB>(() => {
    const queryTab = qs.get('tab') as PROGRAM_TAB | null;
    return queryTab === PROGRAM_TAB.AT_SCHOOL ||
      queryTab === PROGRAM_TAB.AT_HOME ||
      queryTab === PROGRAM_TAB.HYBRID
      ? queryTab
      : PROGRAM_TAB.ALL;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const [filters, setFilters] = useState<Filters>(() =>
    parseProgramListJsonParam(qs.get('filters'), createEmptyProgramFilters()),
  );
  const [tempFilters, setTempFilters] = useState<Filters>(() =>
    createEmptyProgramFilters(),
  );
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeValue>(
    () => {
      const range = qs.get('range');
      return range === '15d' || range === '30d' ? range : DEFAULT_DATE_RANGE;
    },
  );
  const [page, setPage] = useState(() => {
    const value = parseInt(qs.get('page') || '', 10);
    return isNaN(value) || value < 1 ? 1 : value;
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Filters>(() =>
    createEmptyProgramFilters(),
  );
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('programName');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const isSearchPending = searchTerm !== debouncedSearchTerm;
  const pageSize = DEFAULT_PROGRAM_PAGE_SIZE;
  const {
    programs,
    total,
    isLoading: isDataLoading,
  } = useProgramListData({
    api,
    filters,
    selectedTab,
    page,
    pageSize,
    orderBy,
    orderDir,
    searchTerm: debouncedSearchTerm,
    selectedDateRange,
  });
  const rows = useMemo(() => mapProgramRowsToRenderRows(programs), [programs]);
  const columns = useMemo(() => getProgramListColumns(), []);
  const isLoading = isFilterLoading || isDataLoading;
  const { isExporting, isExportDisabled, handleExportPrograms } =
    useProgramListExport({
      api,
      filters,
      selectedTab,
      orderBy,
      orderDir,
      searchTerm: debouncedSearchTerm,
      selectedDateRange,
      total,
      isLoading,
      isSearchPending,
      visibleColumns: columns,
    });

  useEffect(() => setTempFilters(filters), [filters]);

  useEffect(() => {
    const fetchFilterOptions = async (): Promise<void> => {
      setIsFilterLoading(true);
      try {
        setFilterOptions(
          mapProgramFilterOptions(await api.getProgramFilterOptions()),
        );
      } catch (error) {
        logger.error('Failed to fetch program filters', error);
      } finally {
        setIsFilterLoading(false);
      }
    };
    fetchFilterOptions();
  }, [api]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== PROGRAM_TAB.ALL) params.set('tab', selectedTab);
    if (searchTerm) params.set('search', searchTerm);
    if (hasProgramListFilters(filters)) {
      params.set('filters', JSON.stringify(filters));
    }
    if (selectedDateRange !== DEFAULT_DATE_RANGE) {
      params.set('range', selectedDateRange);
    }
    if (page !== 1) params.set('page', String(page));
    history.replace({ search: params.toString() });
  }, [filters, history, page, searchTerm, selectedDateRange, selectedTab]);

  const handleSort = useCallback(
    (colKey: string) => {
      if (!SORTABLE_PROGRAM_COLUMNS.has(colKey)) return;
      if (orderBy === colKey) {
        setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setOrderBy(colKey);
        setOrderDir('desc');
      }
      setPage(1);
    },
    [orderBy],
  );

  const handleClearFilters = useCallback(() => {
    const empty = createEmptyProgramFilters();
    setTempFilters(empty);
    setFilters(empty);
    setSelectedDateRange(DEFAULT_DATE_RANGE);
    setIsFilterOpen(false);
    setPage(1);
  }, []);

  const handleHeaderFilterChange = useCallback(
    (filterKey: string, value: string) => {
      setFilters((prev) => {
        const currentValues = prev[filterKey] ?? [];
        const nextValues = currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value];
        return { ...prev, [filterKey]: nextValues };
      });
      setPage(1);
    },
    [],
  );

  return {
    columns,
    filters,
    filterOptions,
    handleClearFilters,
    handleExportPrograms,
    handleHeaderFilterChange,
    handleSort,
    history,
    isExportDisabled,
    isExporting,
    isFilterOpen,
    isLoading,
    orderBy,
    orderDir,
    page,
    pageCount: Math.ceil(total / pageSize),
    rows,
    searchTerm,
    selectedDateRange,
    selectedTab,
    setFilters,
    setIsFilterOpen,
    setPage,
    setSearchTerm,
    setSelectedDateRange,
    setSelectedTab,
    setTempFilters,
    tableScrollRef,
    tempFilters,
    newProgramPath: PAGES.SIDEBAR_PAGE + PAGES.NEW_PROGRAM,
  };
};
