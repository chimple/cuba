import React from 'react';
import {
  Box,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { REQUEST_TABS } from '../../common/constants';
import DataTablePagination from '../components/DataTablePagination';
import DataTableBody from '../components/DataTableBody';
import SchoolListExportButton from '../components/SchoolListExportButton';
import { t } from 'i18next';
import SearchAndFilter from '../components/SearchAndFilter';
import FilterSlider from '../components/FilterSlider';
import SelectedFilters from '../components/SelectedFilters';
import { BsFillBellFill } from 'react-icons/bs';
import './RequestList.css';
import { DATE_RANGE_OPTIONS } from './SchoolList.helpers';
import {
  filterConfigsForRequests,
  INITIAL_FILTERS,
} from './RequestList.constants';
import { useRequestListPage } from './useRequestListPage';

const RequestList: React.FC = () => {
  const [exportAnchorEl, setExportAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const {
    columns,
    filterOptionsForSlider,
    filters,
    handleCancelFilters,
    handleDeleteFilter,
    handleExportRequests,
    handleOpenFilters,
    handleRowClick,
    handleSort,
    handleTabChange,
    isFilterOpen,
    isExportDisabled,
    isExporting,
    isLoading,
    orderBy,
    orderDir,
    page,
    pageCount,
    requestData,
    searchTerm,
    selectedTab,
    setFilters,
    setIsFilterOpen,
    setPage,
    setSearchTerm,
    setTempFilters,
    tableScrollRef,
    tabOptions,
    tempFilters,
  } = useRequestListPage();
  const isExportMenuOpen = Boolean(exportAnchorEl);
  const exportMenuId = 'request-list-export-menu';

  return (
    <div className="request-list-ion-page">
      <div className="request-list-main-container">
        <div className="request-list-page-header">
          <span className="request-list-page-header-title">
            {t('Requests')}
          </span>
          <IconButton className="request-list-bell-icon">
            <BsFillBellFill />
          </IconButton>
        </div>
        <div className="request-list-header-and-search-filter">
          <div className="request-list-search-filter">
            <div className="request-list-tab-wrapper">
              <Tabs
                value={selectedTab}
                onChange={(e, val) => handleTabChange(val as REQUEST_TABS)}
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                className="request-list-tabs-div"
              >
                {tabOptions.map((tab) => (
                  <Tab
                    key={tab.value}
                    label={tab.label}
                    value={tab.value}
                    className="request-list-tab"
                  />
                ))}
              </Tabs>
            </div>

            <div className="request-list-button-and-search-filter">
              <div className="request-list-search-control">
                <SearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  filters={filters}
                  onFilterClick={handleOpenFilters}
                  onClearFilters={handleCancelFilters}
                  beforeFilter={
                    <div className="request-list-export-control">
                      <SchoolListExportButton
                        id="request-list-export-button"
                        disabled={isExportDisabled}
                        isExporting={isExporting}
                        isMenuOpen={isExportMenuOpen}
                        menuId={exportMenuId}
                        onClick={(event) => {
                          setExportAnchorEl(event.currentTarget);
                        }}
                      />
                      <Menu
                        id={exportMenuId}
                        anchorEl={exportAnchorEl}
                        open={isExportMenuOpen}
                        onClose={() => setExportAnchorEl(null)}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        PaperProps={{
                          className: 'request-list-export-menu',
                        }}
                        slotProps={{ list: { disablePadding: true } }}
                      >
                        {DATE_RANGE_OPTIONS.flatMap((option, index) => [
                          <MenuItem
                            key={option.value}
                            className="request-list-export-menu-item"
                            onClick={() => {
                              setExportAnchorEl(null);
                              void handleExportRequests(option.value);
                            }}
                          >
                            <ListItemText
                              primary={option.label}
                              primaryTypographyProps={{
                                className: 'request-list-export-menu-label',
                              }}
                            />
                          </MenuItem>,
                          ...(index < DATE_RANGE_OPTIONS.length - 1
                            ? [
                                <Divider
                                  key={`${option.value}-divider`}
                                  className="request-list-export-menu-divider"
                                />,
                              ]
                            : []),
                        ])}
                      </Menu>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          <SelectedFilters
            filters={filters}
            onDeleteFilter={handleDeleteFilter}
          />

          <FilterSlider
            isOpen={isFilterOpen}
            onClose={() => {
              setIsFilterOpen(false);
              setTempFilters(filters);
            }}
            filters={tempFilters}
            filterOptions={filterOptionsForSlider}
            onFilterChange={(name, value) =>
              setTempFilters((prev) => ({ ...prev, [name]: value }))
            }
            onApply={() => {
              setFilters(tempFilters);
              setIsFilterOpen(false);
              setPage(1);
            }}
            onCancel={() => {
              setTempFilters(INITIAL_FILTERS);
              setFilters(INITIAL_FILTERS);
              setIsFilterOpen(false);
              setPage(1);
            }}
            autocompleteStyles={{}}
            filterConfigs={filterConfigsForRequests}
          />
        </div>

        <div className="request-list-table-container">
          {(isLoading || requestData.length > 0) && (
            <DataTableBody
              columns={columns}
              rows={requestData}
              orderBy={orderBy}
              order={orderDir}
              onSort={handleSort}
              loading={isLoading}
              onRowClick={handleRowClick}
              ref={tableScrollRef}
            />
          )}
        </div>

        {!isLoading && requestData.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {t('No requests found.')}
            </Typography>
          </Box>
        )}
        {!isLoading && requestData.length > 0 && (
          <div className="request-list-footer">
            <DataTablePagination
              pageCount={pageCount}
              page={page}
              onPageChange={(val) => {
                setPage(val);
                tableScrollRef.current?.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestList;
