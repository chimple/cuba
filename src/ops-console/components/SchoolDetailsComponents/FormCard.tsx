import React, { useEffect, useState, useMemo } from 'react';
import './FormCard.css';
import 'react-international-phone/style.css';
import { FormCardContent } from './FormCardContent';

export type FieldKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'contact'
  | 'select'
  | 'chips';
export type FieldColumn = 0 | 1 | 2; // 0 = left, 1 = right, 2 = full row

export interface FieldConfig {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  suppressPlaceholderOption?: boolean;
  allowClear?: boolean;
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
  onFieldChange?: (name: string, value: string) => void;
  selectedExistingStudentId?: string | null;
  children?: React.ReactNode;
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
  onFieldChange,
  selectedExistingStudentId,
  children,
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
    onFieldChange?.(name, value);
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
    if (disabled) return;
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

  const firstFieldError = Object.values(fieldErrors)[0];

  return (
    <FormCardContent
      title={title}
      submitLabel={submitLabel}
      fields={fields}
      onClose={onClose}
      onSubmit={handleSubmit}
      message={message}
      disabled={disabled}
      isEditMode={isEditMode}
      isDirty={isDirty}
      onFieldChange={handleChange}
      openSelect={openSelect}
      setOpenSelect={setOpenSelect}
      values={values}
      firstFieldError={firstFieldError}
      selectedExistingStudentId={selectedExistingStudentId}
    >
      {children}
    </FormCardContent>
  );
};

export default FormCard;
