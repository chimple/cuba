import React, { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import DataTableBody, { type Column } from '../DataTableBody';
import DataTablePagination from '../DataTablePagination';
import SelectedFilters from '../SelectedFilters';
import SearchAndFilter from '../SearchAndFilter';
import SchoolListDateRangeDropdown from '../SchoolListDateRangeDropdown';
import SchoolListExportButton from '../SchoolListExportButton';
import CampaignsOverviewInfoTooltip from './CampaignsOverviewInfoTooltip';
import {
  getActiveStudentTone,
  SCHOOL_PERFORMANCE_ACTIVE_STUDENT_FILTERS,
  SCHOOL_PERFORMANCE_COLUMNS,
  SCHOOL_PERFORMANCE_DAY_FILTERS,
  type CampaignSchoolPerformanceRow,
  type SchoolPerformanceColumnKey,
  useCampaignSchoolPerformanceReportState,
} from './CampaignSchoolPerformanceReport.helpers';
import './CampaignSchoolPerformanceReport.css';

interface CampaignSchoolPerformanceReportProps {
  campaignId?: string;
}

const CampaignSchoolPerformanceReport: React.FC<
  CampaignSchoolPerformanceReportProps
> = ({ campaignId }) => {
  const report = useCampaignSchoolPerformanceReportState(campaignId);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuColumn, setMenuColumn] =
    useState<SchoolPerformanceColumnKey | null>(null);

  const columns = useMemo<Column<CampaignSchoolPerformanceRow>[]>(
    () =>
      SCHOOL_PERFORMANCE_COLUMNS.map((column) => ({
        key: column.key,
        width: column.width,
        align: column.align,
        headerAlign: column.headerAlign,
        sortable: false,
        label: column.tooltip ? (
          <Box className="campaign-school-performance-report__header-label">
            <span>{t(column.label)}</span>
            <CampaignsOverviewInfoTooltip
              alignment={
                column.key === 'avgActivitiesCompleted' ? 'right' : 'left'
              }
              color="#1A71F6"
              label={t(column.label)}
              message={t(column.tooltip)}
            />
          </Box>
        ) : (
          t(column.label)
        ),
        render: (row) =>
          column.key === 'schoolName' ? (
            <Box className="campaign-school-performance-report__school">
              <Typography className="campaign-school-performance-report__school-name">
                {row.schoolName}
              </Typography>
              <Typography className="campaign-school-performance-report__school-meta">{`${row.udise} - ${row.block}`}</Typography>
            </Box>
          ) : column.key === 'activeStudents' ? (
            <Box className="campaign-school-performance-report__active-cell">
              <Typography fontSize={13}>{row.activeStudents}</Typography>
              <Chip
                label={`${row.activeStudentsPercent}%`}
                size="small"
                sx={{
                  fontWeight: 700,
                  color: getActiveStudentTone(row.activeStudentsPercent).color,
                  background: getActiveStudentTone(row.activeStudentsPercent)
                    .bg,
                }}
              />
            </Box>
          ) : column.key === 'avgTimeSpent' ? (
            row.avgTimeSpentLabel
          ) : (
            row[column.key as keyof CampaignSchoolPerformanceRow]
          ),
      })),
    [],
  );

  const selectedFilters = {
    activeStudents: report.appliedFilter
      ? [report.appliedFilter.chipLabel]
      : [],
  };
  const extraFilters = report.appliedSort
    ? [{ key: 'sort', value: report.appliedSort, label: report.appliedSort }]
    : [];

  return (
    <Box component="article" className="campaign-school-performance-report">
      <Box className="campaign-school-performance-report__header">
        <Box className="campaign-school-performance-report__toolbar">
          <Typography
            className="campaign-school-performance-report__title"
            style={{ fontWeight: '700' }}
          >
            {t('Campaign Schools')}
          </Typography>
          <Box className="campaign-school-performance-report__controls">
            <Box className="campaign-school-performance-report__search">
              <SearchAndFilter
                searchTerm={report.searchTerm}
                onSearchChange={(event) =>
                  report.setSearchTerm(event.target.value)
                }
                isFilter={false}
                searchPlaceholder={String(t('Search School'))}
              />
            </Box>
            <Box className="campaign-school-performance-report__actions">
              <Box className="campaign-school-performance-report__date">
                <SchoolListDateRangeDropdown
                  value={report.daysFilter}
                  onChange={report.setDaysFilter}
                  options={SCHOOL_PERFORMANCE_DAY_FILTERS.map((option) => ({
                    label: String(t(option.label)),
                    value: option.key,
                  }))}
                />
              </Box>
              <Box className="campaign-school-performance-report__export">
                <SchoolListExportButton
                  disabled={report.isExporting || report.loading}
                  isExporting={report.isExporting}
                  onClick={() => void report.handleExport()}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="campaign-school-performance-report__body">
        <SelectedFilters
          filters={selectedFilters}
          extraFilters={extraFilters}
          onDeleteFilter={(key) => {
            if (key === 'sort') {
              report.setSortKey('schoolName');
              report.setSortOrder('asc');
              return;
            }
            report.setActiveStudentsFilter(null);
          }}
          getFilterLabel={(key, value) =>
            key === 'activeStudents'
              ? `${t('Active Students')}: ${value}`
              : value
          }
        />
        <Box className="campaign-school-performance-report__table">
          <DataTableBody
            columns={columns}
            rows={report.paginatedRows}
            loading={report.loading}
            orderBy={null}
            order="asc"
            onSort={() => {}}
            disableRowNavigation
            tableMinWidth={940}
            tableWidth="100%"
            headerNoEllipsis
            renderHeaderActions={(column) => (
              <IconButton
                size="small"
                className="campaign-school-performance-report__header-action"
                onClick={(event) => {
                  setMenuAnchor(event.currentTarget);
                  setMenuColumn(
                    String(column.key) as SchoolPerformanceColumnKey,
                  );
                }}
              >
                <Box
                  component="span"
                  className="campaign-school-performance-report__header-action-icon"
                />
              </IconButton>
            )}
          />
        </Box>
      </Box>

      <Box className="campaign-school-performance-report__footer">
        <DataTablePagination
          page={report.page}
          pageCount={report.pageCount}
          onPageChange={report.setPage}
        />
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor && menuColumn)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuColumn(null);
        }}
        PaperProps={{
          className: 'campaign-school-performance-report__menu-paper',
        }}
      >
        <Box className="campaign-school-performance-report__menu-title">
          <Typography className="campaign-school-performance-report__menu-title-text">
            {t('Sort by')}
          </Typography>
        </Box>
        <MenuItem
          className="campaign-school-performance-report__menu-item"
          onClick={() => {
            if (menuColumn) report.setSortKey(menuColumn);
            report.setSortOrder('asc');
            setMenuAnchor(null);
            setMenuColumn(null);
          }}
        >
          {t(menuColumn === 'schoolName' ? 'Sort A → Z' : 'Sort Low → High')}
        </MenuItem>
        <MenuItem
          className="campaign-school-performance-report__menu-item"
          onClick={() => {
            if (menuColumn) report.setSortKey(menuColumn);
            report.setSortOrder('desc');
            setMenuAnchor(null);
            setMenuColumn(null);
          }}
        >
          {t(menuColumn === 'schoolName' ? 'Sort Z → A' : 'Sort High → Low')}
        </MenuItem>
        {menuColumn === 'activeStudents'
          ? [
              <Divider key="filter-divider" />,
              <Box
                key="filter-title"
                className="campaign-school-performance-report__menu-title"
              >
                <Typography className="campaign-school-performance-report__menu-title-text">
                  {t('Filter')}
                </Typography>
              </Box>,
              ...SCHOOL_PERFORMANCE_ACTIVE_STUDENT_FILTERS.map((filter) => (
                <MenuItem
                  key={filter.key}
                  className="campaign-school-performance-report__menu-filter-item"
                  onClick={() => {
                    report.setActiveStudentsFilter(filter.key);
                    setMenuAnchor(null);
                    setMenuColumn(null);
                  }}
                >
                  <span>{filter.chipLabel}</span>
                  <Chip
                    label={t(filter.label)}
                    size="small"
                    sx={{
                      color: filter.color,
                      background: filter.bg,
                      fontWeight: 700,
                    }}
                  />
                </MenuItem>
              )),
            ]
          : null}
      </Menu>
    </Box>
  );
};

export default CampaignSchoolPerformanceReport;
