import React, { useState, useEffect } from "react";
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
  onClearFilters?: () => void;
  isFilter?: boolean;
}

const DEBOUNCE_MS = 400;

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterClick,
  onClearFilters,
  isFilter,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 900px)");
  const showfilter = isFilter ?? true;
  const isPortraitMobile = useMediaQuery(
    "(max-width: 600px) and (orientation: portrait)"
  );
  const hasFilters = Object.values(filters).some((values) => values.length > 0);

  const [inputValue, setInputValue] = useState(searchTerm);

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== searchTerm) {
        onSearchChange({
          target: { value: inputValue },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <Stack
      direction="row"
      spacing={isPortraitMobile ? 1 : 2}
      className="search-filter-container-SearchAndFilter"
      alignItems="center"
    >
      {isPortraitMobile ? (
        <TextField
          variant="outlined"
          placeholder={t("Search") || "Search"}
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
          className="search-input-SearchAndFilter"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
      ) : isMobile ? (
        showMobileSearch ? (
          <TextField
            variant="outlined"
            placeholder={t("Search") || "Search"}
            onChange={(e) => setInputValue(e.target.value)}
            value={inputValue}
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
          placeholder={t("Search") || "Search"}
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
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

      {showfilter &&
        (isMobile ? (
          <IconButton
            aria-label="Open Filters"
            onClick={onFilterClick}
            sx={{ marginLeft: "0px" }}
          >
            <FilterListIcon />
          </IconButton>
        ) : (
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            className="filter-button-SearchAndFilter"
            onClick={onFilterClick}
          >
            <span style={{ color: "black" }}>{t("Filter")}</span>
          </Button>
        ))}
    </Stack>
  );
};

export default SearchAndFilter;
