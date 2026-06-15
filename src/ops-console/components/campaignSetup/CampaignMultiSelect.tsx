import React from 'react';
import {
  Autocomplete,
  Checkbox,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { CampaignCountPlaceholder } from './CampaignPlaceholder';

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
  preventMobileKeyboard?: boolean;
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
  preventMobileKeyboard = false,
  renderSelectedLabel,
  onChange,
}: CampaignMultiSelectProps<T>) => {
  const isMobileView = useMediaQuery('(max-width:48rem)');
  const shouldPreventKeyboard = preventMobileKeyboard && isMobileView;

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      openOnFocus
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
          : CampaignCountPlaceholder(selected, placeholder)
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length ? '' : placeholder}
          error={error}
          helperText={helperText}
          size="small"
          inputProps={{
            ...params.inputProps,
            readOnly: shouldPreventKeyboard,
            inputMode: shouldPreventKeyboard
              ? 'none'
              : params.inputProps.inputMode,
          }}
        />
      )}
    />
  );
};
