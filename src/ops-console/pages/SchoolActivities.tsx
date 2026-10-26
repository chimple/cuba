import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { t } from 'i18next';
import { useHistory, useLocation } from 'react-router';
import { PAGES } from '../../common/constants';
import Breadcrumb from '../components/Breadcrumb';
import DataTableBody from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import FilterSlider from '../components/FilterSlider';
import SearchAndFilter from '../components/SearchAndFilter';
import SelectedFilters from '../components/SelectedFilters';
import { useSchoolActivities } from '../hooks/useSchoolActivities';
import ActivityDetailsPanel from './ActivityDetailsPanel';
import './SchoolActivities.css';

type SchoolActivitiesLocationState = {
  schoolData?: {
    id: string;
    name?: string;
  };
  schoolName?: string;
  date?: string;
  activities?: unknown[];
  visitDetails?: unknown[] | null;
};

const SchoolActivities: React.FC = () => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const activityData = useLocation<SchoolActivitiesLocationState>().state ?? {};
  const schoolListPath = `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`;
  const activitiesPath = `${schoolListPath}${PAGES.ACTIVITIES_PAGE}`;
  const schoolDetailsPath = activityData.schoolData?.id
    ? `${schoolListPath}${PAGES.SCHOOL_DETAILS}/${activityData.schoolData.id}`
    : activitiesPath;
  const {
    activities,
    columns,
    filterConfigs,
    filterOptions,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleDeleteFilter,
    handleFilterChange,
    handleSearchChange,
    handleSort,
    isFilterOpen,
    loadingData,
    orderBy,
    orderDir,
    page,
    pageCount,
    searchTerm,
    selectedActivity,
    setIsFilterOpen,
    setPage,
    setSelectedActivity,
    tempFilters,
  } = useSchoolActivities(activityData);

  return (
    <div className="school-act-container" id="school-act">
      <Box className="school-act-header">
        <Box className="school-act-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="school-act-title-mobile">
                {t('Schools')}
              </Typography>
              <IconButton className="school-act-icon-button" id="notify-btn">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="school-act-title">
                {t('Schools')}
              </Typography>
              <IconButton className="school-act-icon-button" id="notify-btn">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>

        <Box className="school-act-header-row" id="school-act-breadcrumb">
          {!isMobile && (
            <Breadcrumb
              crumbs={[
                {
                  label: t('Schools'),
                  onClick: () => history.push(schoolListPath),
                },
                {
                  label: activityData.schoolName ?? '',
                  onClick: () => history.replace(schoolDetailsPath),
                },
                {
                  label: t('Interactions'),
                  onClick: () =>
                    history.replace({
                      pathname: activitiesPath,
                      state: {
                        id: activityData.schoolData?.id ?? '',
                        name: activityData.schoolName ?? '',
                      },
                    }),
                },
                { label: activityData.date ?? '' },
              ]}
            />
          )}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterClick={() => setIsFilterOpen(true)}
            onClearFilters={handleCancelFilters}
          />
        </Box>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteFilter}
        />
        <FilterSlider
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          filterConfigs={filterConfigs}
        />
      </Box>

      <div className="school-act-table-container" id="school-act-table">
        {!loadingData && activities.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography>{t('No activities found.')}</Typography>
          </Box>
        ) : (
          <DataTableBody
            loading={loadingData}
            rows={activities}
            columns={columns}
            order={orderDir}
            orderBy={orderBy}
            onSort={handleSort}
            onRowClick={(_id, row) => setSelectedActivity(row)}
          />
        )}
        {selectedActivity && (
          <ActivityDetailsPanel
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}
      </div>

      {activities.length > 0 && (
        <div className="school-act-footer" id="school-act-footer">
          <DataTablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={(value) => setPage(value)}
          />
        </div>
      )}
    </div>
  );
};

export default SchoolActivities;
