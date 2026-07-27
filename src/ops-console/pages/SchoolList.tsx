import React, { useCallback } from 'react';
import { Box, CircularProgress, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import './SchoolList.css';
import DataTablePagination from '../components/DataTablePagination';
import DataTableBody from '../components/DataTableBody';
import { t } from 'i18next';
import FileUpload from '../components/FileUpload';
import { BsFillBellFill } from 'react-icons/bs';
import { type PercentageFilterKey } from './SchoolList.helpers';
import SchoolListFilterMenus from './SchoolListFilterMenus';
import SchoolListHeaderControls from './SchoolListHeaderControls';
import { useSchoolListPage } from './useSchoolListPage';

const SchoolList: React.FC = () => {
  const page = useSchoolListPage();
  const {
    activePercentageBand,
    columns,
    handleClosePercentageFilter,
    handleCloseSchoolPerformanceFilter,
    handleOpenPercentageFilter,
    handleOpenSchoolPerformanceFilter,
    handleSelectPercentageFilter,
    handleSelectSchoolPerformanceFilter,
    handleSort,
    isLoading,
    orderBy,
    orderDir,
    page: currentPage,
    pageCount,
    percentageFilterAnchorEl,
    percentageFilters,
    renderedSchools,
    schoolPerformanceFilter,
    schoolPerformanceFilterAnchorEl,
    setPage,
    showUploadPage,
  } = page;

  const renderHeaderActions = useCallback(
    (column: (typeof columns)[number]) => {
      if (column.schoolPerformanceFilterKey) {
        return (
          <IconButton
            size="small"
            aria-label={`${column.label} filter`}
            onClick={handleOpenSchoolPerformanceFilter}
            sx={{
              color: schoolPerformanceFilter ? '#1A71F6' : '#6B7280',
              p: 0.25,
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        );
      }

      const filterKey = column.percentageFilterKey as
        | PercentageFilterKey
        | undefined;
      if (!filterKey) return null;

      const selectedBand = percentageFilters[filterKey];
      return (
        <IconButton
          size="small"
          aria-label={`${column.label} percentage filter`}
          onClick={(event) => handleOpenPercentageFilter(event, filterKey)}
          sx={{
            color: selectedBand ? '#1A71F6' : '#6B7280',
            p: 0.25,
          }}
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      );
    },
    [
      handleOpenPercentageFilter,
      handleOpenSchoolPerformanceFilter,
      percentageFilters,
      schoolPerformanceFilter,
    ],
  );

  if (showUploadPage) {
    return (
      <div>
        <div className="school-list-upload-text">{t('Upload File')}</div>
        <div>
          <FileUpload onCancleClick={page.handleCloseUploadPage} />
        </div>
      </div>
    );
  }

  return (
    <div className="school-list-ion-page">
      <div className="school-list-main-container">
        <div className="school-list-page-header">
          <span className="school-list-page-header-title">{t('Schools')}</span>
          <IconButton className="school-list-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>

        <SchoolListHeaderControls {...page} />

        <div
          className={`school-list-table-container ${
            !isLoading && renderedSchools.length === 0
              ? 'school-list-no-schools'
              : ''
          }`}
        >
          {isLoading && (
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

          {!isLoading && renderedSchools.length > 0 && (
            <DataTableBody
              columns={columns}
              rows={renderedSchools}
              orderBy={orderBy}
              order={orderDir}
              onSort={handleSort}
              renderHeaderActions={renderHeaderActions}
              loading={isLoading}
              tableMinWidth={2500}
              tableWidth="max-content"
              headerClampLines={2}
              headerNoEllipsis
              headerAlign="center"
            />
          )}

          {!isLoading && renderedSchools.length === 0 && t('No schools found.')}
        </div>

        <SchoolListFilterMenus
          activePercentageBand={activePercentageBand}
          handleClosePercentageFilter={handleClosePercentageFilter}
          handleCloseSchoolPerformanceFilter={
            handleCloseSchoolPerformanceFilter
          }
          handleSelectPercentageFilter={handleSelectPercentageFilter}
          handleSelectSchoolPerformanceFilter={
            handleSelectSchoolPerformanceFilter
          }
          percentageFilterAnchorEl={percentageFilterAnchorEl}
          schoolPerformanceFilter={schoolPerformanceFilter}
          schoolPerformanceFilterAnchorEl={schoolPerformanceFilterAnchorEl}
        />

        {!isLoading && renderedSchools.length > 0 && (
          <div className="school-list-footer">
            <DataTablePagination
              pageCount={pageCount}
              page={currentPage}
              onPageChange={(val) => setPage(val)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolList;
