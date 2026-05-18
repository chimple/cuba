import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import {
  CampaignAudienceOptions,
  CampaignAudienceSummary,
  CampaignObjective,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
  CampaignTargetType,
} from '../../services/api/ServiceApi';

export type CampaignSetupFormState = {
  objective: CampaignObjective | '';
  targetType: CampaignTargetType | '';
  targetValue: string;
  learningPathCount: string;
  campaignName: string;
  managerId: string;
  startDate: string;
  endDate: string;
  programId: string;
  groupName: string;
};

type FormField = keyof CampaignSetupFormState;
type TextInputChangeHandler = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => void;
type AutocompleteOptionProps = React.HTMLAttributes<HTMLLIElement> & {
  key: React.Key;
};

const OBJECTIVE_OPTIONS: Array<{ value: CampaignObjective; label: string }> = [
  { value: 'homework_campaign', label: 'Homework Campaign' },
  {
    value: 'homepage_learning_pathway_campaign',
    label: 'Homepage Learning Pathway Campaign',
  },
];

const OBJECTIVE_DESCRIPTION: Record<CampaignObjective, string> = {
  homework_campaign:
    'Assign subject-wise lessons to students over a defined schedule with configurable frequency and tracking.',
  homepage_learning_pathway_campaign:
    'Encourage students to complete structured learning paths at subject-level.',
};

const TARGET_TYPE_OPTIONS: Array<{ value: CampaignTargetType; label: string }> =
  [
    { value: 'percentage_completion', label: '% Completion' },
    { value: 'number_of_lessons', label: 'Number of Lessons' },
  ];

const requiredLabel = (label: string) => (
  <>
    {label} <span className="campaign-setup-required">*</span>
  </>
);

const selectedCountLabel = (count: number, placeholder: string) =>
  count > 0 ? `${count} Selected` : placeholder;

const renderSelectionCount = (selected: unknown[], placeholder: string) => (
  <span className={selected.length ? undefined : 'campaign-setup-placeholder'}>
    {selectedCountLabel(selected.length, placeholder)}
  </span>
);

type CampaignSetupStepperProps = {
  activeStep?: number;
};

export const CampaignSetupStepper: React.FC<CampaignSetupStepperProps> = ({
  activeStep = 0,
}) => (
  <Box className="campaign-setup-stepper" aria-label="Campaign steps">
    {['Setup', 'Assignments', 'Rewards', 'Messaging'].map((step, index) => (
      <React.Fragment key={step}>
        <Box
          className={`campaign-setup-step ${
            index === activeStep ? 'campaign-setup-step-active' : ''
          }`}
        >
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </Box>
        {index < 3 && <span className="campaign-setup-step-line" />}
      </React.Fragment>
    ))}
  </Box>
);

type ObjectiveGoalSectionProps = {
  form: CampaignSetupFormState;
  onObjectiveChange: (objective: CampaignObjective) => void;
  onSelectChange: (
    field: FormField,
  ) => (event: SelectChangeEvent<string>) => void;
  onNumericChange: (
    field: keyof Pick<
      CampaignSetupFormState,
      'targetValue' | 'learningPathCount'
    >,
  ) => TextInputChangeHandler;
  fieldError: (key: string) => string | undefined;
};

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

type CampaignDetailsSectionProps = {
  form: CampaignSetupFormState;
  managers: CampaignOption[];
  onTextChange: (field: FormField) => TextInputChangeHandler;
  onSelectChange: (
    field: FormField,
  ) => (event: SelectChangeEvent<string>) => void;
  fieldError: (key: string) => string | undefined;
};

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

type TargetAudienceSectionProps = {
  form: CampaignSetupFormState;
  programs: CampaignOption[];
  savedGroups: CampaignSavedAudienceGroup[];
  selectedSavedGroupId: string;
  audienceOptions: CampaignAudienceOptions;
  selectedBlocks: string[];
  selectedSchools: CampaignSchoolOption[];
  selectedGrades: CampaignOption[];
  schoolsForSelectedBlocks: CampaignSchoolOption[];
  loadingAudience: boolean;
  selectedProgramName: string;
  summaryBlockCount: number;
  summarySchoolCount: number;
  loadingAudienceSummary: boolean;
  audienceSummary: CampaignAudienceSummary;
  saveGroup: boolean;
  savingGroup: boolean;
  onSavedGroupChange: (event: SelectChangeEvent<string>) => void;
  onProgramChange: (event: SelectChangeEvent<string>) => void;
  onBlocksChange: (blocks: string[]) => void;
  onSchoolsChange: (schools: CampaignSchoolOption[]) => void;
  onGradesChange: (grades: CampaignOption[]) => void;
  onSaveGroupChange: (saveGroup: boolean) => void;
  onGroupNameChange: TextInputChangeHandler;
  onSaveGroup: () => void;
  onCancelSaveGroup: () => void;
  fieldError: (key: string) => string | undefined;
};

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
}) => (
  <Box className="campaign-setup-section">
    <Typography variant="h6" className="campaign-setup-section-title">
      Target Audience
    </Typography>
    <Typography className="campaign-setup-section-copy">
      Define your campaign audience using hierarchical filters. Program → Block
      → School.
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
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={audienceOptions.blocks}
          value={selectedBlocks}
          loading={loadingAudience}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props as AutocompleteOptionProps;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} sx={{ marginRight: 1 }} />
                {option}
              </li>
            );
          }}
          onChange={(_, value) => onBlocksChange(value)}
          renderTags={(selected) =>
            renderSelectionCount(selected, 'Select Blocks')
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedBlocks.length ? '' : 'Select Blocks'}
              size="small"
            />
          )}
        />
        <Typography className="campaign-setup-field-note">
          all blocks under selected program are included.
        </Typography>
      </Box>

      <Box className="campaign-setup-field">
        <Typography className="campaign-setup-label">School</Typography>
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={schoolsForSelectedBlocks}
          value={selectedSchools}
          loading={loadingAudience}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props as AutocompleteOptionProps;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} sx={{ marginRight: 1 }} />
                {option.name}
              </li>
            );
          }}
          onChange={(_, value) => onSchoolsChange(value)}
          renderTags={(selected) =>
            renderSelectionCount(selected, 'Select Schools')
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedSchools.length ? '' : 'Select Schools'}
              size="small"
            />
          )}
        />
        <Typography className="campaign-setup-field-note">
          all schools under selected blocks are included.
        </Typography>
      </Box>

      <Box className="campaign-setup-field">
        <Typography className="campaign-setup-label">
          {requiredLabel('Grade')}
        </Typography>
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={audienceOptions.grades}
          value={selectedGrades}
          loading={loadingAudience}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props as AutocompleteOptionProps;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} sx={{ marginRight: 1 }} />
                {option.name}
              </li>
            );
          }}
          onChange={(_, value) => onGradesChange(value)}
          renderTags={(selected) =>
            renderSelectionCount(selected, 'Select Grade')
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedGrades.length ? '' : 'Select Grade'}
              error={!!fieldError('grades')}
              helperText={fieldError('grades')}
              size="small"
            />
          )}
        />
      </Box>

      <Box className="campaign-setup-audience-summary">
        <span>
          Program:{' '}
          <strong title={selectedProgramName}>{selectedProgramName}</strong>
        </span>
        <span className="campaign-setup-summary-dot">·</span>
        <span>
          Blocks: <strong>{summaryBlockCount}</strong>
        </span>
        <span className="campaign-setup-summary-dot">·</span>
        <span>
          Schools: <strong>{summarySchoolCount}</strong>
        </span>
        <span className="campaign-setup-summary-dot">·</span>
        <span>Students:</span>
        {loadingAudienceSummary && <span>Loading...</span>}
        {!loadingAudienceSummary &&
          (audienceSummary.grades.length > 0 ? (
            audienceSummary.grades.map((grade, index) => (
              <React.Fragment key={grade.gradeId}>
                {index > 0 && (
                  <span className="campaign-setup-summary-dot">·</span>
                )}
                <span>
                  {grade.gradeName}: <strong>{grade.studentCount}</strong>
                </span>
              </React.Fragment>
            ))
          ) : (
            <span>
              <strong>0</strong>
            </span>
          ))}
      </Box>
    </Box>

    <Box className="campaign-setup-save-group">
      <FormControlLabel
        control={
          <Checkbox
            checked={saveGroup}
            onChange={(event) => onSaveGroupChange(event.target.checked)}
          />
        }
        label="Save this group for reuse"
      />
      {saveGroup && (
        <Box className="campaign-setup-save-group-fields">
          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label">Group Name</Typography>
            <TextField
              value={form.groupName}
              onChange={onGroupNameChange}
              error={!!fieldError('groupName')}
              helperText={fieldError('groupName')}
              placeholder="Enter group name"
              inputProps={{ 'aria-label': 'Group Name' }}
              size="small"
            />
          </Box>
          <Button
            type="button"
            className="campaign-setup-text-button campaign-setup-save-button"
            disabled={savingGroup}
            onClick={onSaveGroup}
          >
            Save
          </Button>
          <Button
            type="button"
            className="campaign-setup-text-button campaign-setup-cancel-button"
            onClick={onCancelSaveGroup}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  </Box>
);
