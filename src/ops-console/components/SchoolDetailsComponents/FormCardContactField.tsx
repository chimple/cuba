import React, { useId, useState } from 'react';
import { t } from 'i18next';
import { PhoneInput } from 'react-international-phone';
import type { FieldConfig } from './FormCard';

type Props = {
  field: FieldConfig;
  handleChange: (name: string, value: string, dialCode?: string) => void;
  values: Record<string, string>;
};

export const FormCardPhoneInput = ({ field, handleChange, values }: Props) => {
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div
      id={`formcard-phone-input-${idPrefix}`}
      className="formcard-phone-input"
    >
      <PhoneInput
        defaultCountry="in"
        hideDropdown={field.kind === 'contact'}
        value={values[field.name] ?? ''}
        onChange={(value, meta) => {
          const digits = value.replace(/\D/g, '');
          const dialCode = meta?.country?.dialCode ?? '';
          const isCountryCodeOnly = dialCode !== '' && digits === dialCode;
          handleChange(field.name, isCountryCodeOnly ? '' : value, dialCode);
        }}
        disabled={field.disabled}
        disableCountryGuess
        inputClassName="formcard-phone-input-inner"
        inputProps={{
          id: field.name,
          name: field.name,
          required: field.required,
          placeholder: field.placeholder ?? '',
          onKeyDown: (event) => {
            const input = event.currentTarget;
            const selectionStart = input.selectionStart ?? 0;
            const prefixMatch = input.value.match(/^\+\d+\s*/);
            const prefixLength = prefixMatch ? prefixMatch[0].length : 0;
            if (
              selectionStart <= prefixLength &&
              (event.key === 'Backspace' || event.key === 'Delete')
            ) {
              event.preventDefault();
            }
          },
        }}
      />
    </div>
  );
};

export const FormCardContactField = ({
  field,
  handleChange,
  values,
}: Props) => {
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>(
    'phone',
  );
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div
      id={`formcard-contact-field-${idPrefix}`}
      className="formcard-contact-field"
    >
      <label
        id={`formcard-label-contact-${idPrefix}`}
        htmlFor={field.name}
        className="formcard-label"
      >
        {t(field.label)}
        {field.required && (
          <span
            id={`formcard-required-contact-${idPrefix}`}
            className="formcard-required"
          >
            {' '}
            *
          </span>
        )}
      </label>
      <div
        id={`formcard-contact-method-${idPrefix}`}
        className="formcard-contact-method"
        role="group"
        aria-label={String(t('Contact method'))}
      >
        {(['phone', 'email'] as const).map((method) => (
          <button
            key={method}
            type="button"
            aria-pressed={contactMethod === method}
            onClick={() => {
              if (contactMethod === method) return;
              setContactMethod(method);
              handleChange(field.name, '');
            }}
          >
            {t(method === 'phone' ? 'Phone' : 'Email')}
          </button>
        ))}
      </div>
      {contactMethod === 'phone' ? (
        <FormCardPhoneInput
          field={field}
          handleChange={handleChange}
          values={values}
        />
      ) : (
        <input
          id={field.name}
          name={field.name}
          type="email"
          value={values[field.name] ?? ''}
          required={field.required}
          disabled={field.disabled}
          placeholder={String(t('Enter email address'))}
          onChange={(event) => handleChange(field.name, event.target.value)}
        />
      )}
    </div>
  );
};
