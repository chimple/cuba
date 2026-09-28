import { Alert, Box, CircularProgress, IconButton } from '@mui/material';
import { BsFillBellFill } from 'react-icons/bs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'react-router-dom';
import { PAGES } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RootState } from '../../../redux/store';
import DataTableBody from '../../components/DataTableBody';
import DataTablePagination from '../../components/DataTablePagination';
import SearchAndFilter from '../../components/SearchAndFilter';
import { ServiceConfig } from '../../../services/ServiceConfig';
import SchoolListExportButton from '../../components/SchoolListExportButton';
import type { WhatsappIntegrationStatusRow } from '../../../services/api/serviceapi/ServiceApi.whatsapp';
import WhatsappProviderStatusTable from './WhatsappProviderStatusTable';
import WhatsappIntegrationStatusAppliedFilters from './WhatsappIntegrationStatusAppliedFilters';
import WhatsappIntegrationStatusFilterMenu from './WhatsappIntegrationStatusFilterMenu';
import WhatsappIntegrationStatusChip from './WhatsappIntegrationStatusChip';
import { useWhatsappIntegrationStatusExport } from './useWhatsappIntegrationStatusExport';
import { useWhatsappIntegrationStatusFilters } from './useWhatsappIntegrationStatusFilters';
import { useWhatsappProviderStatus } from './useWhatsappProviderStatus';
import WhatsappIntegrationStatusInfo from './WhatsappIntegrationStatusInfo';
import './WhatsappIntegrationStatusPage.css';

const PAGE_SIZE = 20;
const WhatsappIntegrationStatusPage: React.FC = () => {
  const { t } = useTranslation();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const [rows, setRows] = useState<WhatsappIntegrationStatusRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statusFilters = useWhatsappIntegrationStatusFilters(() => setPage(1));
  const hasModuleAccess = (roles ?? []).some(
    (role) =>
      role === RoleType.SUPER_ADMIN ||
      role === RoleType.OPERATIONAL_DIRECTOR ||
      role === RoleType.PROGRAM_MANAGER,
  );
  const { loading: providerLoading, statuses: providerStatuses } =
    useWhatsappProviderStatus(hasModuleAccess);
  useEffect(() => {
    if (!hasModuleAccess) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      setLoading(true);
      setError(null);
      const api = ServiceConfig.getI().apiHandler;
      try {
        const response = await api.getWhatsappIntegrationStatus({
          page,
          page_size: PAGE_SIZE,
          search,
          periskope_status: statusFilters.periskopeStatus ?? undefined,
          maytapi_status: statusFilters.maytapiStatus ?? undefined,
        });
        if (cancelled) return;
        setRows(response.data);
        setPageCount(response.pagination.total_pages);
      } catch (loadError) {
        if (cancelled) return;
        setRows([]);
        setPageCount(0);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('Failed to load WhatsApp integration status.'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [
    hasModuleAccess,
    page,
    search,
    statusFilters.maytapiStatus,
    statusFilters.periskopeStatus,
    t,
  ]);

  const { isExporting, handleExport } = useWhatsappIntegrationStatusExport(
    rows,
    search,
    statusFilters.periskopeStatus,
    statusFilters.maytapiStatus,
  );

  if (!hasModuleAccess) {
    return <Redirect to={`${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}`} />;
  }

  return (
    <div className="whatsapp-integration-status-page">
      <div className="whatsapp-integration-status-main-container">
        <div className="whatsapp-integration-status-page-header">
          <Box className="whatsapp-integration-status-title-group">
            <span className="whatsapp-integration-status-page-title">
              {t('WhatsApp Integration Status')}
            </span>
          </Box>
          <Box className="whatsapp-integration-status-header-actions">
            <WhatsappIntegrationStatusInfo />
            <IconButton className="whatsapp-integration-status-bell-icon">
              <BsFillBellFill />
            </IconButton>
          </Box>
        </div>

        <WhatsappProviderStatusTable
          loading={providerLoading}
          statuses={providerStatuses}
        />

        <Box className="whatsapp-integration-status-header-controls">
          <Box className="whatsapp-integration-status-controls">
            <SearchAndFilter
              searchTerm={search}
              onSearchChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              isFilter={false}
              searchPlaceholder={String(t('Search'))}
              beforeFilter={
                <SchoolListExportButton
                  disabled={loading || isExporting || rows.length === 0}
                  isExporting={isExporting}
                  onClick={() => void handleExport()}
                />
              }
            />
          </Box>
        </Box>

        <WhatsappIntegrationStatusAppliedFilters
          maytapiStatus={statusFilters.maytapiStatus}
          onDeleteFilter={statusFilters.handleDeleteFilter}
          periskopeStatus={statusFilters.periskopeStatus}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <div className="whatsapp-integration-status-table-container">
          {loading && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={240}
              width="100%"
            >
              <CircularProgress size={28} />
            </Box>
          )}

          {!loading && (
            <DataTableBody
              columns={[
                {
                  key: 'school_name',
                  label: t('School Name'),
                  sortable: false,
                  width: '20%',
                },
                {
                  key: 'class_name',
                  label: t('Class'),
                  sortable: false,
                  width: '20%',
                  render: (row) => row.class_name || '--',
                },
                {
                  key: 'group_id',
                  label: t('Group ID'),
                  sortable: false,
                  width: '20%',
                  render: (row) => row.group_id || '--',
                },
                {
                  key: 'periskope_status',
                  label: t('Periskope'),
                  sortable: false,
                  align: 'left',
                  width: '20%',
                  render: (row) => (
                    <WhatsappIntegrationStatusChip
                      status={row.periskope_status}
                    />
                  ),
                },
                {
                  key: 'maytapi_status',
                  label: t('Maytapi'),
                  sortable: false,
                  align: 'left',
                  width: '20%',
                  render: (row) => (
                    <WhatsappIntegrationStatusChip
                      status={row.maytapi_status}
                    />
                  ),
                },
              ]}
              rows={rows}
              orderBy={null}
              order="asc"
              onSort={() => undefined}
              disableRowNavigation
              getRowId={(row) =>
                `${row.school_id}-${row.class_name ?? 'none'}-${
                  row.group_id ?? 'none'
                }`
              }
              tableMinWidth={760}
              tableWidth="100%"
              headerNoEllipsis
              headerAlign="left"
              renderHeaderActions={statusFilters.renderHeaderActions}
            />
          )}

          {!loading && rows.length === 0 && (
            <Box className="whatsapp-integration-status-empty">
              {t('No WhatsApp integration records found.')}
            </Box>
          )}
        </div>

        <WhatsappIntegrationStatusFilterMenu
          anchorEl={statusFilters.anchorEl}
          selectedStatus={
            statusFilters.column === 'periskope_status'
              ? statusFilters.periskopeStatus
              : statusFilters.maytapiStatus
          }
          onClose={statusFilters.handleClose}
          onSelect={statusFilters.handleSelect}
        />

        {!loading && rows.length > 0 && (
          <Box className="whatsapp-integration-status-footer">
            <DataTablePagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </Box>
        )}
      </div>
    </div>
  );
};
export default WhatsappIntegrationStatusPage;
