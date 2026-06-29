import React from 'react';
import { Box, Chip } from '@mui/material';
import './SelectedFilters.css';

interface SelectedFiltersProps {
  filters: Record<string, string[]>;
  onDeleteFilter: (key: string, value: string) => void;
  extraFilters?: Array<{
    key: string;
    value: string;
    label: string;
  }>;
}

const SelectedFilters: React.FC<SelectedFiltersProps> = ({
  filters,
  onDeleteFilter,
  extraFilters = [],
}) => {
  return (
    <Box className="selected-filters-container-SelectedFilters">
      {Object.entries(filters).map(([key, values]) =>
        values.length > 0
          ? values.map((value, index) => (
              <Chip
                key={`${key}-${index}`}
                label={`${value}`}
                onDelete={() => onDeleteFilter(key, value)}
                className="filter-chip-SelectedFilters"
              />
            ))
          : null,
      )}
      {extraFilters.map((filter) => (
        <Chip
          key={`${filter.key}-${filter.value}`}
          label={filter.label}
          onDelete={() => onDeleteFilter(filter.key, filter.value)}
          className="filter-chip-SelectedFilters"
        />
      ))}
    </Box>
  );
};

export default SelectedFilters;
