import React from 'react';
import { Button, Tab, Tabs } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { t } from 'i18next';
import { PROGRAM_TAB } from '../../common/constants';
import type { Column } from '../components/DataTableBody';
import SearchAndFilter from '../components/SearchAndFilter';
import SchoolListDateRangeDropdown from '../components/SchoolListDateRangeDropdown';
import SchoolListExportButton from '../components/SchoolListExportButton';
import type { SchoolListRow } from './SchoolList.fetcher';
import {
  type DateRangeValue,
  type Filters,
  type PercentageFilters,
  type SchoolFilterOptions,
  type SchoolPerformanceFilterValue,
} from './SchoolList.helpers';
import SchoolListAppliedFilters from './SchoolListAppliedFilters';
import SchoolListHeaderActions, {
  type OfflineCacheSelectionAction,
} from './SchoolListHeaderActions';

type SchoolListHeaderControlsProps = {
  actionsAnchorEl: HTMLElement | null;
  columns: Column<SchoolListRow>[];
  filterOptions: SchoolFilterOptions;
  filters: Filters;
  handleCancelFilters: () => void;
  handleCloseActionsMenu: () => void;
  handleExportSchools: () => void;
  handleOpenActionsMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleCacheSelectedSchools: () => void;
  handleClearSelectedSchoolCaches: () => void;
  handleStartOfflineCacheSelection: (
    action: OfflineCacheSelectionAction,
  ) => void;
  handleCancelOfflineCacheSelection: () => void;
  handleOpenAddSchoolPage: () => void;
  handleOpenFilters: () => void;
  handleOpenMigratePage: () => void;
  handleOpenUploadPage: () => void;
  handleSelectDateRange: (nextRange: DateRangeValue) => void;
  haveAccess: boolean;
  cacheOfflineEnabled: boolean;
  selectedSchoolIds: string[];
  isCachingSchools: boolean;
  isClearingSchoolCaches: boolean;
  isOfflineCacheSelectionMode: boolean;
  offlineCacheSelectionAction: OfflineCacheSelectionAction | null;
  saveOfflineCacheLabel: string;
  clearOfflineCacheLabel: string;
  isActionsButtonCloseShine: boolean;
  isActionsMenuOpen: boolean;
  isExportDisabled: boolean;
  isExporting: boolean;
  isExternalUser: boolean;
  isFilterLoading: boolean;
  isFilterOpen: boolean;
  percentageFilters: PercentageFilters;
  schoolPerformanceFilter: SchoolPerformanceFilterValue | null;
  searchTerm: string;
  selectedDateRange: DateRangeValue;
  selectedTab: PROGRAM_TAB;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPercentageFilters: React.Dispatch<React.SetStateAction<PercentageFilters>>;
  setSchoolPerformanceFilter: React.Dispatch<
    React.SetStateAction<SchoolPerformanceFilterValue | null>
  >;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setSelectedTab: React.Dispatch<React.SetStateAction<PROGRAM_TAB>>;
  setTempFilters: React.Dispatch<React.SetStateAction<Filters>>;
  tabOptions: Array<{ label: string; value: string }>;
  tempFilters: Filters;
};

export default function SchoolListHeaderControls({
  actionsAnchorEl,
  columns,
  filterOptions,
  filters,
  handleCancelFilters,
  handleCloseActionsMenu,
  handleExportSchools,
  handleOpenActionsMenu,
  handleCacheSelectedSchools,
  handleClearSelectedSchoolCaches,
  handleStartOfflineCacheSelection,
  handleCancelOfflineCacheSelection,
  handleOpenAddSchoolPage,
  handleOpenFilters,
  handleOpenMigratePage,
  handleOpenUploadPage,
  handleSelectDateRange,
  haveAccess,
  cacheOfflineEnabled,
  selectedSchoolIds,
  isCachingSchools,
  isClearingSchoolCaches,
  isOfflineCacheSelectionMode,
  offlineCacheSelectionAction,
  saveOfflineCacheLabel,
  clearOfflineCacheLabel,
  isActionsButtonCloseShine,
  isActionsMenuOpen,
  isExportDisabled,
  isExporting,
  isExternalUser,
  isFilterLoading,
  isFilterOpen,
  percentageFilters,
  schoolPerformanceFilter,
  searchTerm,
  selectedDateRange,
  selectedTab,
  setFilters,
  setIsFilterOpen,
  setPage,
  setPercentageFilters,
  setSchoolPerformanceFilter,
  setSearchTerm,
  setSelectedTab,
  setTempFilters,
  tabOptions,
  tempFilters,
}: SchoolListHeaderControlsProps) {
  return (
    <div className="school-list-header-and-search-filter">
      <div className="school-list-search-filter">
        <div className="school-list-tab-wrapper">
          <Tabs
            value={selectedTab}
            onChange={(event, value) => {
              setSelectedTab(value);
              setPage(1);
            }}
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            className="school-list-tabs-div"
          >
            {tabOptions.map((tab) => (
              <Tab
                key={tab.value}
                label={tab.label}
                value={tab.value}
                className="school-list-tab"
              />
            ))}
          </Tabs>
        </div>
        <div
          className={`school-list-button-and-search-filter${
            isOfflineCacheSelectionMode
              ? ' school-list-cache-selection-active'
              : ''
          }`}
        >
          <div className="school-list-search-control">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              filters={filters}
              isFilter={false}
              onClearFilters={handleCancelFilters}
            />
          </div>
          <div className="school-list-export-control">
            <SchoolListExportButton
              disabled={isExportDisabled}
              isExporting={isExporting}
              onClick={handleExportSchools}
            />
          </div>
          <SchoolListHeaderActions
            actionsAnchorEl={actionsAnchorEl}
            cacheOfflineEnabled={cacheOfflineEnabled}
            clearOfflineCacheLabel={clearOfflineCacheLabel}
            handleCacheSelectedSchools={handleCacheSelectedSchools}
            handleCancelOfflineCacheSelection={
              handleCancelOfflineCacheSelection
            }
            handleClearSelectedSchoolCaches={handleClearSelectedSchoolCaches}
            handleCloseActionsMenu={handleCloseActionsMenu}
            handleOpenActionsMenu={handleOpenActionsMenu}
            handleOpenAddSchoolPage={handleOpenAddSchoolPage}
            handleOpenMigratePage={handleOpenMigratePage}
            handleOpenUploadPage={handleOpenUploadPage}
            handleStartOfflineCacheSelection={handleStartOfflineCacheSelection}
            haveAccess={haveAccess}
            isActionsButtonCloseShine={isActionsButtonCloseShine}
            isActionsMenuOpen={isActionsMenuOpen}
            isCachingSchools={isCachingSchools}
            isClearingSchoolCaches={isClearingSchoolCaches}
            isExternalUser={isExternalUser}
            isOfflineCacheSelectionMode={isOfflineCacheSelectionMode}
            offlineCacheSelectionAction={offlineCacheSelectionAction}
            saveOfflineCacheLabel={saveOfflineCacheLabel}
            selectedSchoolIds={selectedSchoolIds}
          />
          <div className="school-list-date-range-control">
            <SchoolListDateRangeDropdown
              value={selectedDateRange}
              onChange={handleSelectDateRange}
            />
          </div>
          <div className="school-list-filter-control">
            <Button
              startIcon={<FilterListIcon fontSize="small" />}
              className="filter-button-SearchAndFilter school-list-top-filter-button"
              onClick={handleOpenFilters}
            >
              <span style={{ color: 'black' }}>{t('Filter')}</span>
            </Button>
          </div>
        </div>
      </div>
      <SchoolListAppliedFilters
        columns={columns}
        filterOptions={filterOptions}
        filters={filters}
        isFilterLoading={isFilterLoading}
        isFilterOpen={isFilterOpen}
        percentageFilters={percentageFilters}
        schoolPerformanceFilter={schoolPerformanceFilter}
        setFilters={setFilters}
        setIsFilterOpen={setIsFilterOpen}
        setPage={setPage}
        setPercentageFilters={setPercentageFilters}
        setSchoolPerformanceFilter={setSchoolPerformanceFilter}
        setTempFilters={setTempFilters}
        tempFilters={tempFilters}
      />
    </div>
  );
}
