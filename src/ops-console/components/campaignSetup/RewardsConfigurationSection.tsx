import React from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { RANK_LABELS, REWARD_TYPE_OPTIONS, requiredLabel } from './constants';
import { RewardsConfigurationSectionProps } from './types';
import './RewardsConfigurationSection.css';

const getSummaryRange = (
  currentValue: number,
  previousValue: number | undefined,
  usesLessonCount: boolean,
) => {
  const unit = usesLessonCount ? ' lessons' : '%';
  if (!previousValue) return `>=${currentValue}${unit}`;

  const upperValue = previousValue - 1;
  return `${currentValue}${unit} - ${upperValue}${unit}`;
};

export const RewardsConfigurationSection: React.FC<
  RewardsConfigurationSectionProps
> = ({ form, onSelectChange, onRewardRankChange, fieldError }) => {
  const usesLessonCount =
    form.objective === 'homepage_learning_pathway_campaign' ||
    form.targetType === 'number_of_lessons';
  const criteriaLabel = usesLessonCount
    ? 'Number of Lessons'
    : 'Minimum Completion (%)';
  const minimumValue = form.rewardRanks[2]?.criteriaValue;
  const informationNote = minimumValue
    ? usesLessonCount
      ? `Students meeting the same criteria will share the rank. Students completing fewer than ${minimumValue} lessons will not receive a rank.`
      : `Students meeting the same criteria will share the rank. Students with completion below ${minimumValue}% will not receive a rank.`
    : 'Students meeting the same criteria will share the rank. Students below the minimum configured criteria will not receive a rank.';
  const hasSummary = form.rewardRanks.some((rank) => rank.criteriaValue);

  return (
    <Box className="campaign-rewards-section">
      <Typography variant="h6" className="campaign-setup-section-title">
        Rewards Configuration
      </Typography>
      <Typography className="campaign-setup-section-copy">
        Completion is calculated based on assignments completed.
      </Typography>

      <Box className="campaign-rewards-type-field campaign-setup-field">
        <Typography className="campaign-setup-label">
          {requiredLabel('Reward Type')}
        </Typography>
        <FormControl fullWidth error={!!fieldError('rewardType')}>
          <Select
            value={form.rewardType}
            onChange={onSelectChange('rewardType')}
            displayEmpty
            size="small"
          >
            <MenuItem value="" disabled>
              Select Reward Type
            </MenuItem>
            {REWARD_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fieldError('rewardType')}</FormHelperText>
        </FormControl>
      </Box>

      <Box className="campaign-rewards-table" role="table">
        <Box className="campaign-rewards-row campaign-rewards-head" role="row">
          <Typography role="columnheader">Rank</Typography>
          <Typography role="columnheader">{criteriaLabel}</Typography>
          <Typography role="columnheader">Reward</Typography>
        </Box>

        {form.rewardRanks.map((rank, index) => (
          <Box className="campaign-rewards-row" role="row" key={rank.rank}>
            <Typography className="campaign-rewards-rank" role="cell">
              <span className="campaign-rewards-rank-badge">
                {RANK_LABELS[rank.rank]}
              </span>
              <span className="campaign-rewards-rank-title">
                {RANK_LABELS[rank.rank]} Rank
              </span>
            </Typography>
            <Box className="campaign-rewards-field-cell" role="cell">
              <Typography className="campaign-rewards-mobile-label">
                {criteriaLabel}
              </Typography>
              <TextField
                value={rank.criteriaValue}
                onChange={onRewardRankChange(index, 'criteriaValue')}
                error={!!fieldError(`rewardRanks.${index}.criteriaValue`)}
                helperText={fieldError(`rewardRanks.${index}.criteriaValue`)}
                placeholder={usesLessonCount ? 'e.g., 10' : 'e.g., 90'}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  'aria-label': `${RANK_LABELS[rank.rank]} ${criteriaLabel}`,
                }}
                size="small"
              />
            </Box>
            <Box className="campaign-rewards-field-cell" role="cell">
              <Typography className="campaign-rewards-mobile-label">
                Reward
              </Typography>
              <TextField
                fullWidth
                value={rank.reward}
                onChange={onRewardRankChange(index, 'reward')}
                error={!!fieldError(`rewardRanks.${index}.reward`)}
                helperText={fieldError(`rewardRanks.${index}.reward`)}
                placeholder={
                  index === 0
                    ? 'e.g., Certificate of Excellence'
                    : index === 1
                      ? 'e.g., Certificate of Merit'
                      : 'e.g., Certificate of Achievement'
                }
                inputProps={{
                  'aria-label': `${RANK_LABELS[rank.rank]} Reward`,
                }}
                size="small"
              />
            </Box>
          </Box>
        ))}
      </Box>

      {fieldError('rewardRanking') && (
        <FormHelperText error className="campaign-rewards-ranking-error">
          {fieldError('rewardRanking')}
        </FormHelperText>
      )}

      <Typography className="campaign-rewards-note">
        {informationNote}
      </Typography>

      {hasSummary && (
        <Box className="campaign-rewards-preview">
          <Typography className="campaign-rewards-preview-title">
            Preview
          </Typography>
          {form.rewardRanks.map((rank, index) => {
            if (!rank.criteriaValue) return null;
            const currentValue = Number(rank.criteriaValue);
            const previousValue =
              index === 0
                ? undefined
                : Number(form.rewardRanks[index - 1].criteriaValue);
            return (
              <Typography key={rank.rank}>
                Students with{' '}
                {getSummaryRange(currentValue, previousValue, usesLessonCount)}{' '}
                {usesLessonCount ? 'completed' : 'completion'} qualify for{' '}
                {RANK_LABELS[rank.rank]} rank
              </Typography>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
