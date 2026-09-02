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
import FilterSlider from '../../components/FilterSlider';
import SearchAndFilter from '../../components/SearchAndFilter';
import SelectedFilters from '../../components/SelectedFilters';
import { ServiceConfig } from '../../../services/ServiceConfig';
import type { WhatsappIntegrationStatusRow } from '../../../services/api/serviceapi/ServiceApi.whatsapp';
import type { SchoolFilterOption } from '../SchoolList.helpers';
import './WhatsappIntegrationStatusPage.css';

const PAGE_SIZE = 10;
const filterConfigs = [
  {
    key: 'periskope_connected',
    label: 'Periskope Status',
    placeholder: 'Periskope status',
  },
  {
    key: 'maytapi_connected',
    label: 'Maytapi Status',
    placeholder: 'Maytapi status',
  },
];
const filterOptions: Record<string, SchoolFilterOption[]> = {
  periskope_connected: [
    { id: 'connected', name: 'Connected' },
    { id: 'not_connected', name: 'Not Connected' },
  ],
  maytapi_connected: [
    { id: 'connected', name: 'Connected' },
    { id: 'not_connected', name: 'Not Connected' },
  ],
};
const getFilterValue = (filters: Record<string, string[]>, key: string) => {
  const value = filters[key]?.[0];
  if (value === 'connected') return true;
  if (value === 'not_connected') return false;
  return undefined;
};
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
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasModuleAccess = (roles ?? []).some(
    (role) =>
      role === RoleType.SUPER_ADMIN || role === RoleType.OPERATIONAL_DIRECTOR,
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
            periskope_connected: getFilterValue(filters, 'periskope_connected'),
            maytapi_connected: getFilterValue(filters, 'maytapi_connected'),
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
  }, [filters, hasModuleAccess, page, search, t]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setTempFilters({});
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleDeleteFilter = (key: string, value: string) => {
    const nextFilters = {
      ...filters,
      [key]: (filters[key] ?? []).filter((item) => item !== value),
    };
    setFilters(nextFilters);
    setTempFilters(nextFilters);
    setPage(1);
  };

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
              filters={filters}
              onFilterClick={() => {
                setTempFilters(filters);
                setIsFilterOpen(true);
              }}
              onClearFilters={handleClearFilters}
              searchPlaceholder={String(t('Search'))}
            />
          </Box>
        </Box>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteFilter}
          getFilterLabel={(key, value) => {
            const label =
              key === 'periskope_connected' ? 'Periskope' : 'Maytapi';
            return `${t(label)}: ${t(value === 'connected' ? 'Connected' : 'Not Connected')}`;
          }}
        />

        <FilterSlider
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={(key, value) =>
            setTempFilters((previous) => ({ ...previous, [key]: value }))
          }
          onApply={handleApplyFilters}
          onCancel={handleClearFilters}
          filterConfigs={filterConfigs}
          singleSelectKeys={['periskope_connected', 'maytapi_connected']}
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
