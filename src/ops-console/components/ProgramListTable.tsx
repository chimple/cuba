import React, { useState } from 'react';
import { Box, Button, CircularProgress, Tab, Tabs } from '@mui/material';
import { t } from 'i18next';
import { PROGRAM_TAB } from '../../common/constants';
import DataTableBody, { type Column } from './DataTableBody';
import DataTablePagination from './DataTablePagination';
import FilterSlider from './FilterSlider';
import ProgramActionsMenu from './ProgramActionsMenu';
import ProgramHeaderFilterMenu from './ProgramHeaderFilterMenu';
import SearchAndFilter from './SearchAndFilter';
import SelectedFilters from './SelectedFilters';
import SchoolListDateRangeDropdown from './SchoolListDateRangeDropdown';
import SchoolListExportButton from './SchoolListExportButton';
import {
  PROGRAM_HEADER_PERCENT_FILTER_BY_COLUMN,
  getProgramSelectedFilterLabel,
  programFilterConfigs,
  programTabOptions,
  type DateRangeValue,
  type Filters,
  type ProgramListRow,
} from '../pages/ProgramPageLogic';

type ProgramListTableProps = {
  selectedTab: PROGRAM_TAB;
  onTabChange: (value: PROGRAM_TAB) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tempFilters: Filters;
  filterOptions: Filters;
  isFilterOpen: boolean;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDeleteFilter: (key: string, value: string) => void;
  onTempFilterChange: (name: string, value: string[]) => void;
  selectedDateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  isExportDisabled: boolean;
  isExporting: boolean;
  onExport: () => void | Promise<void>;
  canCreateProgram: boolean;
  onNewProgram: () => void;
  columns: Column<ProgramListRow>[];
  rows: ProgramListRow[];
  isLoading: boolean;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  tableScrollRef: React.RefObject<HTMLDivElement | null>;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  filters: Filters;
  onHeaderFilterChange: (filterKey: string, value: string) => void;
};

const ProgramListControls: React.FC<ProgramListTableProps> = (props) => (
  <div className="program-header-and-search-filter">
    <div className="program-search-filter">
      <div className="program-tab-wrapper">
        <Tabs
          value={props.selectedTab}
          onChange={(_, value: PROGRAM_TAB) => props.onTabChange(value)}
          className="program-list-tabs-div"
        >
          {programTabOptions.map((option) => (
            <Tab
              key={option.value}
              label={option.label}
              value={option.value}
              className="program-list-tab"
            />
          ))}
        </Tabs>
      </div>
      <div className="program-button-and-search-filter">
        <SearchAndFilter
          searchTerm={props.searchTerm}
          onSearchChange={(event) => props.onSearchChange(event.target.value)}
          filters={props.filters}
          onClearFilters={props.onClearFilters}
          variantType="standard"
          isFilter={false}
        />
        <SchoolListExportButton
          disabled={props.isExportDisabled}
          isExporting={props.isExporting}
          onClick={props.onExport}
        />
        {props.canCreateProgram ? (
          <ProgramActionsMenu onNewProgram={props.onNewProgram} />
        ) : null}
        <SchoolListDateRangeDropdown
          value={props.selectedDateRange}
          onChange={props.onDateRangeChange}
        />
        <Button
          className="program-list-filter-button"
          onClick={props.onOpenFilters}
          startIcon={React.createElement('img', {
            alt: '',
            className: 'program-list-filter-icon',
            src: '/assets/icons/filterIcon.svg',
          })}
        >
          {t('Filter')}
        </Button>
      </div>
    </div>
    <SelectedFilters
      filters={props.filters}
      getFilterLabel={getProgramSelectedFilterLabel}
      onDeleteFilter={props.onDeleteFilter}
    />
    <FilterSlider
      isOpen={props.isFilterOpen}
      onClose={props.onCloseFilters}
      filters={props.tempFilters}
      filterOptions={props.filterOptions}
      onFilterChange={props.onTempFilterChange}
      onApply={props.onApplyFilters}
      onCancel={props.onClearFilters}
      filterConfigs={programFilterConfigs}
    />
  </div>
);

const ProgramListTable: React.FC<ProgramListTableProps> = (props) => {
  const [headerFilterAnchor, setHeaderFilterAnchor] = useState<HTMLElement>();
  const [headerFilterColumn, setHeaderFilterColumn] = useState<string>();
  const activeFilterKey =
    headerFilterColumn &&
    PROGRAM_HEADER_PERCENT_FILTER_BY_COLUMN[headerFilterColumn];

  return (
    <>
      <ProgramListControls {...props} />
      <div
        className={`program-table ${
          !props.isLoading && props.rows.length === 0
            ? 'program-table-empty'
            : ''
        }`}
      >
        {props.isLoading && (
          <Box className="program-loading-container">
            <CircularProgress size={28} />
          </Box>
        )}
        {!props.isLoading && props.rows.length > 0 && (
          <DataTableBody
            columns={props.columns}
            rows={props.rows}
            orderBy={props.orderBy}
            order={props.orderDir}
            onSort={props.onSort}
            detailPageRouteBase="programs"
            ref={props.tableScrollRef}
            tableMinWidth="max(1696px, 100%)"
            tableWidth="100%"
            headerNoEllipsis
            customHeaderIcons
            activeHeaderFilterKey={headerFilterColumn}
            onHeaderFilterClick={(anchorEl, key) => {
              setHeaderFilterAnchor(anchorEl);
              setHeaderFilterColumn(key);
            }}
          />
        )}
        {!props.isLoading && props.rows.length === 0 && t('No programs found')}
      </div>
      {!props.isLoading && props.rows.length > 0 && (
        <div className="program-page-pagination">
          <DataTablePagination
            page={props.page}
            pageCount={props.pageCount}
            onPageChange={props.onPageChange}
          />
        </div>
      )}
      <ProgramHeaderFilterMenu
        anchorEl={headerFilterAnchor ?? null}
        selectedValues={
          activeFilterKey ? (props.filters[activeFilterKey] ?? []) : []
        }
        onClose={() => {
          setHeaderFilterAnchor(undefined);
          setHeaderFilterColumn(undefined);
        }}
        onSelect={(value) => {
          if (activeFilterKey) {
            props.onHeaderFilterChange(activeFilterKey, value);
          }
          setHeaderFilterAnchor(undefined);
          setHeaderFilterColumn(undefined);
        }}
      />
    </>
  );
};

export default ProgramListTable;
