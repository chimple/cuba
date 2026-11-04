import React from 'react';
import { t } from 'i18next';
import type { FieldConfig } from './FormCard';
import { handleShortSelectKeyboard } from './shortSelectKeyboard';

type FormCardSelectFieldProps = {
  field: FieldConfig;
  handleChange: (name: string, value: string) => void;
  isThisSelectOpen: boolean;
  placeholderText: string;
  setOpenSelect: (name: string | null) => void;
  values: Record<string, string>;
};

export const FormCardSelectField = ({
  field,
  handleChange,
  isThisSelectOpen,
  placeholderText,
  setOpenSelect,
  values,
}: FormCardSelectFieldProps) => {
  const shouldUseCustomDropdown = (field.options?.length || 0) > 3;
  const shouldUseShortCustomDropdown =
    (field.options?.length || 0) > 0 && !shouldUseCustomDropdown;

  if (shouldUseCustomDropdown || shouldUseShortCustomDropdown) {
    const currentValue = values[field.name] || '';
    const isShortSelect = shouldUseShortCustomDropdown;
    const dropdownOptions =
      isShortSelect && !field.suppressPlaceholderOption
        ? [{ value: '', label: placeholderText }, ...(field.options ?? [])]
        : (field.options ?? []);
    const selectedOption = dropdownOptions.find(
      (option) => option.value === currentValue,
    );
    const selectedIndex = Math.max(
      0,
      dropdownOptions.findIndex((option) => option.value === currentValue),
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
          value={currentValue}
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
          role={isShortSelect ? 'combobox' : undefined}
          aria-expanded={isShortSelect ? isThisSelectOpen : undefined}
          aria-haspopup={isShortSelect ? 'listbox' : undefined}
          onKeyDown={
            isShortSelect
              ? (event) =>
                  handleShortSelectKeyboard({
                    event,
                    isOpen: isThisSelectOpen,
                    fieldName: field.name,
                    selectedIndex,
                    options: dropdownOptions,
                    handleChange,
                    setOpenSelect,
                  })
              : undefined
          }
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
            <span className="formcard-arrow-down" />
            <span className="formcard-arrow-up" />
          </span>
        </div>
        {isThisSelectOpen && (
          <div
            className={`formcard-multiselect-dropdown ${
              isShortSelect ? 'formcard-short-select' : ''
            }`}
            role={isShortSelect ? 'listbox' : undefined}
          >
            {dropdownOptions.map((opt) => {
              const isSelected = currentValue === opt.value;
              return (
                <div
                  key={opt.value || 'select-placeholder'}
                  className={`formcard-multiselect-option ${
                    isShortSelect ? 'formcard-short-select-option' : ''
                  } ${isSelected ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleChange(field.name, opt.value);
                    setOpenSelect(null);
                  }}
                  role={isShortSelect ? 'option' : undefined}
                  aria-selected={isShortSelect ? isSelected : undefined}
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
        id={field.name}
        name={field.name}
        value={values[field.name] ?? ''}
        required={field.required}
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
        <span className="formcard-arrow-down" />
        <span className="formcard-arrow-up" />
      </span>
    </div>
  );
};
