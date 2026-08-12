import React from 'react';
import { Button, IconButton, Tab, Tabs } from '@mui/material';
import { t } from 'i18next';
import DataTableBody from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import SearchAndFilter from '../components/SearchAndFilter';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import { BsFillBellFill } from 'react-icons/bs';
import {
  MigrationTab,
  useMigrateSchoolsPageLogic,
} from './MigrateSchoolsPageLogic';
import { MigrateSchoolsDialogs } from './MigrateSchoolsDialogs';
import './MigrateSchoolsPage.css';
import './MigrateSchoolsPageMobile.css';

const MigrateSchoolsPage: React.FC = () => {
  const {
    activeTab,
    searchTerm,
    filters,
    tempFilters,
    filterOptions,
    isFilterOpen,
    isLoading,
    rows,
    orderBy,
    orderDir,
    selectedSchoolIds,
    isMigrateDialogOpen,
    isSuccessPopupOpen,
    isFailurePopupOpen,
    isMigrating,
    page,
    pageCount,
    columns,
    filterConfigsForSchool,
    isSelectionActionVisible,
    setPage,
    handleSort,
    handleToggleSchoolSelection,
    handleSelectAllVisible,
    handleClearFilters,
    handleOpenFilter,
    handleDeleteFilter,
    handleFilterSliderClose,
    handleTempFilterChange,
    handleApplyFilters,
    handleTabChange,
    handleSearchChange,
    handleOpenMigrateDialog,
    handleCloseMigrateDialog,
    handleCloseSuccessPopup,
    handleCloseFailurePopup,
    handleConfirmMigrate,
  } = useMigrateSchoolsPageLogic();

  return (
    <div id="migrate-schools-page" className="migrate-schools-page">
      <div id="migrate-schools-header" className="migrate-schools-header">
        <div
          id="migrate-schools-title-row"
          className="migrate-schools-title-row"
        >
          <h1 id="migrate-schools-title" className="migrate-schools-title">
            {t('Migrate Schools')}
          </h1>
          <IconButton className="migrate-schools-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>

        <div
          id="migrate-schools-controls-row"
          className="migrate-schools-controls-row"
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => handleTabChange(value as MigrationTab)}
            id="migrate-schools-tabs"
            className="migrate-schools-tabs"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              label={t('Migrate')}
              value="migrate"
              id="migrate-schools-migrate-tab"
              className="migrate-schools-tab"
            />
            <Tab
              label={t('Migrated')}
              value="migrated"
              id="migrate-schools-migrated-tab"
              className="migrate-schools-tab"
            />
          </Tabs>

          <div
            id="migrate-schools-top-right"
            className="migrate-schools-top-right"
          >
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={(event) => handleSearchChange(event.target.value)}
              filters={filters}
              onFilterClick={handleOpenFilter}
              onClearFilters={handleClearFilters}
              isFilter
              filterIconSrc="assets/icons/filterIcon.svg"
            />
          </div>
        </div>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteFilter}
        />

        <FilterSlider
          isOpen={isFilterOpen}
          onClose={handleFilterSliderClose}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={handleTempFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleClearFilters}
          autocompleteStyles={{}}
          filterConfigs={filterConfigsForSchool}
        />
      </div>

      <div
        id="migrate-schools-table-wrap"
        className={`migrate-schools-table-wrap${
          activeTab === 'migrated'
            ? ' migrate-schools-table-wrap-hide-selection'
            : ''
        }`}
      >
        {!isLoading && rows.length > 0 && (
          <DataTableBody
            columns={columns}
            rows={rows}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={isLoading}
            selectableRows
            selectedRowIds={activeTab === 'migrate' ? selectedSchoolIds : []}
            onToggleRowSelection={
              activeTab === 'migrate' ? handleToggleSchoolSelection : undefined
            }
            onToggleSelectAll={
              activeTab === 'migrate' ? handleSelectAllVisible : undefined
            }
            isRowSelectable={() => activeTab === 'migrate'}
            getRowId={(row) => String(row.sch_id || row.id)}
            disableRowNavigation
          />
        )}

        {!isLoading && rows.length === 0 && (
          <div id="migrate-schools-empty" className="migrate-schools-empty">
            {t('No schools found.')}
          </div>
        )}
      </div>

      {!isLoading && rows.length > 0 && (
        <div
          id="migrate-schools-footer"
          className={`migrate-schools-footer${
            isSelectionActionVisible
              ? ' migrate-schools-footer-with-action'
              : ''
          }`}
        >
          <div
            id="migrate-schools-footer-pagination"
            className="migrate-schools-footer-pagination"
          >
            <DataTablePagination
              pageCount={pageCount}
              page={page}
              onPageChange={(value) => setPage(value)}
            />
          </div>

          {isSelectionActionVisible && (
            <div
              id="migrate-schools-footer-action"
              className="migrate-schools-footer-action"
            >
              <span
                id="migrate-schools-selected-count"
                className="migrate-schools-selected-count"
              >
                <span
                  id="migrate-schools-selected-count-number"
                  className="migrate-schools-selected-count-number"
                >
                  ({selectedSchoolIds.length})
                </span>{' '}
                {t('Schools Selected')}
              </span>
              <Button
                variant="contained"
                id="migrate-schools-migrate-button"
                className="migrate-schools-action-button"
                onClick={handleOpenMigrateDialog}
                disabled={isMigrating}
              >
                {t('Migrate')}
              </Button>
            </div>
          )}
        </div>
      )}

      <MigrateSchoolsDialogs
        handleCloseFailurePopup={handleCloseFailurePopup}
        handleCloseMigrateDialog={handleCloseMigrateDialog}
        handleCloseSuccessPopup={handleCloseSuccessPopup}
        handleConfirmMigrate={handleConfirmMigrate}
        isFailurePopupOpen={isFailurePopupOpen}
        isMigrateDialogOpen={isMigrateDialogOpen}
        isMigrating={isMigrating}
        isSuccessPopupOpen={isSuccessPopupOpen}
        selectedCount={selectedSchoolIds.length}
      />
    </div>
  );
};

export default MigrateSchoolsPage;
