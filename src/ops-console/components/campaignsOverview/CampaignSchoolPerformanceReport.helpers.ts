import { useEffect, useMemo, useState } from 'react';
import { t } from 'i18next';
import type * as XLSXModule from 'xlsx-js-style';
import { ServiceConfig } from '../../../services/ServiceConfig';
import type {
  CampaignSchoolPerformanceMetricWindow,
  CampaignSchoolPerformanceReportResponse,
} from '../../../services/api/ServiceApi';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
  XLSX_EXPORT_BORDER_COLOR,
  XLSX_EXPORT_FONT_NAME,
  XLSX_EXPORT_FONT_SIZE,
} from '../../../utility/xlsxExportUtils';

type XlsxModule = typeof XLSXModule;
type XlsxWorkSheet = XLSXModule.WorkSheet;
type DaysFilterKey = 'last7' | 'campaignDays';
type ActiveStudentsLevel = 'low' | 'mid' | 'high';

let xlsxModulePromise: Promise<XlsxModule> | null = null;

export type SchoolPerformanceColumnKey =
  | 'schoolName'
  | 'activeStudents'
  | 'activeStudentsHomework'
  | 'activeStudentsLearningPathway'
  | 'avgTimeSpent'
  | 'avgActivitiesCompleted';

export type CampaignSchoolPerformanceRow = {
  id: string;
  schoolName: string;
  udise: string;
  block: string;
  activeStudents: number;
  activeStudentsPercent: number;
  activeStudentsHomework: number;
  activeStudentsLearningPathway: number;
  avgTimeSpentMinutes: number;
  avgTimeSpentLabel: string;
  avgActivitiesCompleted: number;
};

export const SCHOOL_PERFORMANCE_PAGE_SIZE = 20;
export const CAMPAIGN_SCHOOL_EXPORT_FILE_NAME =
  'CampaignSchoolPerformance.xlsx';
const CAMPAIGN_SCHOOL_EXPORT_SHEET_NAME = 'Campaign Schools';

export const SCHOOL_PERFORMANCE_DAY_FILTERS = [
  { key: 'last7' as const, label: 'Last 7 Days' },
  { key: 'campaignDays' as const, label: 'Campaign Days' },
] as const;

export const SCHOOL_PERFORMANCE_ACTIVE_STUDENT_FILTERS = [
  {
    key: 'low' as const,
    label: 'Low',
    chipLabel: '<= 30%',
    color: '#EF6C5B',
    bg: '#FCE8E6',
  },
  {
    key: 'mid' as const,
    label: 'Mid',
    chipLabel: '31% - 69%',
    color: '#D6921D',
    bg: '#FEF3C7',
  },
  {
    key: 'high' as const,
    label: 'High',
    chipLabel: '>= 70%',
    color: '#2BA980',
    bg: '#DFF7EB',
  },
] as const;

export const SCHOOL_PERFORMANCE_COLUMNS = [
  {
    key: 'schoolName',
    label: 'School Name',
    width: 220,
    align: 'left' as const,
    headerAlign: 'left' as const,
  },
  {
    key: 'activeStudents',
    label: 'Active Students',
    tooltip:
      'Total number of unique students who completed at least one meaningful learning activity during the selected period.',
    width: 138,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
  {
    key: 'activeStudentsHomework',
    label: 'Active Students Homework',
    tooltip:
      'Total number of unique students who completed at least one homework from campaign during the selected period.',
    width: 156,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
  {
    key: 'activeStudentsLearningPathway',
    label: 'Active Students Learning Pathway',
    tooltip:
      'Total number of unique students who completed at least one learning pathway during the selected period.',
    width: 164,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
  {
    key: 'avgTimeSpent',
    label: 'Average Time Spent',
    tooltip:
      'Average time spent by active students during the selected period.',
    width: 118,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
  {
    key: 'avgActivitiesCompleted',
    label: 'Average Activities Completed',
    tooltip:
      'Average number of learning activities completed per active student during the selected period.',
    width: 144,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
] as const;

const DAY_FILTER_TO_METRIC_WINDOW: Record<
  DaysFilterKey,
  CampaignSchoolPerformanceMetricWindow
> = {
  last7: '7d',
  campaignDays: 'campaign_days',
};

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

/**
 * Campaign school metrics return the activated denominator separately so the UI
 * can own the displayed percentage without pushing presentation math into the API.
 */
export const calculateActiveStudentsPercent = (
  activeStudents: number,
  activatedStudents: number,
) =>
  activatedStudents > 0
    ? Math.min(100, Math.round((activeStudents / activatedStudents) * 100))
    : 0;

const formatInteger = (value: number) => value.toLocaleString('en-IN');

const formatDurationMinutes = (value: number) =>
  `${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}m`;

const matchesLevel = (percent: number, level: ActiveStudentsLevel | null) => {
  if (!level) return true;
  if (level === 'low') return percent <= 30;
  if (level === 'mid') return percent >= 31 && percent <= 69;
  return percent >= 70;
};

/**
 * Sorting stays client-side in the UI-only phase so the table interactions
 * behave exactly like the production report will later.
 */
const sortRows = (
  rows: CampaignSchoolPerformanceRow[],
  sortKey: SchoolPerformanceColumnKey,
  sortOrder: 'asc' | 'desc',
) => {
  const sorted = [...rows].sort((left, right) => {
    const leftValue =
      sortKey === 'schoolName'
        ? left.schoolName
        : sortKey === 'activeStudents'
          ? left.activeStudents
          : sortKey === 'activeStudentsHomework'
            ? left.activeStudentsHomework
            : sortKey === 'activeStudentsLearningPathway'
              ? left.activeStudentsLearningPathway
              : sortKey === 'avgTimeSpent'
                ? left.avgTimeSpentMinutes
                : left.avgActivitiesCompleted;
    const rightValue =
      sortKey === 'schoolName'
        ? right.schoolName
        : sortKey === 'activeStudents'
          ? right.activeStudents
          : sortKey === 'activeStudentsHomework'
            ? right.activeStudentsHomework
            : sortKey === 'activeStudentsLearningPathway'
              ? right.activeStudentsLearningPathway
              : sortKey === 'avgTimeSpent'
                ? right.avgTimeSpentMinutes
                : right.avgActivitiesCompleted;

    if (typeof leftValue === 'string') {
      return leftValue.localeCompare(String(rightValue), undefined, {
        sensitivity: 'base',
        numeric: true,
      });
    }

    return Number(leftValue) - Number(rightValue);
  });

  return sortOrder === 'asc' ? sorted : sorted.reverse();
};

/**
 * The API returns the raw metric fields; the page helper converts them into
 * view-ready values and defensive fallbacks for display.
 */
export const mapCampaignSchoolPerformanceRows = (
  response: CampaignSchoolPerformanceReportResponse | null,
): CampaignSchoolPerformanceRow[] =>
  (response?.rows ?? []).map((row) => {
    const activeStudents = row.activeStudents ?? 0;
    const activatedStudents = row.activatedStudents ?? 0;
    const avgTimeSpentMinutes = row.avgTimeSpent ?? 0;

    return {
      id: row.schoolId,
      schoolName: row.schoolName,
      udise: row.udise ?? '',
      block: row.block ?? '',
      activeStudents,
      activeStudentsPercent: calculateActiveStudentsPercent(
        activeStudents,
        activatedStudents,
      ),
      activeStudentsHomework: row.activeStudentsHomework ?? 0,
      activeStudentsLearningPathway: row.activeStudentsLearningPathway ?? 0,
      avgTimeSpentMinutes,
      avgTimeSpentLabel: formatDurationMinutes(avgTimeSpentMinutes),
      avgActivitiesCompleted: row.avgActivitiesCompleted ?? 0,
    };
  });

export const getActiveStudentTone = (percent: number) => {
  if (percent >= 70) return { bg: '#DFF7EB', color: '#2BA980' };
  if (percent >= 31) return { bg: '#FEF3C7', color: '#D6921D' };
  return { bg: '#FCE8E6', color: '#EF6C5B' };
};

const buildExportSheetRows = (rows: CampaignSchoolPerformanceRow[]) => [
  [
    t('School Name'),
    t('UDISE'),
    t('Block'),
    t('Active Students'),
    t('Active Students %'),
    t('Active Students Homework'),
    t('Active Students Learning Pathway'),
    t('Average Time Spent'),
    t('Average Activities Completed'),
  ],
  ...rows.map((row) => [
    row.schoolName,
    row.udise,
    row.block,
    formatInteger(row.activeStudents),
    `${row.activeStudentsPercent}%`,
    formatInteger(row.activeStudentsHomework),
    formatInteger(row.activeStudentsLearningPathway),
    row.avgTimeSpentLabel,
    Number(row.avgActivitiesCompleted).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    }),
  ]),
];

const applyExportFormatting = (
  xlsx: XlsxModule,
  worksheet: XlsxWorkSheet,
  rowCount: number,
  columnCount: number,
) => {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellRef = xlsx.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[cellRef];
      if (!cell) continue;
      const isHeader = rowIndex === 0;
      cell.s = {
        ...cell.s,
        font: {
          ...(cell.s?.font ?? {}),
          name: XLSX_EXPORT_FONT_NAME,
          sz: XLSX_EXPORT_FONT_SIZE,
          bold: isHeader,
          color: isHeader ? { rgb: 'FFFFFF' } : undefined,
        },
        fill: isHeader
          ? {
              patternType: 'solid',
              fgColor: { rgb: '1A71F6' },
              bgColor: { rgb: '1A71F6' },
            }
          : cell.s?.fill,
        border: {
          top: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
        },
        alignment: {
          ...(cell.s?.alignment ?? {}),
          horizontal: columnIndex === 0 ? 'left' : 'center',
          vertical: isHeader ? 'center' : 'top',
          wrapText: columnIndex === 0,
        },
      };
    }
  }
};

const applyExportWidths = (worksheet: XlsxWorkSheet, sheetRows: string[][]) => {
  worksheet['!cols'] = (sheetRows[0] ?? []).map((_, columnIndex) => ({
    wch:
      columnIndex === 0 ? 28 : columnIndex === 1 || columnIndex === 2 ? 18 : 16,
  }));
  worksheet['!rows'] = Array.from({ length: sheetRows.length }, (_, index) =>
    index === 0 ? { hpt: 22 } : { hpt: 28 },
  );
};

export const exportCampaignSchoolPerformanceRows = async (
  rows: CampaignSchoolPerformanceRow[],
) => {
  const XLSX = await getXlsx();
  const sheetRows = buildExportSheetRows(rows);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const freezeConfig = {
    [CAMPAIGN_SCHOOL_EXPORT_SHEET_NAME]: {
      xSplit: 1,
      ySplit: 1,
      topLeftCell: 'B2',
      activePane: 'bottomRight',
    } satisfies FreezePaneConfig,
  };

  applyExportFormatting(
    XLSX,
    worksheet,
    sheetRows.length,
    sheetRows[0]?.length ?? 0,
  );
  applyExportWidths(worksheet, sheetRows);
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    CAMPAIGN_SCHOOL_EXPORT_SHEET_NAME,
  );

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer;

  const workbookWithFreeze = await applyFreezePanesToWorkbook(
    output,
    [CAMPAIGN_SCHOOL_EXPORT_SHEET_NAME],
    freezeConfig,
  );
  const blob = new Blob([workbookWithFreeze], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  await Util.handleBlobDownloadAndSave(blob, CAMPAIGN_SCHOOL_EXPORT_FILE_NAME);
};

const getAppliedSortLabel = (
  sortKey: SchoolPerformanceColumnKey,
  sortOrder: 'asc' | 'desc',
) => {
  if (sortKey === 'schoolName') {
    return sortOrder === 'asc' ? t('Sort A → Z') : t('Sort Z → A');
  }

  return sortOrder === 'asc' ? t('Sort Low → High') : t('Sort High → Low');
};

/**
 * This hook owns the UI-only state for the new report tab until server-side
 * pagination and filtering are added.
 */
export const useCampaignSchoolPerformanceReportState = (
  campaignId?: string,
) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] =
    useState<CampaignSchoolPerformanceReportResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [daysFilter, setDaysFilter] = useState<DaysFilterKey>('last7');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] =
    useState<SchoolPerformanceColumnKey>('schoolName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeStudentsFilter, setActiveStudentsFilter] =
    useState<ActiveStudentsLevel | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setReportData(null);
      return;
    }

    let active = true;
    setLoading(true);

    const loadReport = async () => {
      try {
        const response =
          await ServiceConfig.getI().apiHandler.getCampaignSchoolPerformanceReport(
            campaignId,
            {
              metricWindow: DAY_FILTER_TO_METRIC_WINDOW[daysFilter],
            },
          );
        if (active) {
          setReportData(response);
        }
      } catch (error) {
        logger.error(
          'Error loading campaign school performance report:',
          error,
        );
        if (active) {
          setReportData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadReport();
    return () => {
      active = false;
    };
  }, [campaignId, daysFilter]);

  const rows = useMemo(
    () => mapCampaignSchoolPerformanceRows(reportData),
    [reportData],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.schoolName.toLowerCase().includes(normalizedSearch) ||
        row.udise.toLowerCase().includes(normalizedSearch);

      return (
        matchesSearch &&
        matchesLevel(row.activeStudentsPercent, activeStudentsFilter)
      );
    });
  }, [activeStudentsFilter, rows, searchTerm]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortKey, sortOrder),
    [filteredRows, sortKey, sortOrder],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(sortedRows.length / SCHOOL_PERFORMANCE_PAGE_SIZE),
  );
  const paginatedRows = sortedRows.slice(
    (page - 1) * SCHOOL_PERFORMANCE_PAGE_SIZE,
    page * SCHOOL_PERFORMANCE_PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [activeStudentsFilter, daysFilter, searchTerm, sortKey, sortOrder]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const appliedSort =
    sortKey === 'schoolName' && sortOrder === 'asc'
      ? null
      : getAppliedSortLabel(sortKey, sortOrder);
  const appliedFilter = SCHOOL_PERFORMANCE_ACTIVE_STUDENT_FILTERS.find(
    (filter) => filter.key === activeStudentsFilter,
  );

  const handleExport = async () => {
    if (isExporting || sortedRows.length === 0) return;
    setIsExporting(true);
    try {
      await exportCampaignSchoolPerformanceRows(sortedRows);
    } catch (error) {
      logger.error(
        'Failed to export campaign school performance report',
        error,
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    activeStudentsFilter,
    appliedFilter,
    appliedSort,
    daysFilter,
    handleExport,
    isExporting,
    loading,
    page,
    pageCount,
    paginatedRows,
    searchTerm,
    setActiveStudentsFilter,
    setDaysFilter,
    setPage,
    setSearchTerm,
    setSortKey,
    setSortOrder,
    sortKey,
    sortOrder,
  };
};
