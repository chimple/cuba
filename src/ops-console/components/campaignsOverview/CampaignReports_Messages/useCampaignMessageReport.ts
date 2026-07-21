import { Toast } from '@capacitor/toast';
import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CampaignMessageReportResponse,
  CampaignMessageReportSortKey,
} from '../../../../services/api/ServiceApi';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import logger from '../../../../utility/logger';
import {
  CAMPAIGN_MESSAGE_PAGE_SIZE,
  EMPTY_CAMPAIGN_MESSAGE_REPORT,
  exportCampaignMessageRows,
  getCampaignMessageReportDateInputValue,
  getCampaignMessageExportFileName,
  getCampaignMessageReportToday,
  isInvalidCampaignMessageDateRange,
} from './CampaignMessageReport.helpers';

export const useCampaignMessageReport = (
  campaignId: string | undefined,
  campaignName: string,
  campaignStartDate: string | undefined,
) => {
  const defaultFromDate =
    getCampaignMessageReportDateInputValue(campaignStartDate);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(getCampaignMessageReportToday);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<CampaignMessageReportSortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [report, setReport] = useState<CampaignMessageReportResponse>(
    EMPTY_CAMPAIGN_MESSAGE_REPORT,
  );
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const requestSequence = useRef(0);
  const invalidDateRange = isInvalidCampaignMessageDateRange(fromDate, toDate);

  useEffect(() => {
    if (!campaignId || invalidDateRange) return;
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError('');
    void ServiceConfig.getI()
      .apiHandler.getCampaignMessageReport(campaignId, {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        pageSize: CAMPAIGN_MESSAGE_PAGE_SIZE,
        sortBy,
        sortOrder,
      })
      .then((response) => {
        if (requestSequence.current === sequence) setReport(response);
      })
      .catch((requestError) => {
        logger.error('Failed to load campaign message report', requestError);
        if (requestSequence.current === sequence)
          setError(String(t('Unable to load message report.')));
      })
      .finally(() => {
        if (requestSequence.current === sequence) setLoading(false);
      });
  }, [
    campaignId,
    fromDate,
    invalidDateRange,
    page,
    retryKey,
    sortBy,
    sortOrder,
    toDate,
  ]);

  const clearFilters = useCallback((): void => {
    setFromDate(defaultFromDate);
    setToDate(getCampaignMessageReportToday());
    setPage(1);
    setSortBy('date');
    setSortOrder('desc');
  }, [defaultFromDate]);
  const handleSort = useCallback(
    (nextKey: CampaignMessageReportSortKey): void => {
      setSortOrder((current) =>
        sortBy === nextKey && current === 'asc' ? 'desc' : 'asc',
      );
      setSortBy(nextKey);
      setPage(1);
    },
    [sortBy],
  );
  const exportReport = useCallback(async (): Promise<void> => {
    if (!campaignId || isExporting || invalidDateRange) return;
    setIsExporting(true);
    try {
      const response =
        await ServiceConfig.getI().apiHandler.getCampaignMessageReport(
          campaignId,
          {
            exportAll: true,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            sortBy,
            sortOrder,
          },
        );
      await exportCampaignMessageRows(
        response.rows,
        getCampaignMessageExportFileName(campaignName, fromDate, toDate),
      );
    } catch (exportError) {
      logger.error('Failed to export campaign message report', exportError);
      await Toast.show({ text: t('Unable to export message report.') });
    } finally {
      setIsExporting(false);
    }
  }, [
    campaignId,
    campaignName,
    fromDate,
    invalidDateRange,
    isExporting,
    sortBy,
    sortOrder,
    toDate,
  ]);
  return {
    clearFilters,
    error,
    exportReport,
    fromDate,
    handleSort,
    invalidDateRange,
    isExporting,
    loading,
    page,
    report,
    retry: () => setRetryKey((value) => value + 1),
    setFromDate: (value: string) => {
      setFromDate(value);
      setPage(1);
    },
    setPage,
    setToDate: (value: string) => {
      setToDate(value);
      setPage(1);
    },
    sortBy,
    sortOrder,
    toDate,
  };
};
