import React from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Button as MuiButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import DataTableBody from '../DataTableBody';
import DataTablePagination from '../DataTablePagination';
import FilterSlider from '../FilterSlider';
import SearchAndFilter from '../SearchAndFilter';
import SelectedFilters from '../SelectedFilters';
import './SchoolTeachers.css';
import { SchoolTeachersDialogs } from './SchoolTeachersDialogs';
import type { SchoolTeachersProps } from './SchoolTeachers.types';
import { useSchoolTeachersController } from './useSchoolTeachersController';

const SchoolTeachers: React.FC<SchoolTeachersProps> = (props) => {
  const { contentProps, dialogsProps } = useSchoolTeachersController(props);
  const {
    classFilterOptions,
    columns,
    filterConfigsForTeachers,
    filters,
    handleAddNewTeacher,
    handleApplyFilters,
    handleCancelFilters,
    handleClearFilters,
    handleDeleteAppliedFilter,
    handleFilterIconClick,
    handlePageChange,
    handleSearchChange,
    handleSliderFilterChange,
    handleSort,
    isDataPresent,
    isExternalUser,
    isFilterSliderOpen,
    isFilteringOrSearching,
    isLoading,
    isSmallScreen,
    order,
    orderBy,
    page,
    pageCount,
    searchTerm,
    setIsFilterSliderOpen,
    teachersWithWhatsappStatus,
    tempFilters,
    totalCount,
  } = contentProps;

  return (
    <div className="schoolTeachers-pageContainer">
      <SchoolTeachersDialogs {...dialogsProps} />

      <Box className="schoolTeachers-headerActionsRow">
        <Box className="schoolTeachers-titleArea">
          <Typography variant="h5" className="schoolTeachers-titleHeading">
            {t('Teachers')}
          </Typography>
          <Typography variant="body2" className="schoolTeachers-totalText">
            {t('Total')}: {totalCount} {t('teachers')}
          </Typography>
        </Box>
        <Box className="schoolTeachers-actionsGroup">
          {!isExternalUser && (
            <MuiButton
              variant="outlined"
              onClick={handleAddNewTeacher}
              className="schoolTeachers-newTeacherButton-outlined"
            >
              <AddIcon className="schoolTeachers-newTeacherButton-outlined-icon" />
              {!isSmallScreen && t('New Teacher')}
            </MuiButton>
          )}

          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterClick={handleFilterIconClick}
            onClearFilters={handleClearFilters}
          />
        </Box>
      </Box>

      {Object.values(filters).some((arr) => arr.length > 0) && (
        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteAppliedFilter}
        />
      )}
      <FilterSlider
        isOpen={isFilterSliderOpen}
        onClose={() => setIsFilterSliderOpen(false)}
        filters={tempFilters}
        filterOptions={{ class: classFilterOptions }}
        onFilterChange={handleSliderFilterChange}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilters}
        filterConfigs={filterConfigsForTeachers}
      />

      {isLoading ? (
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
          <div className="schoolTeachers-table-container">
            <DataTableBody
              columns={columns}
              rows={teachersWithWhatsappStatus}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
              onRowClick={() => {}}
              getRowId={(row) =>
                `${row.id}-${row.classId || row.interactPayload?.classWithidname?.id || 'unassigned'}`
              }
            />
          </div>
          {pageCount > 1 && (
            <div className="schoolTeachers-footer">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Box className="schoolTeachers-emptyStateContainer">
          <Typography variant="h6" className="schoolTeachers-emptyStateTitle">
            {t('Teachers')}
          </Typography>
          <Typography className="schoolTeachers-emptyStateMessage">
            {isFilteringOrSearching
              ? t('No teachers found matching your criteria.')
              : t('No teachers data found for the selected school')}
          </Typography>
          {!isFilteringOrSearching && !isExternalUser && (
            <MuiButton
              variant="text"
              onClick={handleAddNewTeacher}
              className="schoolTeachers-emptyStateAddButton"
              startIcon={
                <AddIcon className="schoolTeachers-emptyStateAddButton-icon" />
              }
            >
              {t('Add Teacher')}
            </MuiButton>
          )}
        </Box>
      )}
    </div>
  );
};

export default SchoolTeachers;
