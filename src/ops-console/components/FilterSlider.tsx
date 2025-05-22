import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Autocomplete,
  TextField,
  Checkbox,
  Button,
  Drawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./FilterSlider.css";
import { t } from "i18next";

interface FilterSliderProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, string[]>;
  filterOptions: Record<string, string[]>;
  onFilterChange: (name: string, value: string[]) => void;
  onApply: () => void;
  onCancel: () => void;
  autocompleteStyles?: object;
}

const FilterSlider: React.FC<FilterSliderProps> = ({
  isOpen,
  onClose,
  filters,
  filterOptions,
  onFilterChange,
  onApply,
  onCancel,
  autocompleteStyles = {},
}) => {
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      className="filter-slider-drawer-FilterSlider"
      style={{ marginBottom: "100px" }}
    >
      <Box className="filter-header-FilterSlider">
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Stack className="filter-content-FilterSlider">
        {Object.entries(filterOptions).map(([key, options]) => (
          <Autocomplete
            key={key}
            multiple
            options={options}
            disableCloseOnSelect
            getOptionLabel={(option) => option}
            value={filters[key] ?? []}
            onChange={(e, value) => onFilterChange(key, value)}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} sx={{ marginRight: 1 }} />
                {option}
              </li>
            )}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label={key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
                placeholder={t("Search {{key}}...", { key }) ?? ""}
                variant="outlined"
              />
            )}
            className={`filter-autocomplete${(filters[key] && filters[key].length > 0) ? ' filter-autocomplete-selected-FilterSlider' : ''}`}
            sx={autocompleteStyles}
          />
        ))}
      </Stack>

      <Box className="filter-footer-FilterSlider">
        <Button
          fullWidth
          variant="outlined"
          onClick={onCancel}
          className="filter-outlined-button-FilterSlider"
        >
          {t("Clear All")}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onApply}
          className="filter-contained-button-FilterSlider"
        >
          {t("Apply")}
        </Button>
      </Box>
    </Drawer>
  );
};

export default FilterSlider;