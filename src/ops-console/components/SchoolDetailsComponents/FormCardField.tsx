import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { t } from 'i18next';
import { PhoneInput } from 'react-international-phone';
import type { FieldConfig } from './FormCard';
type FormCardFieldProps = {
  field: FieldConfig;
  handleChange: (name: string, value: string) => void;
  openSelect: string | null;
  setOpenSelect: (name: string | null) => void;
  values: Record<string, string>;
};
export const FormCardField = ({
  field,
  handleChange,
  openSelect,
  setOpenSelect,
  values,
}: FormCardFieldProps) => {
  const commonInputProps = {
    id: field.name,
    name: field.name,
    value: values[field.name] ?? '',
    required: field.required,
    placeholder: field.placeholder,
  };
  if (field.kind === 'phone') {
    return (
      <PhoneInput
        defaultCountry="in"
        value={values[field.name] ?? ''}
        onChange={(value, meta) => {
          const digits = value.replace(/\D/g, '');
          const dialCode = meta?.country?.dialCode ?? '';
          const isCountryCodeOnly = dialCode !== '' && digits === dialCode;
          handleChange(field.name, isCountryCodeOnly ? '' : value);
        }}
        disabled={field.disabled}
        disableCountryGuess
        className="formcard-phone-input"
        inputClassName="formcard-phone-input-inner"
        inputProps={{
          id: field.name,
          name: field.name,
          required: field.required,
          placeholder: field.placeholder ?? '',
          onKeyDown: (e) => {
            const input = e.currentTarget as HTMLInputElement;
            const selectionStart = input.selectionStart ?? 0;
            const prefixMatch = input.value.match(/^\+\d+\s*/);
            const prefixLength = prefixMatch ? prefixMatch[0].length : 0;
            if (
              selectionStart <= prefixLength &&
              (e.key === 'Backspace' || e.key === 'Delete')
            ) {
              e.preventDefault();
            }
          },
        }}
      />
    );
  }
  if (field.kind === 'email') {
    return (
      <input
        type="email"
        {...commonInputProps}
        onChange={(e) => handleChange(field.name, e.target.value)}
      />
    );
  }
  if (field.kind === 'chips') {
    const chips = (values[field.name] ?? '')
      .split('/')
      .map((value) => value.trim())
      .filter(Boolean);
    return (
      <div className="formcard-chip-list" id={field.name}>
        {chips.map((chip, index) => (
          <span
            key={`${chip}-${index}`}
            className="formcard-value-chip"
            title={chip}
          >
            {chip}
          </span>
        ))}
      </div>
    );
  }
  if (field.kind !== 'select') {
    return (
      <input
        type="text"
        {...commonInputProps}
        disabled={field.disabled}
        onChange={(e) => handleChange(field.name, e.target.value)}
      />
    );
  }
  const isThisSelectOpen = openSelect === field.name;
  const placeholderText = field.placeholder
    ? t(field.placeholder)
    : `${t('Select ')} ${t(field.label)}`;
  if (field.multi) {
    const currentVal = values[field.name] || '';
    const selectedIds = currentVal ? currentVal.split(',').filter(Boolean) : [];
    const optionOrder = new Map<string, number>(
      (field.options ?? []).map((option, index) => [option.value, index]),
    );
    const displayText = selectedIds
      .map((id) => field.options?.find((option) => option.value === id))
      .map((option, index) => (option ? t(option.label) : selectedIds[index]))
      .join(', ');
    return (
      <div
        className={`formcard-select-wrapper ${
          isThisSelectOpen ? 'formcard-select-open' : ''
        }`}
      >
        <input
          className="formcard-placeholder-validator"
          value={values[field.name] || ''}
          required={field.required}
          onChange={() => {}}
          tabIndex={-1}
        />
        <div
          className="formcard-multiselect-trigger"
          onClick={() => setOpenSelect(isThisSelectOpen ? null : field.name)}
          tabIndex={0}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setOpenSelect(null);
            }
          }}
        >
          <span
            className={`formcard-multiselect-trigger-text ${
              displayText ? '' : 'formcard-multiselect-trigger-placeholder'
            }`}
            title={displayText || undefined}
          >
            {displayText || placeholderText}
          </span>
          <span className="formcard-select-arrow-flipper">
            <span className="formcard-arrow-down">â–¾</span>
            <span className="formcard-arrow-up">â–´</span>
          </span>
        </div>
        {isThisSelectOpen && (
          <div className="formcard-multiselect-dropdown">
            {field.options?.map((opt) => {
              const isSelected = selectedIds.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  className={`formcard-multiselect-option ${
                    isSelected ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const newSelected = isSelected
                      ? selectedIds.filter((id) => id !== opt.value)
                      : [...selectedIds, opt.value];
                    const normalizedSelected = [...newSelected].sort(
                      (leftClassId, rightClassId) =>
                        (optionOrder.get(leftClassId) ??
                          Number.MAX_SAFE_INTEGER) -
                        (optionOrder.get(rightClassId) ??
                          Number.MAX_SAFE_INTEGER),
                    );
                    handleChange(field.name, normalizedSelected.join(','));
                  }}
                >
                  <div className="formcard-multiselect-checkbox">
                    {isSelected && (
                      <CheckIcon style={{ fontSize: 12, color: 'white' }} />
                    )}
                  </div>
                  {t(opt.label)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  const shouldUseCustomDropdown = (field.options?.length || 0) > 3;
  if (shouldUseCustomDropdown) {
    const currentValue = values[field.name] || '';
    const selectedOption = field.options?.find(
      (option) => option.value === currentValue,
    );
    const displayText = selectedOption ? t(selectedOption.label) : '';
    return (
      <div
        className={`formcard-select-wrapper ${
          isThisSelectOpen ? 'formcard-select-open' : ''
        }`}
      >
        <input
          className="formcard-placeholder-validator"
          value={values[field.name] || ''}
          required={field.required}
          onChange={() => {}}
          tabIndex={-1}
          onInvalid={(e) => {
            (e.target as HTMLInputElement).focus();
          }}
        />
        <div
          className="formcard-multiselect-trigger"
          onClick={() => setOpenSelect(isThisSelectOpen ? null : field.name)}
          tabIndex={0}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setOpenSelect(null);
            }
          }}
        >
          <span
            className={`formcard-multiselect-trigger-text ${
              displayText ? '' : 'formcard-multiselect-trigger-placeholder'
            }`}
            title={displayText || undefined}
          >
            {displayText || placeholderText}
          </span>
          <span className="formcard-select-arrow-flipper">
            <span className="formcard-arrow-down">â–¾</span>
            <span className="formcard-arrow-up">â–´</span>
          </span>
        </div>
        {isThisSelectOpen && (
          <div className="formcard-multiselect-dropdown">
            {field.options?.map((opt) => {
              const isSelected = currentValue === opt.value;
              return (
                <div
                  key={opt.value}
                  className={`formcard-multiselect-option ${
                    isSelected ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleChange(field.name, opt.value);
                    setOpenSelect(null);
                  }}
                >
                  {t(opt.label)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      className={`formcard-select-wrapper ${
        isThisSelectOpen ? 'formcard-select-open' : ''
      }`}
    >
      <select
        {...commonInputProps}
        disabled={field.disabled}
        onMouseDown={() => setOpenSelect(isThisSelectOpen ? null : field.name)}
        onChange={(e) => {
          handleChange(field.name, e.target.value);
          setOpenSelect(null);
        }}
        onBlur={() => setOpenSelect(null)}
      >
        {!field.suppressPlaceholderOption && (
          <option value="">{placeholderText}</option>
        )}
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.label)}
          </option>
        ))}
      </select>
      <span className="formcard-select-arrow-flipper">
        <span className="formcard-arrow-down">â–¾</span>
        <span className="formcard-arrow-up">â–´</span>
      </span>
    </div>
  );
};
