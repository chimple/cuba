import { useEffect, useMemo, useState } from 'react';
import { t } from 'i18next';
import type { CampaignRewardsPayload } from '../../../../services/api/ServiceApi';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import logger from '../../../../utility/logger';
import {
  CAMPAIGN_REPORT_SUBTABS,
  CAMPAIGN_REWARD_PAGE_SIZE,
  type CampaignRewardRow,
} from './campaignRewardTypes';
import { exportCampaignRewardRows } from './campaignRewardExport';
import {
  buildCampaignRewardSummaryCards,
  filterCampaignRewardRows,
  formatCampaignRewardLastUpdated,
  getCampaignRewardClassOptions,
  getCampaignRewardFilterOptions,
  getCampaignRewardTypeLabel,
  getLatestCalculatedAt,
  getNextClassFilter,
  getNextSchoolAndClassFilters,
  getSafeCampaignRewardPage,
  mapCampaignPerformanceRowsToRewardRows,
  paginateCampaignRewardRows,
  parseCampaignRewards,
  sortCampaignRewardRows,
} from './campaignRewardRows';

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
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const parsedRewards = useMemo(() => parseCampaignRewards(rewards), [rewards]);
  const rewardTypeLabel = useMemo(
    () => getCampaignRewardTypeLabel(parsedRewards),
    [parsedRewards],
  );
  const schoolOptions = useMemo(
    () => getCampaignRewardFilterOptions(performanceRows).schools,
    [performanceRows],
  );
  const classOptions = useMemo(
    () => getCampaignRewardClassOptions(performanceRows, schoolFilter),
    [performanceRows, schoolFilter],
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
  const paginatedRows = paginateCampaignRewardRows(
    sortedRows,
    getSafeCampaignRewardPage(page, pageCount),
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    let active = true;
    const loadRewardsReport = async () => {
      if (!campaignId) {
        setPerformanceRows([]);
        return;
      }

      setLoading(true);
      try {
        const response =
          await ServiceConfig.getI().apiHandler.getCampaignRewardsReport(
            campaignId,
          );
        if (!active) return;
        const nextRows = mapCampaignPerformanceRowsToRewardRows(
          response.rows,
          parsedRewards,
        );
        setPerformanceRows(nextRows);
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
  }, [campaignId, parsedRewards]);

  useEffect(() => {
    const nextClassFilter = getNextClassFilter({
      allClassesLabel,
      classFilter,
      classOptions,
    });

    if (nextClassFilter !== classFilter) {
      setClassFilter(nextClassFilter);
    }
  }, [allClassesLabel, classFilter, classOptions]);

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
    const nextFilters = getNextSchoolAndClassFilters({
      allClassesLabel,
      allSchoolsLabel,
      currentClassFilter: classFilter,
      nextSchoolFilter: value,
      rows: performanceRows,
    });
    setSchoolFilter(nextFilters.schoolFilter);
    setClassFilter(nextFilters.classFilter);
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
    filterOptions: {
      schools: schoolOptions,
      classes: classOptions,
    },
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
