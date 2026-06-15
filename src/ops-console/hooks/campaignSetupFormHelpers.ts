import {
  CampaignAudiencePayload,
  CampaignObjective,
  CampaignSavedAudienceGroup,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
import type { CampaignSetupFormState } from '../components/campaignSetup/types';
import { DEFAULT_REWARD_RANKS } from '../components/campaignSetup/constants';

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
  rewardType: '',
  rewardRanks: DEFAULT_REWARD_RANKS.map((rank) => ({ ...rank })),
};

export const getTodayDateValue = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const normalizeSavedGroupName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

export const buildSavedGroupNameSet = (
  savedGroups: CampaignSavedAudienceGroup[],
) => new Set(savedGroups.map((group) => normalizeSavedGroupName(group.name)));

export const hasDuplicateSavedGroupName = (
  groupName: string,
  savedGroupNameSet: ReadonlySet<string>,
) => savedGroupNameSet.has(normalizeSavedGroupName(groupName));

const EMPTY_SAVED_GROUP_NAME_SET: ReadonlySet<string> = new Set();

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
  savedGroupNameSet: ReadonlySet<string> = EMPTY_SAVED_GROUP_NAME_SET,
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
    } else if (hasDuplicateSavedGroupName(form.groupName, savedGroupNameSet)) {
      errors.groupName = 'A saved group with this name already exists.';
    }
  }
  return errors;
};

export const usesLessonRewardCriteria = (form: CampaignSetupFormState) =>
  form.objective === 'homepage_learning_pathway_campaign' ||
  form.targetType === 'number_of_lessons';

export const getCampaignRewardsValidationErrors = (
  form: CampaignSetupFormState,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const usesLessonCount = usesLessonRewardCriteria(form);

  if (!form.rewardType) errors.rewardType = 'Reward type is required.';

  const values = form.rewardRanks.map((rank, index) => {
    const value = Number(rank.criteriaValue);
    if (!rank.criteriaValue) {
      errors[`rewardRanks.${index}.criteriaValue`] = usesLessonCount
        ? 'Number of lessons is required.'
        : 'Minimum completion is required.';
    } else if (!Number.isInteger(value) || value <= 0) {
      errors[`rewardRanks.${index}.criteriaValue`] =
        'Enter a number greater than 0.';
    } else if (!usesLessonCount && value > 100) {
      errors[`rewardRanks.${index}.criteriaValue`] =
        'Minimum completion cannot be more than 100.';
    }

    if (!rank.reward.trim()) {
      errors[`rewardRanks.${index}.reward`] = 'Reward is required.';
    }

    return value;
  });

  const hasValidCriteriaValues = values.every((value) => value > 0);
  if (
    hasValidCriteriaValues &&
    values.some((value, index) => index > 0 && values[index - 1] <= value)
  ) {
    errors.rewardRanking =
      'Ranking criteria must be highest for 1st rank, then decrease for each rank.';
  }

  return errors;
};

export type CampaignRewardsDraftPayload = {
  type: NonNullable<CampaignSetupFormState['rewardType']>;
  rules: Array<{
    rank: 1 | 2 | 3;
    min: number;
    reward: string;
  }>;
};

export const buildCampaignRewardsPayload = (
  form: CampaignSetupFormState,
): CampaignRewardsDraftPayload => ({
  type: form.rewardType as CampaignRewardsDraftPayload['type'],
  rules: form.rewardRanks.map((rank) => ({
    rank: rank.rank,
    min: Number(rank.criteriaValue),
    reward: rank.reward.trim(),
  })),
});

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
