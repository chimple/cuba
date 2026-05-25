import {
  CampaignAudiencePayload,
  CampaignObjective,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
import { CampaignSetupFormState } from '../components/CampaignSetupSections';

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
): Record<string, string> => {
  const errors: Record<string, string> = {};
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
  if (!form.startDate) errors.startDate = 'Start date is required.';
  if (!form.endDate) errors.endDate = 'End date is required.';
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be after start date.';
  }
  if (!form.programId) errors.programId = 'Program is required.';
  if (saveGroup && !form.groupName.trim()) {
    errors.groupName = 'Group name is required.';
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
