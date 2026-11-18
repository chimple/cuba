import React, { useId } from 'react';
import { t } from 'i18next';
import type { FieldConfig, MessageConfig } from './FormCard';
import { FormCardField } from './FormCardField';

type Props = {
  title: string;
  submitLabel: string;
  fields: FieldConfig[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  message?: MessageConfig | string;
  disabled: boolean;
  isEditMode: boolean;
  isDirty: boolean;
  onFieldChange: (name: string, value: string, dialCode?: string) => void;
  openSelect: string | null;
  setOpenSelect: (name: string | null) => void;
  values: Record<string, string>;
  firstFieldError?: string;
  selectedExistingStudentId?: string | null;
  children?: React.ReactNode;
};

export const FormCardContent = ({
  title,
  submitLabel,
  fields,
  onClose,
  onSubmit,
  message,
  disabled,
  isEditMode,
  isDirty,
  onFieldChange,
  openSelect,
  setOpenSelect,
  values,
  firstFieldError,
  selectedExistingStudentId,
  children,
}: Props) => {
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const getId = (name: string): string => `${name}-${idPrefix}`;
  const hideProfileFields = Boolean(selectedExistingStudentId);
  const visibleFields = hideProfileFields
    ? fields.filter(
        (field) => field.kind === 'contact' || field.name === 'class',
      )
    : fields;
  const getFieldClassName = (field: FieldConfig) => {
    const col = field.column ?? 2;
    if (col === 0) return 'formcard-form-group formcard-col-left';
    if (col === 1) return 'formcard-form-group formcard-col-right';
    return 'formcard-form-group formcard-col-full';
  };

  const contactIndex = visibleFields.findIndex(
    (field) => field.kind === 'contact',
  );
  const classIndex = visibleFields.findIndex((field) => field.name === 'class');
  const childrenAfterFieldIndex =
    contactIndex < 0
      ? -1
      : classIndex > contactIndex
        ? classIndex
        : contactIndex;

  const renderMessage = () => {
    if (!message) return null;
    const messageConfig: MessageConfig =
      typeof message === 'string' ? { text: message, type: 'info' } : message;
    const messageType = messageConfig.type || 'info';
    return (
      <div
        id={getId('formcard-message-wrapper')}
        className="formcard-message-wrapper"
      >
        <div
          id={getId(`formcard-message-${messageType}`)}
          className={`formcard-message formcard-message-${messageType}`}
        >
          {t(messageConfig.text)}
        </div>
      </div>
    );
  };

  return (
    <div
      id={getId('formcard-modal-backdrop')}
      className="formcard-modal-backdrop"
    >
      <div id={getId('formcard-modal')} className="formcard-modal">
        <div
          id={getId('formcard-modal-header')}
          className="formcard-modal-header"
        >
          <h2 id={getId('formcard-title')} className="formcard-title">
            {title}
          </h2>
          <button
            id={getId('formcard-close-button')}
            type="button"
            className="formcard-close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form
          id={getId('formcard-modal-body')}
          onSubmit={onSubmit}
          className="formcard-modal-body"
        >
          <div id={getId('formcard-form-grid')} className="formcard-form-grid">
            {visibleFields.map((field, index) => (
              <React.Fragment key={field.name}>
                <div
                  id={getId(`formcard-form-group-${field.name}`)}
                  className={getFieldClassName(field)}
                >
                  {field.kind !== 'contact' && (
                    <label
                      id={getId(`formcard-label-${field.name}`)}
                      htmlFor={field.name}
                      className="formcard-label"
                    >
                      {t(field.label)}
                      {field.required && (
                        <span
                          id={getId(`formcard-required-${field.name}`)}
                          className="formcard-required"
                        >
                          {' '}
                          *
                        </span>
                      )}
                    </label>
                  )}
                  <FormCardField
                    field={field}
                    handleChange={onFieldChange}
                    openSelect={openSelect}
                    setOpenSelect={setOpenSelect}
                    values={values}
                  />
                </div>
                {index === childrenAfterFieldIndex && children}
              </React.Fragment>
            ))}
          </div>
          {childrenAfterFieldIndex < 0 && children}
          {!hideProfileFields && firstFieldError && (
            <div
              id={getId('formcard-message-wrapper-first-field-error')}
              className="formcard-message-wrapper"
            >
              <div
                id={getId('formcard-message-error-first-field-error')}
                className="formcard-message formcard-message-error"
                role="alert"
              >
                {t(firstFieldError)}
              </div>
            </div>
          )}
          {renderMessage()}
          <div
            id={getId('formcard-modal-footer')}
            className="formcard-modal-footer"
          >
            <button
              id={getId('formcard-btn-text-cancel')}
              type="button"
              className="formcard-btn formcard-btn-text"
              onClick={onClose}
            >
              {t('Cancel')}
            </button>
            <button
              id={getId('formcard-btn-primary-submit')}
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
