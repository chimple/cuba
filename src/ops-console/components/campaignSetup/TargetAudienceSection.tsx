import React, { useMemo } from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { renderSelectPlaceholder, requiredLabel } from './constants';
import { TargetAudienceSectionProps } from './types';
import { CampaignMultiSelect } from './CampaignMultiSelect';
import { AudienceSummary } from './AudienceSummary';
import { SavedAudienceGroupFields } from './SavedAudienceGroupFields';
import './TargetAudienceSection.css';

export const TargetAudienceSection: React.FC<TargetAudienceSectionProps> = ({
  form,
  programs,
  savedGroups,
  selectedSavedGroupId,
  audienceOptions,
  selectedBlocks,
  selectedSchools,
  selectedGrades,
  schoolsForSelectedBlocks,
  loadingAudience,
  selectedProgramName,
  summaryBlockCount,
  summarySchoolCount,
  loadingAudienceSummary,
  audienceSummary,
  saveGroup,
  savingGroup,
  onSavedGroupChange,
  onProgramChange,
  onBlocksChange,
  onSchoolsChange,
  onGradesChange,
  onSaveGroupChange,
  onGroupNameChange,
  onSaveGroup,
  onCancelSaveGroup,
  fieldError,
}) => {
  const savedGroupNameById = useMemo(
    () => new Map(savedGroups.map((group) => [group.id, group.name])),
    [savedGroups],
  );
  const programNameById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.name])),
    [programs],
  );

  return (
    <Box className="campaign-setup-section">
      <Typography variant="h6" className="campaign-setup-section-title">
        Target Audience
      </Typography>
      <Typography className="campaign-setup-section-copy">
        <span>Define your campaign audience using hierarchical filters.</span>{' '}
        <span className="campaign-setup-audience-flow-copy">
          Program → Block → School → Grade.
        </span>
      </Typography>

      <Box className="campaign-setup-audience-grid">
        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">
            Saved Target Group
          </Typography>
          <FormControl fullWidth>
            <Select
              value={selectedSavedGroupId}
              onChange={onSavedGroupChange}
              displayEmpty
              renderValue={(value) =>
                renderSelectPlaceholder(
                  value,
                  'Select a saved group',
                  savedGroupNameById.get(value),
                )
              }
              size="small"
            >
              <MenuItem value="">Select a saved group</MenuItem>
              {savedGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">
            {requiredLabel('Program')}
          </Typography>
          <FormControl fullWidth error={!!fieldError('programId')}>
            <Select
              value={form.programId}
              onChange={onProgramChange}
              displayEmpty
              renderValue={(value) =>
                renderSelectPlaceholder(
                  value,
                  'Select Program',
                  programNameById.get(value),
                )
              }
              size="small"
            >
              <MenuItem value="" disabled>
                Select Program
              </MenuItem>
              {programs.map((program) => (
                <MenuItem key={program.id} value={program.id}>
                  {program.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{fieldError('programId')}</FormHelperText>
          </FormControl>
        </Box>
        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">Block</Typography>
          <CampaignMultiSelect
            options={audienceOptions.blocks}
            value={selectedBlocks}
            loading={loadingAudience}
            placeholder="Select Blocks"
            onChange={onBlocksChange}
          />
          <Typography className="campaign-setup-field-note">
            all blocks under selected program are included.
          </Typography>
        </Box>

        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">School</Typography>
          <CampaignMultiSelect
            options={schoolsForSelectedBlocks}
            value={selectedSchools}
            loading={loadingAudience}
            placeholder="Select Schools"
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={onSchoolsChange}
          />
          <Typography className="campaign-setup-field-note">
            all schools under selected blocks are included.
          </Typography>
        </Box>

        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">Grade</Typography>
          <CampaignMultiSelect
            options={audienceOptions.grades}
            value={selectedGrades}
            loading={loadingAudience}
            placeholder="Select Grade"
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={onGradesChange}
          />
          <Typography className="campaign-setup-field-note">
            all grades under selected schools are included.
          </Typography>
        </Box>

        <AudienceSummary
          selectedProgramName={selectedProgramName}
          summaryBlockCount={summaryBlockCount}
          summarySchoolCount={summarySchoolCount}
          loadingAudienceSummary={loadingAudienceSummary}
          audienceSummary={audienceSummary}
        />
      </Box>

      <SavedAudienceGroupFields
        form={form}
        saveGroup={saveGroup}
        savingGroup={savingGroup}
        groupNameError={fieldError('groupName')}
        onSaveGroupChange={onSaveGroupChange}
        onGroupNameChange={onGroupNameChange}
        onSaveGroup={onSaveGroup}
        onCancelSaveGroup={onCancelSaveGroup}
      />
    </Box>
  );
};
