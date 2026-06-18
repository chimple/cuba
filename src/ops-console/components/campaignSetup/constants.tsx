import {
  CampaignObjective,
  CampaignRewardType,
  CampaignTargetType,
} from '../../../services/api/ServiceApi';
import { CAMPAIGN_OBJECTIVE } from '../../../common/constants';
import type { CampaignRewardRankFormState } from './types';

export const OBJECTIVE_OPTIONS: Array<{
  value: CampaignObjective;
  label: string;
}> = [
  { value: CAMPAIGN_OBJECTIVE.HOMEWORK, label: 'Homework Campaign' },
  {
    value: CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY,
    label: 'Homepage Learning Pathway Campaign',
  },
];

export const OBJECTIVE_DESCRIPTION: Record<CampaignObjective, string> = {
  [CAMPAIGN_OBJECTIVE.HOMEWORK]:
    'Assign subject-wise lessons to students over a defined schedule with configurable frequency and tracking.',
  [CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY]:
    'Encourage students to complete structured learning paths at subject-level.',
};

export const TARGET_TYPE_OPTIONS: Array<{
  value: CampaignTargetType;
  label: string;
}> = [
  { value: 'percentage_completion', label: '% Completion' },
  { value: 'number_of_lessons', label: 'Number of Lessons' },
];

export const TARGET_TYPE_LABEL_BY_VALUE = new Map(
  TARGET_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);
export const REWARD_TYPE_OPTIONS: Array<{
  value: CampaignRewardType;
  label: string;
}> = [
  { value: 'digital_rewards', label: 'Digital Rewards' },
  { value: 'physical_rewards', label: 'Physical Rewards' },
];

export const DEFAULT_REWARD_RANKS: CampaignRewardRankFormState[] = [
  { rank: 1, criteriaValue: '', reward: '' },
  { rank: 2, criteriaValue: '', reward: '' },
  { rank: 3, criteriaValue: '', reward: '' },
];

export const RANK_LABELS: Record<CampaignRewardRankFormState['rank'], string> =
  {
    1: '1st',
    2: '2nd',
    3: '3rd',
  };

export const requiredLabel = (label: string) => (
  <>
    {label} <span className="campaign-setup-required">*</span>
  </>
);
