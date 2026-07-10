import React from "react";
import { Box, Chip } from "@mui/material";
import "./SelectedFilters.css";

interface SelectedFiltersProps {
  filters: Record<string, string[]>;
  onDeleteFilter: (key: string, value: string) => void;
}

const SelectedFilters: React.FC<SelectedFiltersProps> = ({
  filters,
  onDeleteFilter,
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
          : null
      )}
    </Box>
  );
};

export default SelectedFilters;