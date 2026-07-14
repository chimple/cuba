import type {
  CampaignRewardsReportSortKey,
  CampaignRewardsPayload,
  CampaignStudentPerformanceRow,
} from '../../../services/api/ServiceApi';
import type { Column } from '../DataTableBody';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import type * as XLSXModule from 'xlsx-js-style';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
  XLSX_EXPORT_BORDER_COLOR,
  XLSX_EXPORT_FONT_NAME,
  XLSX_EXPORT_FONT_SIZE,
} from '../../../utility/xlsxExportUtils';

type XlsxModule = typeof XLSXModule;
type XlsxWorkSheet = XLSXModule.WorkSheet;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

export type CampaignRewardRow = {
  id: string;
  studentId: string;
  classId: string;
  studentName: string;
  school: string;
  className: string;
  completionPercent: number;
  rewardRank: number | null;
  rewardLabel: string;
  calculatedAt: string | null;
};

export type CampaignRewardSummaryCard = {
  key: string;
  label: string;
  count: number;
  percent: number | null;
  info: string;
};

export const CAMPAIGN_REPORT_SUBTABS = [
  'School Performance',
  'Assignments',
  'Messages',
  'Rewards',
] as const;

export const CAMPAIGN_REWARD_PAGE_SIZE = 10;
export const CAMPAIGN_REWARD_EXPORT_FILE_NAME = 'CampaignRewards.xlsx';
const CAMPAIGN_REWARD_EXPORT_SHEET_NAME = 'Campaign Rewards';
const EMPTY_VALUE = '---';

export const parseCampaignRewards = (
  rewards?: string | CampaignRewardsPayload | null,
): CampaignRewardsPayload | null => {
  if (!rewards) return null;
  if (typeof rewards !== 'string') return rewards;

  try {
    const parsed = JSON.parse(rewards) as CampaignRewardsPayload;
    return parsed?.rules?.length ? parsed : null;
  } catch {
    return null;
  }
};

export const getCampaignRewardTypeLabel = (
  rewards?: CampaignRewardsPayload | null,
) =>
  rewards?.type === 'physical_rewards' ? t('Physical Reward') : t('Reward');

const getRewardLabelForRank = (
  rewards: CampaignRewardsPayload | null,
  rank: number | null,
) => {
  if (!rank) return EMPTY_VALUE;
  return (
    rewards?.rules?.find((rule) => rule.rank === rank)?.reward || EMPTY_VALUE
  );
};

export const mapCampaignPerformanceRowsToRewardRows = (
  rows: CampaignStudentPerformanceRow[],
  rewards: CampaignRewardsPayload | null,
): CampaignRewardRow[] => {
  const dedupedRows = new Map<string, CampaignStudentPerformanceRow>();

  rows.forEach((row) => {
    const key = `${row.campaign_id}:${row.class_id}:${row.student_id}`;
    const currentRow = dedupedRows.get(key);
    const currentTime = currentRow?.calculated_at
      ? new Date(currentRow.calculated_at).getTime()
      : 0;
    const nextTime = row.calculated_at
      ? new Date(row.calculated_at).getTime()
      : 0;

    if (!currentRow || nextTime >= currentTime) {
      dedupedRows.set(key, row);
    }
  });

  return Array.from(dedupedRows.values()).map((row) => {
    const rank =
      typeof row.rank === 'number' && row.rank >= 1 && row.rank <= 3
        ? row.rank
        : null;

    return {
      id: row.id,
      studentId: row.student_id,
      classId: row.class_id,
      studentName: row.student_name || EMPTY_VALUE,
      school: row.school_name || EMPTY_VALUE,
      className: row.class_name || EMPTY_VALUE,
      completionPercent: Math.round(Number(row.completion_percentage ?? 0)),
      rewardRank: rank,
      rewardLabel: getRewardLabelForRank(rewards, rank),
      calculatedAt: row.calculated_at,
    };
  });
};

export const buildCampaignRewardColumns = (
  rewardTypeLabel: string,
): Column<CampaignRewardRow>[] => [
  { key: 'studentName', label: t('STUDENT NAME'), width: 180, sortable: true },
  { key: 'school', label: t('SCHOOL'), width: 190, sortable: true },
  {
    key: 'className',
    label: t('CLASS'),
    width: 90,
    sortable: true,
    align: 'center',
  },
  {
    key: 'completionPercent',
    label: t('COMPLETION %'),
    width: 140,
    sortable: true,
    align: 'center',
  },
  {
    key: 'rewardRank',
    label: t('REWARD RANK'),
    width: 120,
    sortable: true,
    align: 'center',
  },
  { key: 'rewardLabel', label: rewardTypeLabel.toUpperCase(), sortable: true },
];

export const getRewardCompletionTone = (percent: number) => {
  if (percent >= 80) return { bg: '#DFF7EB', color: '#2BA980' };
  if (percent >= 31) return { bg: '#FEF3C7', color: '#E7A54E' };
  return { bg: '#FCE8E6', color: '#D35451' };
};

export const getCampaignRewardFilterOptions = (rows: CampaignRewardRow[]) => ({
  schools: [
    t('All Schools'),
    ...Array.from(new Set(rows.map((row) => row.school))).filter(
      (school) => school !== EMPTY_VALUE,
    ),
  ],
  classes: [
    t('All Classes'),
    ...Array.from(new Set(rows.map((row) => row.className))).filter(
      (className) => className !== EMPTY_VALUE,
    ),
  ],
});

export const filterCampaignRewardRows = (
  rows: CampaignRewardRow[],
  schoolFilter: string,
  classFilter: string,
) =>
  rows.filter((row) => {
    const schoolMatches =
      schoolFilter === t('All Schools') || row.school === schoolFilter;
    const classMatches =
      classFilter === t('All Classes') || row.className === classFilter;
    return schoolMatches && classMatches;
  });

export const sortCampaignRewardRows = (
  rows: CampaignRewardRow[],
  orderBy: string,
  order: 'asc' | 'desc',
) => {
  const sortedRows = [...rows].sort((left, right) => {
    const leftValue = left[orderBy as keyof CampaignRewardRow];
    const rightValue = right[orderBy as keyof CampaignRewardRow];
    const normalizedLeft =
      leftValue === null ? Number.POSITIVE_INFINITY : leftValue;
    const normalizedRight =
      rightValue === null ? Number.POSITIVE_INFINITY : rightValue;

    if (
      typeof normalizedLeft === 'number' &&
      typeof normalizedRight === 'number'
    ) {
      return normalizedLeft - normalizedRight;
    }

    return String(normalizedLeft).localeCompare(
      String(normalizedRight),
      undefined,
      {
        sensitivity: 'base',
      },
    );
  });
  return order === 'asc' ? sortedRows : sortedRows.reverse();
};

export const buildCampaignRewardSummaryCards = (
  rows: CampaignRewardRow[],
): CampaignRewardSummaryCard[] => {
  const totalStudents = rows.length;
  const createPercent = (count: number) =>
    totalStudents > 0 ? Math.round((count / totalStudents) * 100) : null;
  const rank1 = rows.filter((row) => row.rewardRank === 1).length;
  const rank2 = rows.filter((row) => row.rewardRank === 2).length;
  const rank3 = rows.filter((row) => row.rewardRank === 3).length;
  const nonRankHolders = rows.filter((row) => row.rewardRank === null).length;

  return [
    {
      key: 'rank1',
      label: t('Reward Rank 1'),
      count: rank1,
      percent: createPercent(rank1),
      info: t('Students currently qualifying for reward rank 1.'),
    },
    {
      key: 'rank2',
      label: t('Reward Rank 2'),
      count: rank2,
      percent: createPercent(rank2),
      info: t('Students currently qualifying for reward rank 2.'),
    },
    {
      key: 'rank3',
      label: t('Reward Rank 3'),
      count: rank3,
      percent: createPercent(rank3),
      info: t('Students currently qualifying for reward rank 3.'),
    },
    {
      key: 'nonRank',
      label: t('Non-rank holders'),
      count: nonRankHolders,
      percent: createPercent(nonRankHolders),
      info: t('Students who do not currently qualify for any reward rank.'),
    },
    {
      key: 'totalStudents',
      label: t('Total No. Students'),
      count: totalStudents,
      percent: null,
      info: t('Total number of students included in this campaign.'),
    },
  ];
};

export const getLatestCalculatedAt = (rows: CampaignRewardRow[]) =>
  rows.reduce<string | null>((latest, row) => {
    if (!row.calculatedAt) return latest;
    if (!latest) return row.calculatedAt;
    return new Date(row.calculatedAt).getTime() > new Date(latest).getTime()
      ? row.calculatedAt
      : latest;
  }, null);

export const formatCampaignRewardLastUpdated = (value: string | null) => {
  if (!value) return t('Not calculated yet');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('Not calculated yet');

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const buildCampaignRewardExportRows = (
  rows: CampaignRewardRow[],
  rewardTypeLabel: string,
) => [
  [
    t('Student Name'),
    t('School'),
    t('Class'),
    t('Completion %'),
    t('Reward Rank'),
    rewardTypeLabel,
    t('Calculated At'),
  ],
  ...rows.map((row) => [
    row.studentName,
    row.school,
    row.className,
    `${row.completionPercent}%`,
    row.rewardRank ?? EMPTY_VALUE,
    row.rewardLabel,
    row.calculatedAt
      ? formatCampaignRewardLastUpdated(row.calculatedAt)
      : t('Not calculated yet'),
  ]),
];

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

const applyCampaignRewardExportFormatting = (
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
          vertical: isHeader ? 'center' : 'top',
          wrapText: columnIndex === 0,
        },
      };
    }
  }
};

const applyCampaignRewardExportWidths = (
  worksheet: XlsxWorkSheet,
  sheetRows: unknown[][],
) => {
  worksheet['!cols'] = (sheetRows[0] ?? []).map((_, columnIndex) => {
    const maxLength = sheetRows.reduce((width, row) => {
      const value = String(row[columnIndex] ?? '');
      return Math.max(width, value.length);
    }, 0);
    return { wch: Math.max(columnIndex === 0 ? 24 : 14, maxLength + 2) };
  });
  worksheet['!rows'] = Array.from({ length: sheetRows.length }, (_, index) =>
    index === 0 ? { hpt: 20 } : { hpt: 28 },
  );
};

export const buildCampaignRewardExportWorkbook = async (
  rows: CampaignRewardRow[],
  rewardTypeLabel: string,
) => {
  const XLSX = await getXlsx();
  const sheetRows = buildCampaignRewardExportRows(rows, rewardTypeLabel);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const freezeConfig = {
    [CAMPAIGN_REWARD_EXPORT_SHEET_NAME]: {
      xSplit: 1,
      ySplit: 1,
      topLeftCell: 'B2',
      activePane: 'bottomRight',
    } satisfies FreezePaneConfig,
  };

  applyCampaignRewardExportFormatting(
    XLSX,
    worksheet,
    sheetRows.length,
    sheetRows[0]?.length ?? 0,
  );
  applyCampaignRewardExportWidths(worksheet, sheetRows);
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    CAMPAIGN_REWARD_EXPORT_SHEET_NAME,
  );

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer;

  return applyFreezePanesToWorkbook(
    output,
    [CAMPAIGN_REWARD_EXPORT_SHEET_NAME],
    freezeConfig,
  );
};

export const exportCampaignRewardRows = async (
  rows: CampaignRewardRow[],
  rewardTypeLabel: string,
) => {
  const output = await buildCampaignRewardExportWorkbook(rows, rewardTypeLabel);
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await Util.handleBlobDownloadAndSave(blob, CAMPAIGN_REWARD_EXPORT_FILE_NAME);
};

export const useCampaignRewardsReportState = (
  campaignId?: string,
  rewards?: string | CampaignRewardsPayload | null,
) => {
  const allSchoolsLabel = t('All Schools');
  const allClassesLabel = t('All Classes');
  const [selectedSubtab, setSelectedSubtab] =
    useState<(typeof CAMPAIGN_REPORT_SUBTABS)[number]>('Rewards');
  const [schoolFilter, setSchoolFilter] = useState(allSchoolsLabel);
  const [classFilter, setClassFilter] = useState(allClassesLabel);
  const [orderBy, setOrderBy] = useState('completionPercent');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [performanceRows, setPerformanceRows] = useState<CampaignRewardRow[]>(
    [],
  );
  const [filterOptionRows, setFilterOptionRows] = useState<CampaignRewardRow[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const parsedRewards = useMemo(() => parseCampaignRewards(rewards), [rewards]);
  const rewardTypeLabel = useMemo(
    () => getCampaignRewardTypeLabel(parsedRewards),
    [parsedRewards],
  );
  const filterOptions = useMemo(
    () => getCampaignRewardFilterOptions(filterOptionRows),
    [filterOptionRows],
  );
  const filteredRows = useMemo(
    () => filterCampaignRewardRows(performanceRows, schoolFilter, classFilter),
    [classFilter, performanceRows, schoolFilter],
  );
  const summaryCards = useMemo(
    () => buildCampaignRewardSummaryCards(filteredRows),
    [filteredRows],
  );
  const lastUpdated = useMemo(
    () =>
      formatCampaignRewardLastUpdated(getLatestCalculatedAt(performanceRows)),
    [performanceRows],
  );
  const sortedRows = useMemo(
    () => sortCampaignRewardRows(filteredRows, orderBy, order),
    [filteredRows, order, orderBy],
  );
  const pageCount = Math.max(
    1,
    Math.ceil(sortedRows.length / CAMPAIGN_REWARD_PAGE_SIZE),
  );
  const paginatedRows = sortedRows.slice(
    (page - 1) * CAMPAIGN_REWARD_PAGE_SIZE,
    page * CAMPAIGN_REWARD_PAGE_SIZE,
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    let active = true;
    const loadRewardsReport = async () => {
      if (!campaignId) {
        setPerformanceRows([]);
        setFilterOptionRows([]);
        return;
      }

      setLoading(true);
      try {
        const response =
          await ServiceConfig.getI().apiHandler.getCampaignRewardsReport(
            campaignId,
            {
              schoolName:
                schoolFilter === allSchoolsLabel ? undefined : schoolFilter,
              className:
                classFilter === allClassesLabel ? undefined : classFilter,
              orderBy: orderBy as CampaignRewardsReportSortKey,
              order,
            },
          );
        if (!active) return;
        const nextRows = mapCampaignPerformanceRowsToRewardRows(
          response.rows,
          parsedRewards,
        );
        setPerformanceRows(nextRows);
        if (
          schoolFilter === allSchoolsLabel &&
          classFilter === allClassesLabel
        ) {
          setFilterOptionRows(nextRows);
        }
      } catch (error) {
        if (!active) return;
        logger.error('Error loading campaign rewards report:', error);
        setPerformanceRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRewardsReport();
    return () => {
      active = false;
    };
  }, [
    allClassesLabel,
    allSchoolsLabel,
    campaignId,
    classFilter,
    order,
    orderBy,
    parsedRewards,
    schoolFilter,
  ]);

  const handleSort = (key: string) => {
    setPage(1);
    if (orderBy === key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setOrderBy(key);
    setOrder(
      key === 'studentName' || key === 'school' || key === 'className'
        ? 'asc'
        : 'desc',
    );
  };

  const handleSchoolFilterChange = (value: string) => {
    setSchoolFilter(value);
    if (value === allSchoolsLabel) {
      setClassFilter(allClassesLabel);
    }
    setPage(1);
  };

  const handleClassFilterChange = (value: string) => {
    setClassFilter(value);
    setPage(1);
  };

  const handleExport = async () => {
    if (isExporting || sortedRows.length === 0) return;
    setIsExporting(true);
    try {
      await exportCampaignRewardRows(sortedRows, rewardTypeLabel);
    } catch (error) {
      logger.error('Failed to export campaign rewards report', error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    classFilter,
    filterOptions,
    handleClassFilterChange,
    handleExport,
    handleSchoolFilterChange,
    handleSort,
    isExporting,
    lastUpdated,
    loading,
    order,
    orderBy,
    page,
    pageCount,
    paginatedRows,
    rewardTypeLabel,
    schoolFilter,
    selectedSubtab,
    setPage,
    setSelectedSubtab,
    summaryCards,
  };
};
