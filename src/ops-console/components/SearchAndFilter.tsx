import React, { useState, useEffect } from 'react';
import {
  Stack,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import './SearchAndFilter.css';
import { useTranslation } from 'react-i18next';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  filters?: Record<string, string[]>;
  onFilterClick?: () => void;
  onClearFilters?: () => void;
  isFilter?: boolean;
  forceOpenSearch?: boolean;
  variantType?: 'outlined' | 'standard';
  filterIconSrc?: string;
  searchPlaceholder?: string;
}

const DEBOUNCE_MS = 800;

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterClick,
  onClearFilters,
  isFilter,
  forceOpenSearch = false,
  variantType,
  filterIconSrc,
  searchPlaceholder,
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const showFilter = isFilter ?? true;
  const isPortraitMobile = useMediaQuery(
    '(max-width: 600px) and (orientation: portrait)',
  );
  const placeholder = searchPlaceholder || t('Search') || 'Search';

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

  const [showMobileSearch, setShowMobileSearch] = useState(forceOpenSearch);

  useEffect(() => {
    if (forceOpenSearch) {
      setShowMobileSearch(true);
    }
  }, [forceOpenSearch]);

  return (
    <Stack
      direction="row"
      spacing={isPortraitMobile ? 1 : 2}
      className="search-filter-container-SearchAndFilter"
      alignItems="center"
    >
      {isPortraitMobile ? (
        <TextField
          variant={variantType}
          placeholder={placeholder}
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
      ) : isMobile && !forceOpenSearch ? (
        showMobileSearch ? (
          <TextField
            variant={variantType}
            placeholder={placeholder}
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
          variant={variantType}
          placeholder={placeholder}
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

      {showFilter &&
        (isMobile ? (
          <IconButton
            aria-label="Open Filters"
            onClick={onFilterClick}
            sx={{ marginLeft: '0px' }}
          >
            {filterIconSrc ? (
              <img
                id="search-filter-icon-image"
                src={filterIconSrc}
                alt="Filter"
                className="filter-icon-image-SearchAndFilter"
              />
            ) : (
              <FilterListIcon />
            )}
          </IconButton>
        ) : (
          <Button
            // variant="outlined"
            startIcon={
              filterIconSrc ? (
                <img
                  id="search-filter-icon-image"
                  src={filterIconSrc}
                  alt="Filter"
                  className="filter-icon-image-SearchAndFilter"
                />
              ) : (
                <FilterListIcon />
              )
            }
            className="filter-button-SearchAndFilter"
            onClick={onFilterClick}
          >
            <span style={{ color: 'black' }}>{t('Filter')}</span>
          </Button>
        ))}
    </Stack>
  );
};

export default SearchAndFilter;
