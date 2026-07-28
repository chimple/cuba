import React from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { CampaignAssignmentSubjectOption } from '../../../services/api/ServiceApi';
import { CampaignMultiSelect } from './CampaignMultiSelect';
import { CampaignSetupFormState } from './types';
import {
  Frequency,
  GradeAssignmentConfig,
  frequencyLabels,
  isAlternateWeekEnabled,
} from './campaignAssignmentUtils';
import './AssignmentConfigurationCard.css';

type AssignmentConfigurationCardProps = {
  gradeName: string;
  form: CampaignSetupFormState;
  activeSubjects: CampaignAssignmentSubjectOption[];
  selectedSubjects: CampaignAssignmentSubjectOption[];
  activeConfig: GradeAssignmentConfig;
  onSubjectsChange: (subjects: CampaignAssignmentSubjectOption[]) => void;
  onFrequencyChange: (frequency: Frequency) => void;
};

export const AssignmentConfigurationCard: React.FC<
  AssignmentConfigurationCardProps
> = ({
  gradeName,
  form,
  activeSubjects,
  selectedSubjects,
  activeConfig,
  onSubjectsChange,
  onFrequencyChange,
}) => (
  <Box className="assignment-configuration-card">
    <Typography variant="h6" className="campaign-setup-section-title">
      Assignment Configuration — {gradeName || 'Grade'}
    </Typography>
    <Box className="assignment-configuration-card-grid">
      <Box className="campaign-setup-field">
        <Typography className="campaign-setup-label">
          Subject<span className="campaign-setup-required">*</span>
        </Typography>
        <CampaignMultiSelect
          options={activeSubjects}
          value={selectedSubjects}
          loading={false}
          placeholder="Select Subjects"
          preventMobileKeyboard
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderSelectedLabel={(subjects) =>
            subjects.map((subject) => subject.name).join(', ')
          }
          onChange={onSubjectsChange}
        />
      </Box>

      <Box className="campaign-setup-field">
        <Typography className="campaign-setup-label">
          Frequency<span className="campaign-setup-required">*</span>
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={activeConfig.frequency}
            onChange={(event: SelectChangeEvent<Frequency>) =>
              onFrequencyChange(event.target.value as Frequency)
            }
          >
            {(Object.keys(frequencyLabels) as Frequency[]).map((frequency) => (
              <MenuItem
                key={frequency}
                value={frequency}
                disabled={
                  frequency === 'alternate_week' &&
                  !isAlternateWeekEnabled(form.startDate, form.endDate)
                }
              >
                {frequencyLabels[frequency]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
    <Box className="assignment-configuration-card-timeline">
      <span>Campaign timeline:</span>
      <strong>{form.startDate}</strong>
      <span>to</span>
      <strong>{form.endDate}</strong>
    </Box>
  </Box>
);
