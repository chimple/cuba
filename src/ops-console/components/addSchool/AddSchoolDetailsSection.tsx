import React from 'react';
import { Box, FormLabel, Grid, TextField, Typography } from '@mui/material';
import { t } from 'i18next';
import type { EnumType } from '../../../common/constants';
import DropdownField from '../DropdownField';

const SCHOOL_LOGIN_TYPE_OPTIONS: {
  label: string;
  value: EnumType<'login_type'>;
}[] = [
  { label: t('Parent Phone Number'), value: 'parent_phone_number' },
  { label: t('Student ID'), value: 'student_id' },
];

export const AddSchoolDetailsSection = ({
  errorMessage,
  handleUdiseChange,
  isLanguageLoading,
  language,
  languages,
  schoolLoginType,
  schoolModelDisabled,
  schoolModelOptions,
  schoolModel,
  schoolName,
  setLanguage,
  setSchoolLoginType,
  setSchoolModel,
  setSchoolName,
  showSchoolLoginType,
  udise,
}: {
  errorMessage: string;
  handleUdiseChange: (value: string) => void;
  isLanguageLoading: boolean;
  language: string;
  languages: { id: string; name: string }[];
  schoolLoginType: EnumType<'login_type'> | '';
  schoolModelDisabled: boolean;
  schoolModelOptions: { label: string; value: string }[];
  schoolModel: string;
  schoolName: string;
  setLanguage: (value: string) => void;
  setSchoolLoginType: (value: EnumType<'login_type'>) => void;
  setSchoolModel: (value: string) => void;
  setSchoolName: (value: string) => void;
  showSchoolLoginType: boolean;
  udise: string;
}) => {
  const handleSchoolLoginTypeChange = (value: string): void => {
    const loginType = SCHOOL_LOGIN_TYPE_OPTIONS.find(
      (option) => option.value === value,
    )?.value;
    if (loginType) setSchoolLoginType(loginType);
  };

  return (
    <Box className="add-school-section-box">
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ marginBottom: '16px', fontSize: '1rem', color: '#111827' }}
      >
        {t('School Details')}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4.5 }}>
          <FormLabel sx={{ color: '#111827' }}>
            {t('School Name')} <span className="add-school-requird">*</span>
          </FormLabel>
          <TextField
            fullWidth
            size="small"
            value={schoolName}
            placeholder={t('School Name') ?? ''}
            onChange={(event) => setSchoolName(event.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4.5 }}>
          <FormLabel sx={{ color: '#111827' }}>
            {t('School ID (UDISE)')}{' '}
            <span className="add-school-requird">*</span>
          </FormLabel>
          <TextField
            fullWidth
            size="small"
            value={udise}
            inputProps={{
              maxLength: 11,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            placeholder={t('Enter 11 digit UDISE code') ?? ''}
            onChange={(event) => handleUdiseChange(event.target.value)}
          />
          {errorMessage && (
            <div className="class-form-error">{errorMessage}</div>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <DropdownField
            label={t('School') + ' ' + t('Model')}
            required
            value={schoolModel}
            onChange={setSchoolModel}
            placeholder={t('Select Model') ?? ''}
            options={schoolModelOptions}
            disabled={schoolModelDisabled}
            openDirection="down"
          />
        </Grid>

        {showSchoolLoginType && (
          <Grid size={{ xs: 12, md: 4.5 }}>
            <DropdownField
              label={t('School Login Type')}
              required
              value={schoolLoginType}
              onChange={handleSchoolLoginTypeChange}
              placeholder={t('Select School Login Type') ?? ''}
              options={SCHOOL_LOGIN_TYPE_OPTIONS}
            />
          </Grid>
        )}

        {!isLanguageLoading && (
          <Grid size={{ xs: 12, md: 4.5 }}>
            <DropdownField
              label={t('Language')}
              value={language}
              onChange={setLanguage}
              options={languages.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
              placeholder={t('Select Language') ?? ''}
              openDirection="down"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
