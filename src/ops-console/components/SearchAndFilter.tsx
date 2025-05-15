import React from "react";
import { Stack, TextField, InputAdornment, Button } from "@mui/material";
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
  const hasFilters = Object.values(filters).some((values) => values.length > 0);

  return (
    <Stack direction="row" spacing={2} className="search-filter-container">
      <TextField
        variant="outlined"
        placeholder={t("Search programs...") || "Search programs..."}
        onChange={onSearchChange}
        value={searchTerm}
        className="search-input"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="outlined"
        startIcon={hasFilters ? <CloseIcon /> : <FilterListIcon />}
        className={`filter-button ${hasFilters ? "has-filters" : ""}`}
        onClick={onFilterClick}
      >
        {hasFilters ? t("Clear Filters") : t("Filter")}
      </Button>
    </Stack>
  );
};

export default SearchAndFilter;