import React from 'react';
import { Autocomplete, Checkbox, TextField } from '@mui/material';
import { renderSelectionCount } from './CampaignPlaceholder';

type AutocompleteOptionProps = React.HTMLAttributes<HTMLLIElement> & {
  key: React.Key;
};

type CampaignMultiSelectProps<T> = {
  options: T[];
  value: T[];
  loading: boolean;
  placeholder: string;
  getOptionLabel?: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  error?: boolean;
  helperText?: string;
  renderSelectedLabel?: (selected: T[]) => React.ReactNode;
  onChange: (value: T[]) => void;
};

export const CampaignMultiSelect = <T,>({
  options,
  value,
  loading,
  placeholder,
  getOptionLabel,
  isOptionEqualToValue,
  error,
  helperText,
  renderSelectedLabel,
  onChange,
}: CampaignMultiSelectProps<T>) => (
  <Autocomplete
    multiple
    disableCloseOnSelect
    options={options}
    value={value}
    loading={loading}
    getOptionLabel={getOptionLabel}
    isOptionEqualToValue={isOptionEqualToValue}
    renderOption={(props, option, { selected }) => {
      const { key, ...optionProps } = props as AutocompleteOptionProps;
      const label = getOptionLabel ? getOptionLabel(option) : String(option);
      return (
        <li key={key} {...optionProps}>
          <Checkbox checked={selected} sx={{ marginRight: 1 }} />
          {label}
        </li>
      );
    }}
    onChange={(_, nextValue) => onChange(nextValue)}
    renderTags={(selected) =>
      renderSelectedLabel
        ? renderSelectedLabel(selected)
        : renderSelectionCount(selected, placeholder)
    }
    renderInput={(params) => (
      <TextField
        {...params}
        placeholder={value.length ? '' : placeholder}
        error={error}
        helperText={helperText}
        size="small"
      />
    )}
  />
);
