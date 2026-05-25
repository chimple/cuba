import React from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { requiredLabel } from './constants';
import { CampaignDetailsSectionProps } from './types';
import './CampaignDetailsSection.css';

export const CampaignDetailsSection: React.FC<CampaignDetailsSectionProps> = ({
  form,
  managers,
  onTextChange,
  onSelectChange,
  fieldError,
}) => (
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
          inputProps={{ 'aria-label': 'Start Date' }}
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
          inputProps={{ 'aria-label': 'End Date' }}
          size="small"
        />
      </Box>
    </Box>
  </Box>
);
