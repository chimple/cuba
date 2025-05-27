import React, { useState } from "react";
import {
  Stack,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import "./SearchAndFilter.css";
import { useTranslation } from "react-i18next";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  filters: Record<string, string[]>;
  onFilterClick: () => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterClick,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const hasFilters = Object.values(filters).some((values) => values.length > 0);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <Stack
      direction="row"
      spacing={2}
      className="search-filter-container-SearchAndFilter"
      alignItems="center"
    >
      {isMobile ? (
        showMobileSearch ? (
          <TextField
            variant="outlined"
            placeholder={t("Search programs...") || "Search programs..."}
            onChange={onSearchChange}
            value={searchTerm}
            className="search-input-SearchAndFilter"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Close search"
                    onClick={() => setShowMobileSearch(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <IconButton
            aria-label="Open search"
            onClick={() => setShowMobileSearch(true)}
          >
            <SearchIcon />
          </IconButton>
        )
      ) : (
        <TextField
          variant="outlined"
          placeholder={t("Search programs...") || "Search programs..."}
          onChange={onSearchChange}
          value={searchTerm}
          className="search-input-SearchAndFilter"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      )}

      {isMobile ? (
        <IconButton
          aria-label={hasFilters ? "Clear Filters" : "Open Filters"}
          onClick={onFilterClick}
        >
          {hasFilters ? <CloseIcon /> : <FilterListIcon />}
        </IconButton>
      ) : (
        <Button
          variant="outlined"
          startIcon={hasFilters ? <CloseIcon /> : <FilterListIcon />}
          className={`filter-button-SearchAndFilter${hasFilters ? " has-filters" : ""}`}
          onClick={onFilterClick}
        >
          {hasFilters ? t("Clear Filters") : t("Filter")}
        </Button>
      )}
    </Stack>
  );
};

export default SearchAndFilter;