import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import {
  CampaignListingItem,
  CampaignListingParams,
  CampaignDashboardMetric,
  ServiceApi,
} from '../../services/api/ServiceApi';
import { CampaignListingStatus } from '../../common/constants';
import {
  CAMPAIGN_LISTING_PAGE_SIZE,
  CampaignSortColumn,
  getCampaignListingPageCount,
  getCampaignWithStatusOverrides,
  getSelectedCampaignItem,
} from '../../services/api/campaignListingHelpers';
import logger from '../../utility/logger';

type CampaignListingApiRequest = {
  page: number;
  pageSize: number;
  orderBy: NonNullable<CampaignListingParams['orderBy']>;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
};

const normalizeCampaignSearchTerm = (value: string) => value.trim();

const ORDER_BY_MAP: Record<
  string,
  NonNullable<CampaignListingParams['orderBy']>
> = {
  // UI column ids do not exactly match API sort keys, so we normalize them here.
  campaignName: 'name',
  manager: 'manager',
  programName: 'programName',
  avgWeeklyActiveUsers: 'avgWeeklyActiveUsers',
  avgWeeklyEngagementTime: 'avgWeeklyEngagementTimeMinutes',
  startDate: 'startDate',
  endDate: 'endDate',
};

export const useDebouncedValue = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};

export const buildCampaignListingRequest = ({
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
}: {
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
}): CampaignListingApiRequest => ({
  page,
  pageSize,
  orderBy: ORDER_BY_MAP[orderBy] ?? orderBy,
  orderDir,
  searchTerm: normalizeCampaignSearchTerm(searchTerm),
});

export const useCampaignListingData = ({
  api,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
}: {
  api: ServiceApi;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
}) => {
  const shouldDeferMetrics =
    orderBy !== 'avgWeeklyActiveUsers' &&
    orderBy !== 'avgWeeklyEngagementTimeMinutes';
  const [campaigns, setCampaigns] = useState<
    Awaited<ReturnType<ServiceApi['getCampaignListing']>>['data']
  >([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMetricsRefreshing, setIsMetricsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const metricsRequestIdRef = useRef(0);
  const lastRequestKeyRef = useRef<string | null>(null);
  const lastMetricsRequestKeyRef = useRef<string | null>(null);
  const metricsCacheRef = useRef<Map<string, CampaignDashboardMetric>>(
    new Map(),
  );

  const mergeMetricsIntoCampaigns = (
    currentCampaigns: CampaignListingItem[],
    metricsMap: Map<string, CampaignDashboardMetric>,
  ) =>
    currentCampaigns.map((campaign) => {
      const metric = metricsMap.get(campaign.campaignId) ?? null;
      if (metric == null) {
        return campaign;
      }

      return {
        ...campaign,
        dashboardMetrics: metric,
        avgWeeklyActiveUsers: metric.active_students ?? null,
        avgWeeklyEngagementTimeMinutes:
          metric.average_weekly_engagement_time ?? null,
      };
    });

  useEffect(() => {
    const request = buildCampaignListingRequest({
      page,
      pageSize,
      orderBy,
      orderDir,
      searchTerm,
    });
    const listingRequest = {
      ...request,
      includeMetrics: !shouldDeferMetrics,
    };
    const requestKey = JSON.stringify(listingRequest);

    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const hasExistingRows = campaigns.length > 0;

    const fetchData = async () => {
      // Keep previous rows rendered while the next search is loading.
      setIsLoading(!hasExistingRows);
      setIsRefreshing(hasExistingRows);
      try {
        const response = await api.getCampaignListing(listingRequest);

        if (requestId !== requestIdRef.current) return;

        lastMetricsRequestKeyRef.current = null;
        setCampaigns(
          mergeMetricsIntoCampaigns(
            response.data || [],
            metricsCacheRef.current,
          ),
        );
        setTotal(response.totalCount || 0);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setCampaigns([]);
        setTotal(0);
      } finally {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
  }, [
    api,
    campaigns.length,
    orderBy,
    orderDir,
    page,
    pageSize,
    searchTerm,
    shouldDeferMetrics,
  ]);

  useEffect(() => {
    if (!shouldDeferMetrics || campaigns.length === 0) {
      setIsMetricsRefreshing(false);
      return;
    }

    const pendingCampaignIds = campaigns
      .filter((campaign) => !metricsCacheRef.current.has(campaign.campaignId))
      .map((campaign) => campaign.campaignId);
    const metricsRequestKey = pendingCampaignIds.join(',');

    if (pendingCampaignIds.length === 0) {
      lastMetricsRequestKeyRef.current = null;
      setIsMetricsRefreshing(false);
      return;
    }

    if (lastMetricsRequestKeyRef.current === metricsRequestKey) {
      return;
    }

    const metricsRequestId = metricsRequestIdRef.current + 1;
    metricsRequestIdRef.current = metricsRequestId;
    lastMetricsRequestKeyRef.current = metricsRequestKey;
    setIsMetricsRefreshing(true);

    const loadMetrics = async () => {
      const metricsMap =
        await api.getCampaignListingMetrics(pendingCampaignIds);
      if (metricsRequestId !== metricsRequestIdRef.current) return;

      metricsMap.forEach((metric, campaignId) => {
        metricsCacheRef.current.set(campaignId, metric);
      });
      setCampaigns((currentCampaigns) =>
        mergeMetricsIntoCampaigns(currentCampaigns, metricsCacheRef.current),
      );
      setIsMetricsRefreshing(false);
    };

    loadMetrics();
  }, [api, campaigns, shouldDeferMetrics]);

  return { campaigns, total, isLoading, isRefreshing, isMetricsRefreshing };
};

export const useCampaignListingPageState = (api: ServiceApi) => {
  const history = useHistory();
  const location = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const [searchTerm, setSearchTerm] = useState(() =>
    normalizeCampaignSearchTerm(queryParams.get('search') || ''),
  );
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const isSearchPending = searchTerm !== debouncedSearchTerm;
  const [page, setPage] = useState(() => {
    const pageParam = Number.parseInt(queryParams.get('page') || '', 10);
    return Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  });
  const [sortBy, setSortBy] = useState<CampaignSortColumn>(() => {
    const sortByParam = queryParams.get('sortBy');
    const supportedSortColumns: CampaignSortColumn[] = [
      'campaignName',
      'manager',
      'programName',
      'avgWeeklyActiveUsers',
      'avgWeeklyEngagementTime',
      'startDate',
      'endDate',
    ];

    return supportedSortColumns.includes(sortByParam as CampaignSortColumn)
      ? (sortByParam as CampaignSortColumn)
      : 'startDate';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const sortOrderParam = queryParams.get('sortOrder');
    return sortOrderParam === 'desc' ? 'desc' : 'asc';
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [cancelDialogCampaignId, setCancelDialogCampaignId] = useState<
    string | null
  >(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonTouched, setCancelReasonTouched] = useState(false);
  const [isCancellingCampaign, setIsCancellingCampaign] = useState(false);
  const [campaignStatusOverrides, setCampaignStatusOverrides] = useState<
    Record<string, CampaignListingStatus>
  >({});
  const isFirstSearchRenderRef = useRef(true);

  const { campaigns, total, isLoading, isRefreshing, isMetricsRefreshing } =
    useCampaignListingData({
      api,
      page,
      pageSize: CAMPAIGN_LISTING_PAGE_SIZE,
      orderBy: sortBy,
      orderDir: sortOrder,
      // Debounce keystrokes so the listing does not hit Supabase on every character typed.
      searchTerm: debouncedSearchTerm,
    });

  useEffect(() => {
    if (isFirstSearchRenderRef.current) {
      isFirstSearchRenderRef.current = false;
      return;
    }

    // Every new search starts from the first page to avoid empty later-page results.
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set('search', searchTerm);
    }

    if (page !== 1) {
      params.set('page', String(page));
    }

    if (sortBy !== 'startDate') {
      params.set('sortBy', sortBy);
    }

    if (sortOrder !== 'asc') {
      params.set('sortOrder', sortOrder);
    }

    history.replace({ search: params.toString() });
  }, [history, page, searchTerm, sortBy, sortOrder]);

  const campaignsWithStatusOverrides = useMemo(
    // Reflect local cancel actions immediately without waiting for a full refetch.
    () =>
      getCampaignWithStatusOverrides({ campaigns, campaignStatusOverrides }),
    [campaignStatusOverrides, campaigns],
  );

  const selectedCampaign = useMemo(
    // Resolve the current campaign once for both the action menu and cancel dialog.
    () =>
      getSelectedCampaignItem({
        campaigns: campaignsWithStatusOverrides,
        selectedCampaignId,
        cancelDialogCampaignId,
      }),
    [campaignsWithStatusOverrides, cancelDialogCampaignId, selectedCampaignId],
  );

  const handleSort = (key: string, canSort: boolean) => {
    if (!canSort) return;
    const column = key as CampaignSortColumn;
    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextSearchTerm = normalizeCampaignSearchTerm(event.target.value);
    setSearchTerm((currentSearchTerm) =>
      currentSearchTerm === nextSearchTerm ? currentSearchTerm : nextSearchTerm,
    );
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    campaignId: string,
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedCampaignId(campaignId);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedCampaignId(null);
  };

  const handleOpenCancelDialog = () => {
    setCancelDialogCampaignId(selectedCampaignId);
    setCancelReason('');
    setCancelReasonTouched(false);
    handleCloseMenu();
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogCampaignId(null);
    setCancelReason('');
    setCancelReasonTouched(false);
  };

  const handleConfirmCancel = async () => {
    setCancelReasonTouched(true);
    if (!cancelReason.trim() || !cancelDialogCampaignId) return;

    // Persist the cancel action, then locally flip the listing pill to Cancelled.
    setIsCancellingCampaign(true);
    try {
      await api.cancelCampaign(cancelDialogCampaignId, cancelReason.trim());
      setCampaignStatusOverrides((currentOverrides) => ({
        ...currentOverrides,
        [cancelDialogCampaignId]: 'Cancelled',
      }));
      handleCloseCancelDialog();
    } catch (error) {
      logger.error('Failed to cancel campaign:', error);
    } finally {
      setIsCancellingCampaign(false);
    }
  };

  return {
    campaigns: campaignsWithStatusOverrides,
    isLoading,
    isRefreshing,
    isMetricsRefreshing,
    isSearchPending,
    page,
    pageCount: getCampaignListingPageCount(total, CAMPAIGN_LISTING_PAGE_SIZE),
    sortBy,
    sortOrder,
    searchTerm,
    menuAnchorEl,
    cancelDialogCampaignId,
    cancelReason,
    cancelReasonTouched,
    isCancellingCampaign,
    selectedCampaign,
    setPage,
    setCancelReason,
    setCancelReasonTouched,
    handleSort,
    handleSearchChange,
    handleOpenMenu,
    handleCloseMenu,
    handleOpenCancelDialog,
    handleCloseCancelDialog,
    handleConfirmCancel,
  };
};
