import React from 'react';
import { t } from 'i18next';

type ClassFormFieldsProps = {
  errorMessage: string;
  formValues: {
    grade: string;
    section: string;
    whatsapp_invite_link: string;
  };
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleSubmit: () => void;
  isFormValid: boolean;
  loading: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  saving: boolean;
};

export const ClassFormTitle = ({
  formValues,
  mode,
}: Pick<ClassFormFieldsProps, 'formValues' | 'mode'>) => (
  <div className="class-form-title">
    {mode === 'edit'
      ? `Class : ${formValues.grade} ${formValues.section}`
      : t('Create Class')}
  </div>
);

export const ClassFormGradeFields = ({
  formValues,
  handleChange,
}: Pick<ClassFormFieldsProps, 'formValues' | 'handleChange'>) => (
  <div className="class-form-row">
    <div className="class-form-group">
      <label>
        {t('Grade')}
        <span className="class-form-group-required-star"> *</span>
      </label>
      <input
        name="grade"
        type="number"
        min={1}
        max={10}
        value={formValues.grade}
        onChange={handleChange}
        placeholder={t('Enter Grade') ?? ''}
      />
    </div>
    <div className="class-form-group">
      <label>{t('Class Section')}</label>
      <input
        name="section"
        type="text"
        value={formValues.section}
        onChange={handleChange}
        placeholder={t('Enter Class Section') ?? ''}
      />
    </div>
  </div>
);

export const ClassFormFooterFields = ({
  errorMessage,
  formValues,
  handleChange,
  handleSubmit,
  isFormValid,
  loading,
  mode,
  onClose,
  saving,
}: ClassFormFieldsProps) => (
  <>
    {errorMessage && <div className="class-form-error">{errorMessage}</div>}
    <div className="class-form-group class-form-full-width">
      <label>WhatsApp Invite Link</label>
      <input
        name="whatsapp_invite_link"
        value={formValues.whatsapp_invite_link}
        onChange={handleChange}
        placeholder={t('Enter WhatsApp Invite Link') ?? ''}
      />
    </div>
    <div className="class-form-button-row">
      <button className="class-form-cancel-btn" onClick={onClose}>
        {t('Cancel')}
      </button>
      <button
        className="class-form-save-btn"
        onClick={handleSubmit}
        disabled={!isFormValid || loading || saving}
      >
        {saving
          ? t('Saving') + '...'
          : mode === 'edit'
            ? t('Save')
            : t('Create Class')}
      </button>
    </div>
  </>
);
