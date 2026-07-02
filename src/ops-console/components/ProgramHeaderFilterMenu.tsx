import React from 'react';
import { Box, Popover } from '@mui/material';
import { t } from 'i18next';
import { PROGRAM_PERCENT_FILTERS } from '../pages/ProgramPageLogic';

type ProgramHeaderFilterMenuProps = {
  anchorEl: HTMLElement | null;
  selectedValues: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
};

const PROGRAM_HEADER_FILTER_OPTIONS = [
  {
    range: '\u2264 30%',
    value: PROGRAM_PERCENT_FILTERS.LOW,
    className: 'program-header-filter-chip-low',
  },
  {
    range: '31% \u2013 69%',
    value: PROGRAM_PERCENT_FILTERS.MID,
    className: 'program-header-filter-chip-mid',
  },
  {
    range: '\u2265 70%',
    value: PROGRAM_PERCENT_FILTERS.HIGH,
    className: 'program-header-filter-chip-high',
  },
] as const;

const ProgramHeaderFilterMenu: React.FC<ProgramHeaderFilterMenuProps> = ({
  anchorEl,
  selectedValues,
  onClose,
  onSelect,
}) => (
  <Popover
    open={Boolean(anchorEl)}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    slotProps={{ paper: { className: 'program-header-filter-menu' } }}
  >
    <Box className="program-header-filter-options">
      {PROGRAM_HEADER_FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="program-header-filter-row"
          onClick={() => onSelect(option.value)}
        >
          <span className="program-header-filter-range">{option.range}</span>
          <span
            className={`program-header-filter-chip ${option.className} ${
              selectedValues.includes(option.value)
                ? 'program-header-filter-chip-selected'
                : ''
            }`}
          >
            {t(option.value)}
          </span>
        </button>
      ))}
    </Box>
  </Popover>
);

export default ProgramHeaderFilterMenu;
