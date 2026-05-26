import React from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Radio,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  OBJECTIVE_DESCRIPTION,
  OBJECTIVE_OPTIONS,
  renderSelectPlaceholder,
  requiredLabel,
  TARGET_TYPE_LABEL_BY_VALUE,
  TARGET_TYPE_OPTIONS,
} from './constants';
import { ObjectiveGoalSectionProps } from './types';
import './ObjectiveGoalSection.css';

export const ObjectiveGoalSection: React.FC<ObjectiveGoalSectionProps> = ({
  form,
  onObjectiveChange,
  onSelectChange,
  onNumericChange,
  fieldError,
}) => (
  <Box className="campaign-setup-section">
    <Typography variant="h6" className="campaign-setup-section-title">
      Objective & Goal
    </Typography>
    <Typography className="campaign-setup-section-copy">
      Select the type of campaign and define its target.
    </Typography>

    <Box className="campaign-setup-field campaign-setup-objective-field campaign-setup-full-width">
      <Typography className="campaign-setup-label">
        {requiredLabel('Campaign Objective')}
      </Typography>
      <Box className="campaign-setup-objective-list">
        {OBJECTIVE_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            className={`campaign-setup-objective ${
              form.objective === option.value
                ? 'campaign-setup-objective-selected'
                : ''
            }`}
            onClick={() => onObjectiveChange(option.value)}
          >
            <Radio
              checked={form.objective === option.value}
              value={option.value}
              size="small"
            />
            <span>
              <strong>{option.label}</strong>
              <small>{OBJECTIVE_DESCRIPTION[option.value]}</small>
            </span>
          </button>
        ))}
      </Box>
      {fieldError('objective') && (
        <FormHelperText error>{fieldError('objective')}</FormHelperText>
      )}
    </Box>

    <Box className="campaign-setup-grid campaign-setup-target-grid">
      {form.objective === 'homework_campaign' && (
        <>
          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label">
              {requiredLabel('Target Type')}
            </Typography>
            <FormControl fullWidth error={!!fieldError('targetType')}>
              <Select
                value={form.targetType}
                onChange={onSelectChange('targetType')}
                displayEmpty
                renderValue={(value) =>
                  renderSelectPlaceholder(
                    value,
                    'Select Target Type',
                    TARGET_TYPE_LABEL_BY_VALUE.get(value),
                  )
                }
                size="small"
              >
                <MenuItem value="" disabled>
                  Select Target Type
                </MenuItem>
                {TARGET_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{fieldError('targetType')}</FormHelperText>
            </FormControl>
          </Box>
          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label">
              {requiredLabel('Target Value')}
            </Typography>
            <TextField
              type="number"
              value={form.targetValue}
              onChange={onNumericChange('targetValue')}
              error={!!fieldError('targetValue')}
              helperText={fieldError('targetValue')}
              inputProps={{ min: 1, max: 100, 'aria-label': 'Target Value' }}
              size="small"
            />
          </Box>
        </>
      )}

      {form.objective === 'homepage_learning_pathway_campaign' && (
        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">
            {requiredLabel('Number of Learning Paths')}
          </Typography>
          <TextField
            type="number"
            value={form.learningPathCount}
            onChange={onNumericChange('learningPathCount')}
            error={!!fieldError('learningPathCount')}
            helperText={fieldError('learningPathCount')}
            inputProps={{ min: 1, 'aria-label': 'Number of Learning Paths' }}
            size="small"
          />
        </Box>
      )}
    </Box>
  </Box>
);
