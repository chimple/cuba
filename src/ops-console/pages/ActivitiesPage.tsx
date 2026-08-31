import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { parsePath } from 'history';
import { t } from 'i18next';
import { useHistory, useLocation } from 'react-router';
import { PAGES } from '../../common/constants';
import Breadcrumb from '../components/Breadcrumb';
import DataTableBody, { Column } from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import SchoolNameHeaderComponent from '../components/SchoolDetailsComponents/SchoolNameHeaderComponent';
import {
  useActivitiesPageData,
  type ActivityFilters,
} from '../hooks/useActivitiesPageData';
import './ActivitiesPage.css';

type SchoolRecord = {
  id: string;
  name: string;
};

type ActivitySummaryRow = {
  date: string;
  visitType: string;
  f2f: number;
  calls: number;
  issues: number;
  checkIn: string;
  checkOut: string;
  distance: string;
  activitiesList: unknown[];
  visitDetails: unknown[] | null;
};

const ActivitiesPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const school = (location.state as SchoolRecord | undefined) ?? {
    id: '',
    name: '',
  };
  const {
    activities,
    filterOptions,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleDeleteFilter,
    handleFilterChange,
    handleCloseFilters,
    handleOpenFilters,
    handleSort,
    isFilterOpen,
    loadingData,
    orderBy,
    orderDir,
    page,
    pageCount,
    setPage,
    tempFilters,
  } = useActivitiesPageData(school);

  const columns: Column<ActivitySummaryRow>[] = [
    { key: 'date', label: t('Date'), sortable: true, orderBy: 'date' },
    { key: 'visitType', label: t('Visit Type'), sortable: false },
    { key: 'f2f', label: t('F2F- Discussions'), sortable: false },
    { key: 'calls', label: t('Calls Made'), sortable: false },
    {
      key: 'issues',
      label: t('Tech Issues'),
      sortable: false,
      render: (row) => (
        <Chip
          label={row.issues}
          size="small"
          sx={{
            backgroundColor: '#FFEDD4',
            color: '#CA3500',
            fontWeight: 500,
            padding: '0 6px',
          }}
        />
      ),
    },
    { key: 'checkIn', label: t('Checked-In'), sortable: false },
    { key: 'checkOut', label: t('Checked-Out'), sortable: false },
    { key: 'distance', label: t('Distance'), sortable: false },
  ];

  const handleRowClick = (_id: string | number, row: ActivitySummaryRow) => {
    history.push({
      ...parsePath(
        `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}${PAGES.SCHOOL_ACTIVITIES}`,
      ),
      state: {
        schoolData: school,
        schoolName: school.name,
        date: row.date,
        activities: row.activitiesList,
        visitDetails: row.visitDetails || null,
      },
    });
  };

  return (
    <div className="activities-container" id="act-container">
      <div className="activities-header">
        <SchoolNameHeaderComponent schoolName={'Interactions'} />
      </div>
      <div className="activities-secondary-header" id="act-breadcrumb">
        <Breadcrumb
          crumbs={[
            {
              label: t('Schools'),
              onClick: () =>
                history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`),
            },
            {
              label: school.name,
              onClick: () =>
                history.replace(
                  `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/${school.id}`,
                ),
            },
            { label: t('Interactions') },
          ]}
        />
        <div className="activities-secondary-actions">
          <Button
            variant="outlined"
            onClick={handleOpenFilters}
            startIcon={<FilterListIcon fontSize="small" />}
            className="activities-filter-button"
            aria-label={String(t('Open filters'))}
            sx={{
              textTransform: 'none',
              borderRadius: '999px',
              px: 2,
              py: 0.9,
              minWidth: 'unset',
              borderColor: '#E5E7EB',
              color: '#111827',
              backgroundColor: '#fff',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                borderColor: '#CBD5E1',
                backgroundColor: '#F8FAFC',
              },
              '& .MuiButton-startIcon': {
                color: '#1A71F6',
                marginRight: '6px',
              },
            }}
          >
            {t('Filter')}
          </Button>
        </div>
      </div>

      <SelectedFilters
        filters={filters}
        onDeleteFilter={(key, value) =>
          handleDeleteFilter(key as keyof ActivityFilters, value)
        }
        getFilterLabel={(key, value) =>
          `${key === 'techIssues' ? t('Tech Issues') : t('Visit Type')}: ${value}`
        }
      />

      <FilterSlider
        isOpen={isFilterOpen}
        onClose={handleCloseFilters}
        filters={tempFilters}
        filterOptions={filterOptions}
        onFilterChange={(name: string, value: string[]) =>
          handleFilterChange(name as 'techIssues' | 'visitType', value)
        }
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
        singleSelectKeys={['visitType', 'techIssues']}
        filterConfigs={[
          {
            key: 'visitType',
            label: String(t('Visit Type')),
            placeholder: String(t('Visit Type')),
          },
          {
            key: 'techIssues',
            label: String(t('Tech Issues')),
            placeholder: String(t('Tech Issues')),
          },
        ]}
      />

      <div className="activities-table-container" id="act-table">
        {!loadingData && activities.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography align="center">{t('No activities found.')}</Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={activities}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={loadingData}
            onRowClick={handleRowClick}
          />
        )}
      </div>
      {!loadingData && activities.length > 0 && (
        <div className="activities-footer" id="act-footer">
          <DataTablePagination
            pageCount={pageCount}
            page={page}
            onPageChange={(val) => setPage(val)}
          />
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
