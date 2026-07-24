import React from 'react';
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import { PhoneInput } from 'react-international-phone';

type NewUserFormProps = {
  form: {
    name: string;
    phone: string;
    email: string;
    role: string;
  };
  handleCancel: () => void;
  handleInputChange: (
    field: 'name' | 'email',
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePhoneChange: (
    value: string,
    meta?: { country?: { dialCode?: string } },
  ) => void;
  handleRoleChange: (event: SelectChangeEvent<string>) => void;
  handleSubmit: (event: React.FormEvent) => void;
  isMobile: boolean;
  roles: { label: string; value: string }[];
};

export const NewUserForm = ({
  form,
  handleCancel,
  handleInputChange,
  handlePhoneChange,
  handleRoleChange,
  handleSubmit,
  isMobile,
  roles,
}: NewUserFormProps) => (
  <form onSubmit={handleSubmit} autoComplete="off">
    <Grid
      container
      spacing={isMobile ? 1.5 : 2}
      className="ops-new-user-form_grid"
    >
      <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
        <Typography className="ops-new-user-form_label">{t('Name')}</Typography>
        <TextField
          fullWidth
          size="small"
          value={form.name}
          onChange={handleInputChange('name')}
        />
      </Grid>
      <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
        <Typography className="ops-new-user-form_label">
          {t('Phone Number')}
        </Typography>
        <PhoneInput
          defaultCountry="in"
          value={form.phone}
          onChange={handlePhoneChange}
          disableCountryGuess
          className="new-user-page-phone-input"
          inputClassName="w-full"
          inputProps={{
            onKeyDown: (event) => {
              const input = event.currentTarget as HTMLInputElement;
              const selectionStart = input.selectionStart ?? 0;
              const prefixMatch = input.value.match(/^\+\d+\s*/);
              const prefixLength = prefixMatch ? prefixMatch[0].length : 0;
              if (
                selectionStart <= prefixLength &&
                ['Backspace', 'Delete'].includes(event.key)
              ) {
                event.preventDefault();
              }
            },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
        <Typography className="ops-new-user-form_label">
          {t('Email ID')}
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={form.email}
          onChange={handleInputChange('email')}
        />
      </Grid>
      <Grid size={{ xs: 12 }} className="ops-new-user-form_group">
        <Typography className="ops-new-user-form_label">
          {t('Roles')}
        </Typography>
        <Select
          fullWidth
          size="small"
          displayEmpty
          value={form.role}
          onChange={handleRoleChange}
          renderValue={(selected) =>
            selected
              ? roles.find((role) => role.value === selected)?.label
              : 'Select Role'
          }
        >
          <MenuItem disabled value="">
            {t('Select Role')}
          </MenuItem>
          {roles.map((role) => (
            <MenuItem key={role.value} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </Grid>
    <Box className="ops-new-user-form-actions">
      <Button
        type="button"
        variant="text"
        onClick={handleCancel}
        className="ops-new-user-form-actions_button--cancel"
      >
        {t('Cancel')}
      </Button>
      <Button
        type="submit"
        variant="contained"
        className="ops-new-user-form-actions_button--save"
      >
        {t('Save')}
      </Button>
    </Box>
  </form>
);
