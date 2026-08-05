import React from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import { PerformanceLevel } from '../../../common/constants';
import DataTableBody from '../DataTableBody';
import DataTablePagination from '../DataTablePagination';
import FilterSlider from '../FilterSlider';
import SearchAndFilter from '../SearchAndFilter';
import SelectedFilters from '../SelectedFilters';
import './SchoolStudents.css';
import { SchoolStudentsDialogs } from './SchoolStudentsDialogs';
import SchoolStudentsExportButton from './SchoolStudentsExportButton';
import {
  SchoolStudentsProps,
  useSchoolStudentsController,
} from './useSchoolStudentsController';

const getPerformanceFilterClass = (
  filter: PerformanceLevel,
  isActive: boolean,
) => {
  if (!isActive) return 'performance-filter-pill';
  switch (filter) {
    case PerformanceLevel.ALL:
      return 'performance-filter-pill-active-all';
    case PerformanceLevel.DOING_GOOD:
      return 'performance-filter-pill-active-doing-good';
    case PerformanceLevel.NEED_HELP:
      return 'performance-filter-pill-active-need-help';
    case PerformanceLevel.STILL_LEARNING:
      return 'performance-filter-pill-active-still-learning';
    case PerformanceLevel.NOT_TRACKED:
      return 'performance-filter-pill-active-not-tracked';
    default:
      return 'performance-filter-pill';
  }
};

const SchoolStudents: React.FC<SchoolStudentsProps> = (props) => {
  const { contentProps, dialogsProps } = useSchoolStudentsController(props);
  const {
    classFilterOptions,
    columns,
    custoomTitle,
    filterConfigsForSchool,
    filters,
    handleAddNewStudent,
    handleApplyFilters,
    handleCancelFilters,
    handleClearFilters,
    handleDeleteAppliedFilter,
    handleFilterIconClick,
    handleExportStudents,
    handlePageChange,
    handlePerformanceFilterChange,
    handleSearchChange,
    handleSliderFilterChange,
    handleSort,
    hideFilterUI,
    isDataPresent,
    isExternalUser,
    isExporting,
    isFilterSliderOpen,
    isFilteringOrSearching,
    isLoading,
    isPerformanceLoading,
    isSmallScreen,
    issFilter,
    issTotal,
    optionalGrade,
    optionalSection,
    order,
    orderBy,
    page,
    pageCount,
    performanceFilter,
    performanceFilters,
    searchTerm,
    setIsFilterSliderOpen,
    studentsForCurrentPage,
    tempFilters,
    totalCount,
  } = contentProps;

  return (
    <div className="schoolStudents-pageContainer">
      <SchoolStudentsDialogs {...dialogsProps} />
      <Box className="schoolStudents-headerActionsRow">
        <Box className="schoolStudents-titleArea">
          <Typography variant="h5" className="schoolStudents-titleHeading">
            {t(custoomTitle)}
          </Typography>
          {issTotal && (
            <Typography variant="body2" className="schoolStudents-totalText">
              {t('Total')}: {totalCount} {t('students')}
            </Typography>
          )}
        </Box>

        <Box className="schoolStudents-actionsGroup">
          {!isExternalUser && (
            <MuiButton
              variant="outlined"
              onClick={handleAddNewStudent}
              className="schoolStudents-newStudentButton-outlined"
            >
              <AddIcon className="schoolStudents-newStudentButton-outlined-icon" />
              {!isSmallScreen && t('New Student')}
            </MuiButton>
          )}
          {!isExternalUser && (
            <SchoolStudentsExportButton
              isExporting={isExporting}
              onClick={handleExportStudents}
            />
          )}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterClick={handleFilterIconClick}
            onClearFilters={handleClearFilters}
            isFilter={issFilter}
          />
        </Box>
      </Box>

      {!hideFilterUI && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {performanceFilters.map((filter) => {
            const isActive = performanceFilter === filter.key;
            return (
              <Chip
                key={filter.key}
                label={filter.label}
                onClick={() => handlePerformanceFilterChange(filter.key)}
                className={getPerformanceFilterClass(filter.key, isActive)}
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  height: '26px',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </Box>
      )}

      {!hideFilterUI &&
        Object.values(filters).some((arr) => arr.length > 0) && (
          <SelectedFilters
            filters={filters}
            onDeleteFilter={handleDeleteAppliedFilter}
          />
        )}

      {!hideFilterUI && (
        <FilterSlider
          isOpen={isFilterSliderOpen}
          onClose={() => setIsFilterSliderOpen(false)}
          filters={tempFilters}
          filterOptions={{ class: classFilterOptions }}
          onFilterChange={handleSliderFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          filterConfigs={filterConfigsForSchool}
        />
      )}

      {isLoading || isPerformanceLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      ) : isDataPresent ? (
        <>
          <div className="schoolStudents-table-container">
            <DataTableBody
              columns={columns}
              rows={studentsForCurrentPage}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
              onRowClick={() => {}}
            />
          </div>
          {pageCount > 1 && (
            <div className="schoolStudents-footer">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Box className="schoolStudents-emptyStateContainer">
          <Typography variant="h6" className="schoolStudents-emptyStateTitle">
            {t(custoomTitle)}
          </Typography>
          <Typography className="schoolStudents-emptyStateMessage">
            {performanceFilter !== PerformanceLevel.ALL
              ? t('No student data found for the selected filter')
              : isFilteringOrSearching
                ? t('No students found matching your criteria.')
                : !issTotal &&
                    optionalGrade != null &&
                    String(optionalSection ?? '').trim() !== ''
                  ? t('No students found for your class.')
                  : t('No students data found for the selected school')}
          </Typography>
          {!isFilteringOrSearching &&
            performanceFilter === PerformanceLevel.ALL &&
            !isExternalUser && (
              <MuiButton
                variant="text"
                onClick={handleAddNewStudent}
                className="schoolStudents-emptyStateAddButton"
                startIcon={
                  <AddIcon className="schoolStudents-emptyStateAddButton-icon" />
                }
              >
                {t('Add Student')}
              </MuiButton>
            )}
        </Box>
      )}
    </div>
  );
};

export default SchoolStudents;
