import React from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './FilterSlider.css';
import { t } from 'i18next';
import type { SchoolFilterOption } from '../pages/SchoolList.helpers';

interface FilterSliderProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, string[]>;
  filterOptions: Record<string, SchoolFilterOption[]>;
  onFilterChange: (name: string, value: string[]) => void;
  onApply: () => void;
  onCancel: () => void;
  autocompleteStyles?: object;
  filterConfigs: { key: string; label: string; placeholder?: string }[];
  singleSelectKeys?: string[];
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
  singleSelectKeys = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [schoolSearchValue, setSchoolSearchValue] = React.useState('');

  const getOptionLabel = (option: SchoolFilterOption) =>
    typeof option === 'string' ? option : option.name;
  const getOptionValue = (option: SchoolFilterOption) =>
    typeof option === 'string' ? option : option.id;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      classes={{ paper: 'filter-slider-drawer-FilterSlider' }}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 400,
          padding: 2,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          // Height is controlled by CSS for proper dvh support
        },
      }}
    >
      <Box className="filter-header-FilterSlider">
        <Typography variant="h6">{t('Filters')}</Typography>
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
            filterOptions={
              key === 'school'
                ? (options, state) => {
                    const query = state.inputValue.trim().toLowerCase();
                    if (!query) return options;

                    const rank = (name: string) => {
                      const lower = name.toLowerCase();
                      if (lower.startsWith(query)) return 0;
                      if (lower.includes(` ${query}`)) return 1;
                      if (lower.includes(query)) return 2;
                      return 3;
                    };

                    return [...options]
                      .filter((option) =>
                        getOptionLabel(option).toLowerCase().includes(query),
                      )
                      .sort((a, b) => {
                        const left = getOptionLabel(a);
                        const right = getOptionLabel(b);
                        return (
                          rank(left) - rank(right) ||
                          left.localeCompare(right, undefined, {
                            sensitivity: 'base',
                          })
                        );
                      });
                  }
                : undefined
            }
            disableCloseOnSelect
            filterSelectedOptions={false}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) =>
              getOptionValue(option) === getOptionValue(value)
            }
            value={
              key === 'program'
                ? (filterOptions[key] || []).filter((option) =>
                    (filters[key] ?? []).includes(getOptionValue(option)),
                  )
                : (filters[key] ?? [])
            }
            inputValue={key === 'school' ? schoolSearchValue : undefined}
            onInputChange={(_, newInputValue, reason) => {
              if (key !== 'school') return;

              if (reason === 'clear') {
                setSchoolSearchValue('');
                return;
              }

              if (reason === 'input') {
                setSchoolSearchValue(newInputValue);
                return;
              }

              // Keep the current search text after a selection so the filtered
              // result set stays visible for additional picks.
            }}
            onChange={(e, value) => {
              const nextValues = Array.isArray(value)
                ? value.map(getOptionValue)
                : [];
              onFilterChange(
                key,
                key === 'program' || singleSelectKeys.includes(key)
                  ? nextValues.slice(0, 1)
                  : nextValues,
              );
            }}
            getOptionDisabled={(option) =>
              (key === 'program' || singleSelectKeys.includes(key)) &&
              (filters[key]?.length ?? 0) > 0 &&
              !(filters[key] ?? []).includes(getOptionValue(option))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} sx={{ marginRight: 1 }} />
                {getOptionLabel(option)}
              </li>
            )}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={
                  (placeholder
                    ? t('Search {{placeholder}}...', { placeholder })
                    : t('Search {{key}}...', { key })) ?? ''
                }
                variant="outlined"
              />
            )}
            className={`filter-autocomplete${
              filters[key]?.length > 0
                ? ' filter-autocomplete-selected-FilterSlider'
                : ''
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
          {t('Clear All')}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onApply}
          className="filter-contained-button-FilterSlider"
        >
          {t('Apply')}
        </Button>
      </Box>
    </Drawer>
  );
};

export default FilterSlider;
