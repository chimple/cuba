import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Add, WarningAmberOutlined } from '@mui/icons-material';
import { BsFillBellFill } from 'react-icons/bs';
import { useHistory, useLocation } from 'react-router';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  buildCampaignTableRows,
  getCampaignListingColumns,
  hasCampaignWriteAccess,
  mapCampaignListingItemToOverviewData,
} from '../../services/api/campaignListingHelpers';
import DataTableBody from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import SearchAndFilter from '../components/SearchAndFilter';
import { useCampaignListingPageState } from './CampaignListing.fetcher';
import './CampaignListingPage.css';

const CampaignListingPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const canCreateCampaign = hasCampaignWriteAccess(roles || []);
  const canManageCampaignActions = canCreateCampaign;
  const isPortraitMobile = useMediaQuery(
    '(max-width: 600px) and (orientation: portrait)',
  );
  const {
    campaigns,
    isLoading,
    page,
    pageCount,
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
  } = useCampaignListingPageState(api);

  const columns = useMemo(() => getCampaignListingColumns(t), []);
  const rows = useMemo(
    () =>
      buildCampaignTableRows({
        campaigns,
        canManageCampaignActions,
        onOpenMenu: handleOpenMenu,
      }),
    [campaigns, canManageCampaignActions, handleOpenMenu],
  );

  const handleClickNewCampaign = () =>
    history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS_NEW}`);
  const handleOpenCampaignOverview = (campaignId: string | number) => {
    const selectedCampaignData = campaigns.find(
      (campaign) => campaign.campaignId === String(campaignId),
    );

    history.push({
      pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}/${String(
        campaignId,
      )}`,
      state: selectedCampaignData
        ? {
            returnTo: {
              pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}`,
              search: location.search,
            },
            campaignOverviewData:
              mapCampaignListingItemToOverviewData(selectedCampaignData),
          }
        : undefined,
    });
  };

  return (
    <Box className="campaign-listing-page">
      <Box className="campaign-listing-header">
        <Typography className="campaign-listing-header-title">
          {t('Campaigns')}
        </Typography>
        <IconButton className="campaign-listing-notification-button">
          <BsFillBellFill className="campaign-listing-notification-icon" />
        </IconButton>
      </Box>

      <Box className="campaign-listing-toolbar">
        <Box className="campaign-listing-toolbar-spacer" />
        <Box className="campaign-listing-toolbar-actions">
          {canCreateCampaign ? (
            <Button
              className="campaign-listing-new-button"
              startIcon={<Add />}
              onClick={handleClickNewCampaign}
              aria-label={String(t('New Campaign'))}
            >
              {isPortraitMobile ? null : t('New Campaign')}
            </Button>
          ) : null}
          <Box className="campaign-listing-search-shell">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              isFilter={false}
              variantType="outlined"
              searchPlaceholder={String(t('Search Campaigns'))}
            />
          </Box>
        </Box>
      </Box>

      <Box className="campaign-listing-table-shell">
        {rows.length === 0 && !isLoading ? (
          <Box className="campaign-listing-empty-state">
            <Typography className="campaign-listing-empty-state-title">
              {t('No campaigns found')}
            </Typography>
            <Typography className="campaign-listing-empty-state-subtitle">
              {t('Try a different search term or create a new campaign.')}
            </Typography>
          </Box>
        ) : (
          <Box className="campaign-listing-table-container">
            <DataTableBody
              columns={columns}
              rows={rows}
              orderBy={sortBy}
              order={sortOrder}
              onRowClick={handleOpenCampaignOverview}
              onSort={(key) =>
                handleSort(
                  key,
                  columns.some(
                    (column) => column.key === key && column.sortable,
                  ),
                )
              }
              loading={isLoading && rows.length === 0}
              tableMinWidth={1500}
              headerClampLines={3}
              headerNoEllipsis
            />
          </Box>
        )}
      </Box>

      <Box className="campaign-listing-pagination">
        <DataTablePagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        classes={{ paper: 'campaign-listing-actions-menu' }}
      >
        <MenuItem onClick={handleOpenCancelDialog}>
          {t('Cancel Campaign')}
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(cancelDialogCampaignId)}
        onClose={handleCloseCancelDialog}
        fullWidth
        maxWidth="sm"
        classes={{ paper: 'campaign-listing-cancel-dialog' }}
      >
        <DialogContent className="campaign-listing-cancel-dialog-content">
          <Box className="campaign-listing-cancel-banner">
            <WarningAmberOutlined className="campaign-listing-cancel-banner-icon" />
            <Box className="campaign-listing-cancel-banner-copy">
              <Typography className="campaign-listing-cancel-banner-title">
                {t('Cancel ({{name}}) Campaign', {
                  name: selectedCampaign?.campaign.name ?? '',
                })}
              </Typography>
              <Typography className="campaign-listing-cancel-banner-subtitle">
                {t('Please provide a reason for cancelling this campaign')}
              </Typography>
            </Box>
          </Box>
          <Box className="campaign-listing-cancel-field-block">
            <Typography className="campaign-listing-cancel-field-label">
              {t('Reason for Cancellation')}
            </Typography>
          </Box>
          <TextField
            placeholder={String(
              t('Write the reason for cancelling this campaign...'),
            )}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            onBlur={() => setCancelReasonTouched(true)}
            multiline
            minRows={4}
            fullWidth
            variant="outlined"
            error={cancelReasonTouched && !cancelReason.trim()}
            helperText={
              cancelReasonTouched && !cancelReason.trim()
                ? String(t('Reason for cancellation is required.'))
                : ' '
            }
            className="campaign-listing-cancel-textarea"
          />
        </DialogContent>
        <DialogActions className="campaign-listing-cancel-dialog-actions">
          <Button
            onClick={handleCloseCancelDialog}
            className="campaign-listing-cancel-secondary-button"
            disabled={isCancellingCampaign}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirmCancel}
            className="campaign-listing-cancel-primary-button"
            variant="contained"
            disabled={!cancelReason.trim() || isCancellingCampaign}
          >
            {isCancellingCampaign ? t('Cancelling...') : t('Cancel Campaign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignListingPage;
