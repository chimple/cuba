import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { parsePath } from 'history';
import { t } from 'i18next';
import { useHistory, useLocation } from 'react-router';
import { PAGES } from '../../common/constants';
import Breadcrumb from '../components/Breadcrumb';
import DataTableBody, { Column } from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import SchoolNameHeaderComponent from '../components/SchoolDetailsComponents/SchoolNameHeaderComponent';
import { useActivitiesPageData } from '../hooks/useActivitiesPageData';
import './ActivitiesPage.css';

const ActivitiesPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const school: any = location.state;
  const {
    activities,
    handleSort,
    loadingData,
    orderBy,
    orderDir,
    page,
    pageCount,
    setPage,
  } = useActivitiesPageData(school);

  const columns: Column<Record<string, any>>[] = [
    { key: 'date', label: t('Date'), sortable: true, orderBy: 'date' },
    { key: 'visitType', label: t('Visit Type'), sortable: false },
    { key: 'f2f', label: t('F2F- Discussions'), sortable: false },
    { key: 'calls', label: t('Calls Made'), sortable: false },
    {
      key: 'issues',
      label: t('Tech Issues'),
      sortable: false,
      render: (row: any) => (
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

  const handleRowClick = (_id: string | number, row: any) => {
    history.push({
      ...parsePath(
        `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}${PAGES.SCHOOL_ACTIVITIES}`,
      ),
      state: {
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
      </div>

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
