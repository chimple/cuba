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
  useMediaQuery,
  useTheme,
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
  filterConfigs: { key: string; label: string; placeholder?: string }[];
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
  filterConfigs,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); 

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      classes={{ paper: "filter-slider-drawer-FilterSlider" }}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : 400,
          padding: 2,
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        },
      }}
    >
      <Box className="filter-header-FilterSlider">
        <Typography variant="h6">{t("Filters")}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Stack className="filter-content-FilterSlider">
        {filterConfigs.map(({ key, label, placeholder }) => (
          <Autocomplete
            key={key}
            multiple
            options={filterOptions[key] || []}
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
                label={label}
                placeholder={(placeholder ? t("Search {{placeholder}}...", { placeholder }) : t("Search {{key}}...", { key })) ?? ""}
                variant="outlined"
              />
            )}
            className={`filter-autocomplete${
              filters[key]?.length > 0 ? " filter-autocomplete-selected-FilterSlider" : ""
            }`}
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