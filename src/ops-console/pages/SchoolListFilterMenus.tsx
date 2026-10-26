import React from 'react';
import { Box, Chip, Menu, MenuItem, Typography } from '@mui/material';
import {
  getPercentageBandLabel,
  getPercentageBandMeta,
  getSchoolPerformanceLabel,
  getStatusMeta,
  PERCENTAGE_FILTER_OPTIONS,
  SCHOOL_PERFORMANCE_FILTER_OPTIONS,
  type PercentBand,
  type SchoolPerformanceFilterValue,
} from './SchoolList.helpers';

type SchoolListFilterMenusProps = {
  activePercentageBand?: PercentBand;
  handleClosePercentageFilter: () => void;
  handleCloseSchoolPerformanceFilter: () => void;
  handleSelectPercentageFilter: (band: PercentBand) => void;
  handleSelectSchoolPerformanceFilter: (
    status: SchoolPerformanceFilterValue,
  ) => void;
  percentageFilterAnchorEl: HTMLElement | null;
  schoolPerformanceFilter: SchoolPerformanceFilterValue | null;
  schoolPerformanceFilterAnchorEl: HTMLElement | null;
};

export default function SchoolListFilterMenus({
  activePercentageBand,
  handleClosePercentageFilter,
  handleCloseSchoolPerformanceFilter,
  handleSelectPercentageFilter,
  handleSelectSchoolPerformanceFilter,
  percentageFilterAnchorEl,
  schoolPerformanceFilter,
  schoolPerformanceFilterAnchorEl,
}: SchoolListFilterMenusProps) {
  return (
    <>
      <Menu
        anchorEl={percentageFilterAnchorEl}
        open={Boolean(percentageFilterAnchorEl)}
        onClose={handleClosePercentageFilter}
        PaperProps={{ className: 'school-list-percent-filter-menu' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {PERCENTAGE_FILTER_OPTIONS.map((option) => {
          const selected = activePercentageBand === option.value;
          const bandMeta = getPercentageBandMeta(option.value);
          return (
            <MenuItem
              key={option.value}
              onClick={() => handleSelectPercentageFilter(option.value)}
              className="school-list-percent-filter-menu-item"
              selected={selected}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
                gap={1.5}
              >
                <Typography variant="body2" fontWeight={500} color="#4B5563">
                  {option.description}
                </Typography>
                <Chip
                  label={getPercentageBandLabel(option.value)}
                  size="small"
                  sx={{
                    height: 28,
                    minWidth: 64,
                    fontWeight: 700,
                    backgroundColor: bandMeta.bg,
                    color: bandMeta.color,
                  }}
                />
              </Box>
            </MenuItem>
          );
        })}
      </Menu>

      <Menu
        anchorEl={schoolPerformanceFilterAnchorEl}
        open={Boolean(schoolPerformanceFilterAnchorEl)}
        onClose={handleCloseSchoolPerformanceFilter}
        PaperProps={{ className: 'school-list-percent-filter-menu' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {SCHOOL_PERFORMANCE_FILTER_OPTIONS.map((option) => {
          const selected = schoolPerformanceFilter === option;
          const optionLabel = getSchoolPerformanceLabel(option);
          const meta = getStatusMeta(option);
          return (
            <MenuItem
              key={option}
              onClick={() => handleSelectSchoolPerformanceFilter(option)}
              className="school-list-percent-filter-menu-item"
              selected={selected}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
                gap={1.5}
              >
                <Chip
                  label={optionLabel}
                  size="small"
                  sx={{
                    height: 28,
                    fontWeight: 700,
                    backgroundColor: meta.bg,
                    color: meta.color,
                  }}
                />
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
