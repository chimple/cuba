import React from 'react';
import {
  CampaignObjective,
  CampaignRewardType,
  CampaignTargetType,
} from '../../../services/api/ServiceApi';
import type { CampaignRewardRankFormState } from './types';

export const OBJECTIVE_OPTIONS: Array<{
  value: CampaignObjective;
  label: string;
}> = [
  { value: 'homework_campaign', label: 'Homework Campaign' },
  {
    value: 'homepage_learning_pathway_campaign',
    label: 'Homepage Learning Pathway Campaign',
  },
];

export const OBJECTIVE_DESCRIPTION: Record<CampaignObjective, string> = {
  homework_campaign:
    'Assign subject-wise lessons to students over a defined schedule with configurable frequency and tracking.',
  homepage_learning_pathway_campaign:
    'Encourage students to complete structured learning paths at subject-level.',
};

export const TARGET_TYPE_OPTIONS: Array<{
  value: CampaignTargetType;
  label: string;
}> = [
  { value: 'percentage_completion', label: '% Completion' },
  { value: 'number_of_lessons', label: 'Number of Lessons' },
];

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

const selectedCountLabel = (count: number, placeholder: string) =>
  count > 0 ? `${count} Selected` : placeholder;

export const renderSelectionCount = (
  selected: unknown[],
  placeholder: string,
) => (
  <span className={selected.length ? undefined : 'campaign-setup-placeholder'}>
    {selectedCountLabel(selected.length, placeholder)}
  </span>
);
