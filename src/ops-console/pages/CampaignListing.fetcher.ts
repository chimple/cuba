import { useEffect, useMemo, useState } from 'react';
import {
  CampaignListingParams,
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
  searchTerm,
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
  const [campaigns, setCampaigns] = useState<
    Awaited<ReturnType<ServiceApi['getCampaignListing']>>['data']
  >([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      // Keep the async fetch cancellable so stale responses do not replace newer results.
      setIsLoading(true);
      try {
        const response = await api.getCampaignListing(
          buildCampaignListingRequest({
            page,
            pageSize,
            orderBy,
            orderDir,
            searchTerm,
          }),
        );

        if (!active) return;

        setCampaigns(response.data || []);
        setTotal(response.totalCount || 0);
      } catch {
        if (!active) return;
        setCampaigns([]);
        setTotal(0);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [api, orderBy, orderDir, page, pageSize, searchTerm]);

  return { campaigns, total, isLoading };
};

export const useCampaignListingPageState = (api: ServiceApi) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<CampaignSortColumn>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  const { campaigns, total, isLoading } = useCampaignListingData({
    api,
    page,
    pageSize: CAMPAIGN_LISTING_PAGE_SIZE,
    orderBy: sortBy,
    orderDir: sortOrder,
    searchTerm,
  });

  useEffect(() => {
    // Every new search starts from the first page to avoid empty later-page results.
    setPage(1);
  }, [searchTerm]);

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
    setSearchTerm(event.target.value);
    setPage(1);
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
