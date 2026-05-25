import {
  CampaignAudiencePayload,
  CampaignObjective,
  CampaignSavedAudienceGroup,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
import type { CampaignSetupFormState } from '../components/campaignSetup/types';

export const initialCampaignSetupForm: CampaignSetupFormState = {
  objective: 'homework_campaign',
  targetType: 'percentage_completion',
  targetValue: '',
  learningPathCount: '',
  campaignName: '',
  managerId: '',
  startDate: '',
  endDate: '',
  programId: '',
  groupName: '',
};

export const getTodayDateValue = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeSavedGroupName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

export const hasDuplicateSavedGroupName = (
  groupName: string,
  savedGroups: CampaignSavedAudienceGroup[],
) => {
  const normalizedName = normalizeSavedGroupName(groupName);

  return savedGroups.some(
    (group) => normalizeSavedGroupName(group.name) === normalizedName,
  );
};

type AudiencePayloadParams = {
  isAllSchools: boolean;
  isAllGrades: boolean;
  selectedSchoolIds: string[];
  selectedGradeIds: string[];
};

export const buildCampaignAudiencePayload = (
  form: CampaignSetupFormState,
  saveGroup: boolean,
  {
    isAllSchools,
    isAllGrades,
    selectedSchoolIds,
    selectedGradeIds,
  }: AudiencePayloadParams,
): CampaignAudiencePayload => ({
  programId: form.programId,
  schoolIds: isAllSchools ? [] : selectedSchoolIds,
  gradeIds: isAllGrades ? [] : selectedGradeIds,
  isAllSchools,
  isAllGrades,
  isSaved: saveGroup,
  name: saveGroup ? form.groupName.trim() : undefined,
});

export const getCampaignSetupValidationErrors = (
  form: CampaignSetupFormState,
  saveGroup: boolean,
  savedGroups: CampaignSavedAudienceGroup[] = [],
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const today = getTodayDateValue();
  if (!form.objective) errors.objective = 'Campaign objective is required.';
  if (form.objective === 'homework_campaign') {
    if (!form.targetType) errors.targetType = 'Target type is required.';
    if (!Number(form.targetValue) || Number(form.targetValue) <= 0) {
      errors.targetValue = 'Target value is required.';
    } else if (Number(form.targetValue) > 100) {
      errors.targetValue = 'Target value cannot be more than 100.';
    }
  }
  if (form.objective === 'homepage_learning_pathway_campaign') {
    if (
      !Number(form.learningPathCount) ||
      Number(form.learningPathCount) <= 0
    ) {
      errors.learningPathCount = 'Number of learning paths is required.';
    }
  }
  if (!form.campaignName.trim()) {
    errors.campaignName = 'Campaign name is required.';
  }
  if (!form.managerId) errors.managerId = 'Campaign manager is required.';
  if (!form.startDate) {
    errors.startDate = 'Start date is required.';
  } else if (form.startDate < today) {
    errors.startDate = 'Start date cannot be in the past.';
  }
  if (!form.endDate) {
    errors.endDate = 'End date is required.';
  } else if (form.endDate < today) {
    errors.endDate = 'End date cannot be in the past.';
  }
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be after start date.';
  }
  if (!form.programId) errors.programId = 'Program is required.';
  if (saveGroup) {
    if (!form.groupName.trim()) {
      errors.groupName = 'Group name is required.';
    } else if (hasDuplicateSavedGroupName(form.groupName, savedGroups)) {
      errors.groupName = 'A saved group with this name already exists.';
    }
  }
  return errors;
};

export const resetObjectiveFields = (
  form: CampaignSetupFormState,
  objective: CampaignObjective,
): CampaignSetupFormState => ({
  ...form,
  objective,
  targetType: '' as CampaignTargetType | '',
  targetValue: '',
  learningPathCount: '',
});
