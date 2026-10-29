import React, { useEffect, useState, useMemo } from 'react';
import './FormCard.css';
import 'react-international-phone/style.css';
import { t } from 'i18next';
import { FormCardField } from './FormCardField';

export type FieldKind = 'text' | 'email' | 'phone' | 'select' | 'chips';
export type FieldColumn = 0 | 1 | 2; // 0 = left, 1 = right, 2 = full row

export interface FieldConfig {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  suppressPlaceholderOption?: boolean;
  options?: { value: string; label: string }[];
  column?: FieldColumn;
  multi?: boolean;
  disabled?: boolean;
  nationalPhoneDigits?: number;
}

export type MessageType = 'error' | 'warning' | 'info' | 'success';

export interface MessageConfig {
  text: string;
  type?: MessageType;
}

interface EntityModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  fields: FieldConfig[];
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  message?: MessageConfig | string;
  initialValues?: Record<string, string>;
  disabled?: boolean;
}

const FormCard: React.FC<EntityModalProps> = ({
  open,
  title,
  submitLabel,
  fields,
  onClose,
  onSubmit,
  message,
  initialValues,
  disabled = false,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [phoneDialCodes, setPhoneDialCodes] = useState<Record<string, string>>(
    {},
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialSnapshot, setInitialSnapshot] = useState<
    Record<string, string>
  >({});

  const isEditMode = Boolean(initialValues);

  const isDirty = useMemo(() => {
    if (!isEditMode) return true; // Add form → always enabled

    return Object.keys(initialSnapshot).some(
      (key) => initialSnapshot[key] !== values[key],
    );
  }, [isEditMode, initialSnapshot, values]);

  useEffect(() => {
    if (!open) return;

    const init: Record<string, string> = {};

    fields.forEach((f) => {
      init[f.name] = initialValues?.[f.name] ?? '';
    });

    setValues(init);
    if (isEditMode) {
      setInitialSnapshot(init);
    } else {
      setInitialSnapshot({});
    }
    setOpenSelect(null);
    setPhoneDialCodes({});
    setFieldErrors({});
  }, [open, fields, initialValues, isEditMode]);

  if (!open) return null;

  const handleChange = (name: string, value: string, dialCode?: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (dialCode !== undefined) {
      setPhoneDialCodes((prev) => ({ ...prev, [name]: dialCode }));
    }
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const getNationalPhoneDigits = (
    name: string,
    value: string,
    expectedDigits: number,
  ) => {
    const digits = value.replace(/\D/g, '');
    const dialCode = phoneDialCodes[name] ?? '';
    // PhoneInput includes the selected dial code; it must not count toward the
    // configured national-number length.
    const includesDialCode =
      dialCode &&
      digits.startsWith(dialCode) &&
      (value.trim().startsWith('+') || digits.length > expectedDigits);
    return includesDialCode ? digits.slice(dialCode.length) : digits;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) {
      return;
    }
    const errors = fields.reduce<Record<string, string>>((result, field) => {
      if (field.kind !== 'phone' || !field.nationalPhoneDigits) return result;

      const nationalDigits = getNationalPhoneDigits(
        field.name,
        values[field.name] ?? '',
        field.nationalPhoneDigits,
      );
      if (nationalDigits.length !== field.nationalPhoneDigits) {
        result[field.name] =
          `Phone number must be ${field.nationalPhoneDigits} digits.`;
      }
      return result;
    }, {});
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    onSubmit(values);
  };

  const getFieldClassName = (field: FieldConfig) => {
    const col = field.column ?? 2;
    if (col === 0) return 'formcard-form-group formcard-col-left';
    if (col === 1) return 'formcard-form-group formcard-col-right';
    return 'formcard-form-group formcard-col-full';
  };

  const renderMessage = () => {
    if (!message) return null;

    const messageConfig: MessageConfig =
      typeof message === 'string' ? { text: message, type: 'info' } : message;

    const messageType = messageConfig.type || 'info';

    return (
      <div className="formcard-message-wrapper">
        <div className={`formcard-message formcard-message-${messageType}`}>
          {t(messageConfig.text)}
        </div>
      </div>
    );
  };

  const firstFieldError = Object.values(fieldErrors)[0];

  return (
    <div className="formcard-modal-backdrop">
      <div className="formcard-modal">
        <div className="formcard-modal-header">
          <h2 className="formcard-title">{title}</h2>
          <button
            type="button"
            className="formcard-close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="formcard-modal-body">
          <div className="formcard-form-grid">
            {fields.map((field) => (
              <div key={field.name} className={getFieldClassName(field)}>
                <label htmlFor={field.name} className="formcard-label">
                  {t(field.label)}
                  {field.required && (
                    <span className="formcard-required"> *</span>
                  )}
                </label>
                <FormCardField
                  field={field}
                  handleChange={handleChange}
                  openSelect={openSelect}
                  setOpenSelect={setOpenSelect}
                  values={values}
                />
              </div>
            ))}
          </div>
          {firstFieldError && (
            <div className="formcard-message-wrapper">
              <div
                className="formcard-message formcard-message-error"
                role="alert"
              >
                {t(firstFieldError)}
              </div>
            </div>
          )}
          {renderMessage()}
          <div className="formcard-modal-footer">
            <button
              type="button"
              className="formcard-btn formcard-btn-text"
              onClick={onClose}
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              className="formcard-btn formcard-btn-primary"
              disabled={disabled || (isEditMode && !isDirty)}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormCard;
