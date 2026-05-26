import React, { useMemo, useRef } from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { getTodayDateValue } from '../../hooks/campaignSetupFormHelpers';
import { CampaignSelectPlaceholder } from './CampaignPlaceholder';
import { requiredLabel } from './constants';
import { CampaignDetailsSectionProps } from './types';
import './CampaignDetailsSection.css';

export const CampaignDetailsSection: React.FC<CampaignDetailsSectionProps> = ({
  form,
  managers,
  onTextChange,
  onSelectChange,
  fieldError,
}) => {
  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);
  const today = getTodayDateValue();
  const endDateMin =
    form.startDate && form.startDate > today ? form.startDate : today;
  const managerNameById = useMemo(
    () => new Map(managers.map((manager) => [manager.id, manager.name])),
    [managers],
  );
  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;

    input.focus();

    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }
  };

  return (
    <Box className="campaign-setup-section">
      <Typography variant="h6" className="campaign-setup-section-title">
        Campaign Details
      </Typography>
      <Typography className="campaign-setup-section-copy">
        Provide the campaign name, assign a manager, and set the timeline.
      </Typography>
      <Box className="campaign-setup-grid campaign-setup-details-grid">
        <Box className="campaign-setup-field campaign-setup-full-width">
          <Typography className="campaign-setup-label">
            {requiredLabel('Campaign Name')}
          </Typography>
          <TextField
            value={form.campaignName}
            onChange={onTextChange('campaignName')}
            error={!!fieldError('campaignName')}
            helperText={fieldError('campaignName')}
            inputProps={{ 'aria-label': 'Campaign Name' }}
            size="small"
          />
        </Box>
        <Box className="campaign-setup-field campaign-setup-half-width">
          <Typography className="campaign-setup-label">
            {requiredLabel('Campaign Manager')}
          </Typography>
          <FormControl fullWidth error={!!fieldError('managerId')}>
            <Select
              value={form.managerId}
              onChange={onSelectChange('managerId')}
              displayEmpty
              renderValue={(value) =>
                CampaignSelectPlaceholder(
                  value,
                  'Select Campaign Manager',
                  managerNameById.get(value),
                )
              }
              size="small"
            >
              <MenuItem value="" disabled>
                Select Campaign Manager
              </MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager.id} value={manager.id}>
                  {manager.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{fieldError('managerId')}</FormHelperText>
          </FormControl>
        </Box>
        <Box className="campaign-setup-field campaign-setup-start-date-field">
          <Typography className="campaign-setup-label">
            {requiredLabel('Start Date')}
          </Typography>
          <TextField
            type="date"
            value={form.startDate}
            onChange={onTextChange('startDate')}
            error={!!fieldError('startDate')}
            helperText={fieldError('startDate')}
            inputRef={startDateInputRef}
            inputProps={{ 'aria-label': 'Start Date', min: today }}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  className="campaign-setup-date-adornment"
                >
                  <IconButton
                    type="button"
                    aria-label="Open start date picker"
                    className="campaign-setup-date-button"
                    onClick={() => openDatePicker(startDateInputRef.current)}
                    edge="end"
                    size="small"
                  >
                    <CalendarToday className="campaign-setup-date-icon" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Box>
        <Box className="campaign-setup-field campaign-setup-end-date-field">
          <Typography className="campaign-setup-label">
            {requiredLabel('End Date')}
          </Typography>
          <TextField
            type="date"
            value={form.endDate}
            onChange={onTextChange('endDate')}
            error={!!fieldError('endDate')}
            helperText={fieldError('endDate')}
            inputRef={endDateInputRef}
            inputProps={{ 'aria-label': 'End Date', min: endDateMin }}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  className="campaign-setup-date-adornment"
                >
                  <IconButton
                    type="button"
                    aria-label="Open end date picker"
                    className="campaign-setup-date-button"
                    onClick={() => openDatePicker(endDateInputRef.current)}
                    edge="end"
                    size="small"
                  >
                    <CalendarToday className="campaign-setup-date-icon" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );
};
