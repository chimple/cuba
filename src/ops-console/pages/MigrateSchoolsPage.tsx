import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { t } from "i18next";
import DataTableBody from "../components/DataTableBody";
import DataTablePagination from "../components/DataTablePagination";
import SearchAndFilter from "../components/SearchAndFilter";
import FilterSlider from "../components/FilterSlider";
import SelectedFilters from "../components/SelectedFilters";
import CommonPopup from "../components/CommonPopup";
import { BsFillBellFill } from "react-icons/bs";
import {
  MigrationTab,
  useMigrateSchoolsPageLogic,
} from "./MigrateSchoolsPageLogic";
import "./MigrateSchoolsPage.css";
import "./MigrateSchoolsPageMobile.css";

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
            {t("Migrate Schools")}
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
              label={t("Migrate")}
              value="migrate"
              id="migrate-schools-migrate-tab"
              className="migrate-schools-tab"
            />
            <Tab
              label={t("Migrated")}
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
          activeTab === "migrated"
            ? " migrate-schools-table-wrap-hide-selection"
            : ""
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
            selectedRowIds={activeTab === "migrate" ? selectedSchoolIds : []}
            onToggleRowSelection={
              activeTab === "migrate" ? handleToggleSchoolSelection : undefined
            }
            onToggleSelectAll={
              activeTab === "migrate" ? handleSelectAllVisible : undefined
            }
            isRowSelectable={() => activeTab === "migrate"}
            getRowId={(row) => String(row.sch_id || row.id)}
            disableRowNavigation
          />
        )}

        {!isLoading && rows.length === 0 && (
          <div id="migrate-schools-empty" className="migrate-schools-empty">
            {t("No schools found.")}
          </div>
        )}
      </div>

      {!isLoading && rows.length > 0 && (
        <div
          id="migrate-schools-footer"
          className={`migrate-schools-footer${
            isSelectionActionVisible
              ? " migrate-schools-footer-with-action"
              : ""
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
                </span>{" "}
                {t("Schools Selected")}
              </span>
              <Button
                variant="contained"
                id="migrate-schools-migrate-button"
                className="migrate-schools-action-button"
                onClick={handleOpenMigrateDialog}
                disabled={isMigrating}
              >
                {t("Migrate")}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={isMigrateDialogOpen}
        onClose={handleCloseMigrateDialog}
        id="migrate-schools-confirm-dialog"
        className="migrate-schools-confirm-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogContent
          id="migrate-schools-confirm-content"
          className="migrate-schools-confirm-content"
        >
          <Typography
            id="migrate-schools-confirm-text"
            className="migrate-schools-confirm-text"
          >
            {t(
              "Are you sure you want to migrate the selected {{count}} schools to the next academic year?",
              { count: selectedSchoolIds.length },
            )}
          </Typography>

          <div
            id="migrate-schools-confirm-warning"
            className="migrate-schools-confirm-warning"
          >
            {t("This cannot be reversed. Please be certain.")}
          </div>

          <div
            id="migrate-schools-confirm-actions"
            className="migrate-schools-confirm-actions"
          >
            <Button
              variant="text"
              id="migrate-schools-cancel-button"
              className="migrate-schools-confirm-cancel"
              onClick={handleCloseMigrateDialog}
              disabled={isMigrating}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="contained"
              id="migrate-schools-confirm-button"
              className="migrate-schools-confirm-migrate"
              onClick={handleConfirmMigrate}
              disabled={isMigrating}
              startIcon={
                isMigrating ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
            >
              {isMigrating ? t("Migrating...") : t("Migrate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CommonPopup
        open={isSuccessPopupOpen}
        onClose={handleCloseSuccessPopup}
        icon={
          <img
            src="assets/icons/migratesuccess.svg"
            alt={String(t("Migration success"))}
            id="migrate-schools-success-icon"
            className="migrate-schools-success-icon"
          />
        }
        title={t("Successfully Migrated")}
        subtitle={t(
          "Selected {{count}} schools have migrated to the next academic year.",
          { count: selectedSchoolIds.length },
        )}
      />

      <CommonPopup
        open={isFailurePopupOpen}
        onClose={handleCloseFailurePopup}
        icon={
          <img
            src="assets/icons/migratefailure.svg"
            alt={String(t("Something went wrong"))}
            id="migrate-schools-failure-icon"
            className="migrate-schools-failure-icon"
          />
        }
        title={t("Something went wrong")}
        subtitle={t("We couldn't complete the migration. Please try again later")}
      />
    </div>
  );
};

export default MigrateSchoolsPage;

