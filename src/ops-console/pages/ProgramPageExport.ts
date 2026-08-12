import { useCallback, useState } from 'react';
import { t } from 'i18next';
import type * as XLSXModule from 'xlsx-js-style';
import {
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
  SCHOOL_PERFORMANCE_STATUS,
  SCHOOL_PERFORMANCE_TRANSLATION_KEYS,
} from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
} from '../../utility/xlsxExportUtils';
import type { Column } from '../components/DataTableBody';
import {
  DATE_RANGE_OPTIONS,
  type DateRangeValue,
  type Filters,
} from './SchoolList.helpers';
import { getProgramSelectedFilterText } from './ProgramPageConfig';
import {
  fetchProgramListPage,
  ProgramListRow,
  ProgramListSourceRow,
} from './ProgramPageRows';

const EXPORT_SHEET_NAME = 'Programs';
const EXPORT_FILE_NAME = 'ProgramMetrics.xlsx';
const EXPORT_PAGE_SIZE = 500;
type XlsxModule = typeof XLSXModule;
let xlsxModulePromise: Promise<XlsxModule> | null = null;

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
  visibleColumns?: Column<ProgramListRow>[];
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
    toExportText(t('Active Students')),
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
    toExportText(
      t(
        SCHOOL_PERFORMANCE_TRANSLATION_KEYS[
          SCHOOL_PERFORMANCE_STATUS.PERFORMING_WELL
        ],
      ),
    ),
    toExportText(
      t(
        SCHOOL_PERFORMANCE_TRANSLATION_KEYS[
          SCHOOL_PERFORMANCE_STATUS.NEEDS_ATTENTION
        ],
      ),
    ),
    toExportText(
      t(
        SCHOOL_PERFORMANCE_TRANSLATION_KEYS[
          SCHOOL_PERFORMANCE_STATUS.NEEDS_SUPPORT
        ],
      ),
    ),
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

export const useProgramListExport = ({
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
