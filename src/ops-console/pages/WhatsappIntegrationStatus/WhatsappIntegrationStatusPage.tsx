import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
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
import type { WhatsappIntegrationStatusRow } from '../../../services/api/serviceapi/ServiceApi.whatsapp';
import './WhatsappIntegrationStatusPage.css';

const PAGE_SIZE = 10;
const StatusBadge: React.FC<{ connected: boolean }> = ({ connected }) => (
  <span
    className={`whatsapp-integration-status-badge${
      connected ? ' is-connected' : ' is-not-connected'
    }`}
  >
    {connected ? 'Yes' : 'No'}
  </span>
);
const WhatsappIntegrationStatusPage: React.FC = () => {
  const { t } = useTranslation();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const [rows, setRows] = useState<WhatsappIntegrationStatusRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasModuleAccess = (roles ?? []).some(
    (role) =>
      role === RoleType.SUPER_ADMIN ||
      role === RoleType.OPERATIONAL_DIRECTOR ||
      role === RoleType.PROGRAM_MANAGER,
  );
  useEffect(() => {
    if (!hasModuleAccess) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response =
          await ServiceConfig.getI().apiHandler.getWhatsappIntegrationStatus({
            page,
            page_size: PAGE_SIZE,
            search,
          });
        if (cancelled) return;
        setRows(response.data);
        setPageCount(response.pagination.total_pages);
        setTotal(response.pagination.total);
      } catch (loadError) {
        if (cancelled) return;
        setRows([]);
        setPageCount(0);
        setTotal(0);
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
  }, [hasModuleAccess, page, search, t]);

  if (!hasModuleAccess) {
    return <Redirect to={`${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}`} />;
  }

  return (
    <div className="whatsapp-integration-status-page">
      <div className="whatsapp-integration-status-main-container">
        <div className="whatsapp-integration-status-page-header">
          <span className="whatsapp-integration-status-page-title">
            {t('WhatsApp Integration Status')}
          </span>
          <IconButton className="whatsapp-integration-status-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>

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
            />
          </Box>
        </Box>

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

          {!loading && rows.length > 0 && (
            <DataTableBody
              columns={[
                {
                  key: 'school_name',
                  label: t('School Name'),
                  sortable: false,
                  width: '35%',
                },
                {
                  key: 'group_id',
                  label: t('Group ID'),
                  sortable: false,
                  width: '35%',
                  render: (row) => row.group_id || t('Not linked'),
                },
                {
                  key: 'periskope_connected',
                  label: t('Periskope'),
                  sortable: false,
                  align: 'center',
                  width: '15%',
                  render: (row) => (
                    <StatusBadge connected={row.periskope_connected} />
                  ),
                },
                {
                  key: 'maytapi_connected',
                  label: t('Maytapi'),
                  sortable: false,
                  align: 'center',
                  width: '15%',
                  render: (row) => (
                    <StatusBadge connected={row.maytapi_connected} />
                  ),
                },
              ]}
              rows={rows}
              orderBy={null}
              order="asc"
              onSort={() => undefined}
              disableRowNavigation
              getRowId={(row) => `${row.school_id}-${row.group_id ?? 'none'}`}
              tableMinWidth={760}
              tableWidth="100%"
              headerNoEllipsis
              headerAlign="left"
            />
          )}

          {!loading && rows.length === 0 && (
            <Box className="whatsapp-integration-status-empty">
              {t('No WhatsApp integration records found.')}
            </Box>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <Box className="whatsapp-integration-status-footer">
            <Typography variant="body2">
              {t('{{count}} records', { count: total })}
            </Typography>
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
