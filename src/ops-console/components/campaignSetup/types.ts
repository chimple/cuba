import React from 'react';
import { SelectChangeEvent } from '@mui/material';
import {
  CampaignAudienceOptions,
  CampaignAudienceSummary,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
  CampaignObjective,
  CampaignTargetType,
} from '../../../services/api/ServiceApi';

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

export type CampaignSetupFormField = keyof CampaignSetupFormState;

export type CampaignSetupTextChangeHandler = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => void;

export type CampaignSetupFieldError = (key: string) => string | undefined;

export type CampaignSetupSelectChange = (
  field: CampaignSetupFormField,
) => (event: SelectChangeEvent<string>) => void;

export type ObjectiveGoalSectionProps = {
  form: CampaignSetupFormState;
  onObjectiveChange: (objective: CampaignObjective) => void;
  onSelectChange: CampaignSetupSelectChange;
  onNumericChange: (
    field: keyof Pick<
      CampaignSetupFormState,
      'targetValue' | 'learningPathCount'
    >,
  ) => CampaignSetupTextChangeHandler;
  fieldError: CampaignSetupFieldError;
};

export type CampaignDetailsSectionProps = {
  form: CampaignSetupFormState;
  managers: CampaignOption[];
  onTextChange: (
    field: CampaignSetupFormField,
  ) => CampaignSetupTextChangeHandler;
  onSelectChange: CampaignSetupSelectChange;
  fieldError: CampaignSetupFieldError;
};

export type TargetAudienceSectionProps = {
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
  onGroupNameChange: CampaignSetupTextChangeHandler;
  onSaveGroup: () => void;
  onCancelSaveGroup: () => void;
  fieldError: CampaignSetupFieldError;
};
