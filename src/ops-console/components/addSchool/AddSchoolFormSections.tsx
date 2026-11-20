import React from 'react';
import { Box, FormLabel, Grid, TextField, Typography } from '@mui/material';
import { t } from 'i18next';
import DropdownField from '../DropdownField';

type NamedOption = { id: string; name: string };
type ProgramOption = NamedOption & { model?: string };

export const AddSchoolAddressSection = ({
  address,
  blocks,
  districts,
  handleAddressChange,
  isBlocksLoading,
  isDistrictsLoading,
  isStatesLoading,
  requireBlock,
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
  requireBlock: boolean;
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
          required={requireBlock}
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
  fieldCoordinator: NamedOption | null;
  fieldCoordinators: NamedOption[];
  lockDropdowns: boolean;
  program: ProgramOption | null;
  programs: ProgramOption[];
  setFieldCoordinator: (value: NamedOption | null) => void;
  setProgram: (value: ProgramOption | null) => void;
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
