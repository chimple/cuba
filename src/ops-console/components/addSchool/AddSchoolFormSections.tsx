import React from 'react';
import { Box, FormLabel, Grid, TextField, Typography } from '@mui/material';
import { t } from 'i18next';
import DropdownField from '../DropdownField';

export const AddSchoolDetailsSection = ({
  errorMessage,
  handleUdiseChange,
  schoolModel,
  schoolName,
  setSchoolModel,
  setSchoolName,
  udise,
}: {
  errorMessage: string;
  handleUdiseChange: (value: string) => void;
  schoolModel: string;
  schoolName: string;
  setSchoolModel: (value: string) => void;
  setSchoolName: (value: string) => void;
  udise: string;
}) => (
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
          {t('School ID (UDISE)')} <span className="add-school-requird">*</span>
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
        {errorMessage && <div className="class-form-error">{errorMessage}</div>}
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <DropdownField
          label={t('School') + ' ' + t('Model')}
          required
          value={schoolModel}
          onChange={setSchoolModel}
          placeholder={t('Select Model') ?? ''}
          options={[
            { label: t('At Home'), value: 'at_home' },
            { label: t('At School'), value: 'at_school' },
            { label: t('Hybrid'), value: 'hybrid' },
          ]}
          openDirection="down"
        />
      </Grid>
    </Grid>
  </Box>
);

export const AddSchoolAddressSection = ({
  address,
  blocks,
  districts,
  handleAddressChange,
  isBlocksLoading,
  isDistrictsLoading,
  isStatesLoading,
  states,
}: {
  address: {
    state: string;
    district: string;
    block: string;
    cluster: string;
    link: string;
  };
  blocks: string[];
  districts: string[];
  handleAddressChange: (name: string, value: string) => void;
  isBlocksLoading: boolean;
  isDistrictsLoading: boolean;
  isStatesLoading: boolean;
  states: string[];
}) => (
  <Box className="add-school-section-box">
    <Typography
      variant="subtitle2"
      fontWeight="bold"
      sx={{ marginBottom: '16px', fontSize: '1rem', color: '#111827' }}
    >
      {t('Address & Location')}
    </Typography>

    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <DropdownField
          label={t('State')}
          required
          value={address.state}
          onChange={(value) => handleAddressChange('state', value)}
          options={states}
          placeholder={t('Select State') ?? ''}
          loading={isStatesLoading}
          disabled={isStatesLoading}
          openDirection="down"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <DropdownField
          label={t('District')}
          required
          value={address.district}
          onChange={(value) => handleAddressChange('district', value)}
          options={districts}
          placeholder={t('Select District') ?? ''}
          disabled={!address.state}
          loading={isDistrictsLoading}
          openDirection="down"
        />
      </Grid>
    </Grid>

    <Grid container spacing={2} sx={{ marginTop: '8px' }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <DropdownField
          label={t('Block')}
          value={address.block}
          onChange={(value) => handleAddressChange('block', value)}
          options={blocks}
          placeholder={t('Select Block') ?? ''}
          disabled={!address.district}
          loading={isBlocksLoading}
          openDirection="down"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <FormLabel sx={{ fontSize: '1rem', color: '#111827', fontWeight: 500 }}>
          {t('Cluster')}
        </FormLabel>
        <TextField
          fullWidth
          placeholder={t('Enter Cluster') ?? ''}
          value={address.cluster}
          onChange={(event) =>
            handleAddressChange('cluster', event.target.value)
          }
          variant="outlined"
          size="small"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <FormLabel sx={{ fontSize: '1rem', color: '#111827', fontWeight: 500 }}>
          {t('Location link')}
        </FormLabel>
        <TextField
          fullWidth
          value={address.link}
          onChange={(event) => handleAddressChange('link', event.target.value)}
          variant="outlined"
          size="small"
        />
      </Grid>
    </Grid>
  </Box>
);

export const AddSchoolProgramSection = ({
  fieldCoordinator,
  fieldCoordinators,
  lockDropdowns,
  program,
  programs,
  setFieldCoordinator,
  setProgram,
}: {
  fieldCoordinator: any;
  fieldCoordinators: any[];
  lockDropdowns: boolean;
  program: any;
  programs: any[];
  setFieldCoordinator: (value: any) => void;
  setProgram: (value: any) => void;
}) => (
  <Box className="add-school-dropdown-container">
    <Typography variant="h6" className="add-school-dropdown-title">
      {t('Program Details')}
    </Typography>

    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 3.5 }}>
        <DropdownField
          label={t('Program Name')}
          required
          value={program?.id || ''}
          onChange={(value) => {
            const selected = programs.find((item) => item.id === value);
            setProgram(selected || null);
          }}
          options={programs.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          placeholder={t('Select Program') ?? ''}
          disabled={lockDropdowns}
          openDirection="down"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3.5 }}>
        <DropdownField
          label={t('Field Coordinator')}
          required
          value={fieldCoordinator?.id || ''}
          onChange={(value) => {
            const selected = fieldCoordinators.find(
              (item) => item.id === value,
            );
            setFieldCoordinator(selected || null);
          }}
          options={fieldCoordinators.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          placeholder={t('Select Field Coordinator') ?? ''}
          disabled={lockDropdowns}
          openDirection="down"
        />
      </Grid>
    </Grid>
  </Box>
);
