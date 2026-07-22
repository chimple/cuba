import { t } from 'i18next';
import type {
  CampaignRewardsPayload,
  CampaignStudentPerformanceRow,
} from '../../../../services/api/ServiceApi';
import type { Column } from '../../DataTableBody';
import {
  CAMPAIGN_REWARD_PAGE_SIZE,
  EMPTY_VALUE,
  type CampaignRewardRow,
  type CampaignRewardSummaryCard,
} from './campaignRewardTypes';

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
) => (rewards?.type === 'digital_rewards' ? t('Reward') : t('Physical Reward'));

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
});

export const getCampaignRewardClassOptions = (
  rows: CampaignRewardRow[],
  schoolFilter: string,
) => {
  const scopedRows =
    schoolFilter === t('All Schools')
      ? rows
      : rows.filter((row) => row.school === schoolFilter);

  return [
    t('All Classes'),
    ...Array.from(new Set(scopedRows.map((row) => row.className))).filter(
      (className) => className !== EMPTY_VALUE,
    ),
  ];
};

const compareNullableValues = (
  leftValue: CampaignRewardRow[keyof CampaignRewardRow],
  rightValue: CampaignRewardRow[keyof CampaignRewardRow],
) => {
  if (leftValue === null && rightValue === null) return 0;
  if (leftValue === null) return 1;
  if (rightValue === null) return -1;

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue - rightValue;
  }

  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

export const paginateCampaignRewardRows = (
  rows: CampaignRewardRow[],
  page: number,
) =>
  rows.slice(
    (page - 1) * CAMPAIGN_REWARD_PAGE_SIZE,
    page * CAMPAIGN_REWARD_PAGE_SIZE,
  );

export const getSafeCampaignRewardPage = (page: number, pageCount: number) =>
  Math.min(Math.max(page, 1), Math.max(pageCount, 1));

export const getNextSchoolAndClassFilters = ({
  allClassesLabel,
  allSchoolsLabel,
  currentClassFilter,
  nextSchoolFilter,
  rows,
}: {
  allClassesLabel: string;
  allSchoolsLabel: string;
  currentClassFilter: string;
  nextSchoolFilter: string;
  rows: CampaignRewardRow[];
}) => {
  if (nextSchoolFilter === allSchoolsLabel) {
    return {
      schoolFilter: nextSchoolFilter,
      classFilter: allClassesLabel,
    };
  }

  const nextClassOptions = getCampaignRewardClassOptions(
    rows,
    nextSchoolFilter,
  );
  return {
    schoolFilter: nextSchoolFilter,
    classFilter: nextClassOptions.includes(currentClassFilter)
      ? currentClassFilter
      : allClassesLabel,
  };
};

export const getNextClassFilter = ({
  allClassesLabel,
  classFilter,
  classOptions,
}: {
  allClassesLabel: string;
  classFilter: string;
  classOptions: string[];
}) => (classOptions.includes(classFilter) ? classFilter : allClassesLabel);

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
    return compareNullableValues(leftValue, rightValue);
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
