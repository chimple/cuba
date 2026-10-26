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
  getFilterLabel?: (key: string, value: string) => React.ReactNode;
}

const SelectedFilters: React.FC<SelectedFiltersProps> = ({
  filters,
  onDeleteFilter,
  extraFilters = [],
  getFilterLabel,
}) => {
  const renderLabel = (key: string, value: string) =>
    getFilterLabel ? getFilterLabel(key, value) : value;

  return (
    <Box className="selected-filters-container-SelectedFilters">
      {Object.entries(filters).map(([key, values]) =>
        values.length > 0
          ? values.map((value, index) => {
              const label = renderLabel(key, value);
              if (label === null) return null;

              return (
                <Chip
                  key={`${key}-${index}`}
                  label={label}
                  onDelete={() => onDeleteFilter(key, value)}
                  className="filter-chip-SelectedFilters"
                />
              );
            })
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
