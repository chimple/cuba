import React from 'react';
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FileUploadOutlined, Add } from '@mui/icons-material';
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
  type SchoolPerformanceFilterValue,
} from './SchoolList.helpers';
import SchoolListAppliedFilters from './SchoolListAppliedFilters';

type SchoolListHeaderControlsProps = {
  actionsAnchorEl: HTMLElement | null;
  columns: Column<SchoolListRow>[];
  filterOptions: Filters;
  filters: Filters;
  handleCancelFilters: () => void;
  handleCloseActionsMenu: () => void;
  handleExportSchools: () => void;
  handleOpenActionsMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleOpenAddSchoolPage: () => void;
  handleOpenMigratePage: () => void;
  handleOpenUploadPage: () => void;
  handleSelectDateRange: (nextRange: DateRangeValue) => void;
  haveAccess: boolean;
  isActionsButtonCloseShine: boolean;
  isActionsMenuOpen: boolean;
  isExportDisabled: boolean;
  isExporting: boolean;
  isExternalUser: boolean;
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
  handleOpenAddSchoolPage,
  handleOpenMigratePage,
  handleOpenUploadPage,
  handleSelectDateRange,
  haveAccess,
  isActionsButtonCloseShine,
  isActionsMenuOpen,
  isExportDisabled,
  isExporting,
  isExternalUser,
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
  const actionItems = !isExternalUser
    ? [
        ...(haveAccess
          ? [
              {
                key: 'migrate',
                label: t('Migrate'),
                icon: (
                  <img
                    id="school-list-actions-migrate-icon"
                    src="assets/icons/migrateArrow.svg"
                    alt=""
                    className="school-list-actions-menu-icon-image"
                  />
                ),
                onClick: handleOpenMigratePage,
              },
            ]
          : []),
        {
          key: 'upload',
          label: t('Upload'),
          icon: <FileUploadOutlined className="school-list-upload-icon" />,
          onClick: handleOpenUploadPage,
        },
        ...(haveAccess
          ? [
              {
                key: 'add-school',
                label: t('Add School'),
                icon: <Add className="school-list-upload-icon" />,
                onClick: handleOpenAddSchoolPage,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="school-list-header-and-search-filter">
      <div className="school-list-search-filter">
        <div className="school-list-tab-wrapper">
          <Tabs
            value={selectedTab}
            onChange={(e, val) => {
              setSelectedTab(val);
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

        <div className="school-list-button-and-search-filter">
          <div className="school-list-search-control">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={(e) => {
                setSearchTerm(e.target.value);
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
          <div className="school-list-actions-group">
            {!isExternalUser && (
              <Button
                variant="outlined"
                id="school-list-actions-button"
                className={`school-list-actions-button${
                  isActionsButtonCloseShine
                    ? ' school-list-actions-button-close-shine'
                    : ''
                }`}
                onClick={handleOpenActionsMenu}
                aria-controls={
                  isActionsMenuOpen ? 'school-list-actions-menu' : undefined
                }
                aria-expanded={isActionsMenuOpen ? 'true' : undefined}
                aria-haspopup="menu"
                endIcon={
                  <ArrowDropDownIcon
                    className={`school-list-actions-chevron ${
                      isActionsMenuOpen
                        ? 'school-list-actions-chevron-open'
                        : ''
                    }`}
                  />
                }
              >
                {t('Actions')}
              </Button>
            )}
            <Menu
              id="school-list-actions-menu"
              anchorEl={actionsAnchorEl}
              open={isActionsMenuOpen}
              onClose={handleCloseActionsMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              MenuListProps={{ disablePadding: true }}
              PaperProps={{ className: 'school-list-actions-menu' }}
            >
              {actionItems.flatMap((item, index) => [
                <MenuItem
                  key={item.key}
                  className="school-list-actions-menu-item"
                  onClick={() => {
                    handleCloseActionsMenu();
                    item.onClick();
                  }}
                >
                  <ListItemIcon className="school-list-actions-menu-item-icon">
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      className: 'school-list-actions-menu-item-label',
                    }}
                  />
                </MenuItem>,
                ...(index < actionItems.length - 1
                  ? [
                      <Divider
                        key={`${item.key}-divider`}
                        className="school-list-actions-menu-divider"
                      />,
                    ]
                  : []),
              ])}
            </Menu>
          </div>
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
              onClick={() => setIsFilterOpen(true)}
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
