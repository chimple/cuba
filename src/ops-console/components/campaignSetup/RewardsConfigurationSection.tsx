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
import { useTranslation } from 'react-i18next';
import { RANK_LABELS, REWARD_TYPE_OPTIONS, requiredLabel } from './constants';
import { RewardsConfigurationSectionProps } from './types';
import './RewardsConfigurationSection.css';

type TranslationValues = Record<string, string | number>;

const getSummaryRange = (
  currentValue: number,
  previousValue: number | undefined,
  usesLessonCount: boolean,
  lessonsLabel: string,
) => {
  const unit = usesLessonCount ? ` ${lessonsLabel}` : '%';
  if (!previousValue) return `>=${currentValue}${unit}`;

  const upperValue = previousValue - 1;
  return `${currentValue}${unit} - ${upperValue}${unit}`;
};

export const RewardsConfigurationSection: React.FC<
  RewardsConfigurationSectionProps
> = ({ form, onSelectChange, onRewardRankChange, fieldError }) => {
  const { t } = useTranslation();
  const translate = (key: string, options?: TranslationValues) =>
    String(options ? t(key, options) : t(key));
  const translateDynamic = (
    key: string,
    options: TranslationValues,
    fallback: string,
  ) => {
    const translated = translate(key, options);
    return translated === key ? fallback : translated;
  };
  const usesLessonCount =
    form.objective === 'homepage_learning_pathway_campaign' ||
    form.targetType === 'number_of_lessons';
  const criteriaLabel = usesLessonCount
    ? translate('Number of Lessons')
    : translate('Minimum Completion (%)');
  const minimumValue = form.rewardRanks[2]?.criteriaValue;
  const informationNote = minimumValue
    ? usesLessonCount
      ? translateDynamic(
          'Students meeting the same criteria will share the rank. Students completing fewer than {{value}} lessons will not receive a rank.',
          { value: minimumValue },
          `Students meeting the same criteria will share the rank. Students completing fewer than ${minimumValue} lessons will not receive a rank.`,
        )
      : translateDynamic(
          'Students meeting the same criteria will share the rank. Students with completion below {{value}}% will not receive a rank.',
          { value: minimumValue },
          `Students meeting the same criteria will share the rank. Students with completion below ${minimumValue}% will not receive a rank.`,
        )
    : t(
        'Students meeting the same criteria will share the rank. Students below the minimum configured criteria will not receive a rank.',
      );
  const hasSummary = form.rewardRanks.some((rank) => rank.criteriaValue);

  return (
    <Box className="rewards-config-section">
      <Typography variant="h6" className="rewards-config-title">
        {t('Rewards Configuration')}
      </Typography>
      <Typography className="rewards-config-copy">
        {t('Completion is calculated based on assignments completed.')}
      </Typography>

      <Box className="rewards-config-type-field">
        <Typography className="rewards-config-label">
          {requiredLabel(translate('Reward Type'))}
        </Typography>
        <FormControl fullWidth error={!!fieldError('rewardType')}>
          <Select
            value={form.rewardType}
            onChange={onSelectChange('rewardType')}
            displayEmpty
            size="small"
          >
            <MenuItem value="" disabled>
              {t('Select Reward Type')}
            </MenuItem>
            {REWARD_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.label)}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fieldError('rewardType')}</FormHelperText>
        </FormControl>
      </Box>

      <Box className="rewards-config-table" role="table">
        <Box className="rewards-config-row rewards-config-head" role="row">
          <Typography role="columnheader">{t('Rank')}</Typography>
          <Typography role="columnheader">{criteriaLabel}</Typography>
          <Typography role="columnheader">{t('Reward')}</Typography>
        </Box>

        {form.rewardRanks.map((rank, index) => (
          <Box className="rewards-config-row" role="row" key={rank.rank}>
            <Typography className="rewards-config-rank" role="cell">
              <span className="rewards-config-rank-badge">
                {RANK_LABELS[rank.rank]}
              </span>
              <span className="rewards-config-rank-title">
                {translateDynamic(
                  '{{rank}} Rank',
                  { rank: RANK_LABELS[rank.rank] },
                  `${RANK_LABELS[rank.rank]} Rank`,
                )}
              </span>
            </Typography>
            <Box className="rewards-config-field-cell" role="cell">
              <Typography className="rewards-config-mobile-label">
                {criteriaLabel}
              </Typography>
              <TextField
                value={rank.criteriaValue}
                onChange={onRewardRankChange(index, 'criteriaValue')}
                error={!!fieldError(`rewardRanks.${index}.criteriaValue`)}
                helperText={fieldError(`rewardRanks.${index}.criteriaValue`)}
                placeholder={
                  usesLessonCount
                    ? translate('e.g., 10')
                    : translate('e.g., 90')
                }
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  'aria-label': `${RANK_LABELS[rank.rank]} ${criteriaLabel}`,
                }}
                size="small"
              />
            </Box>
            <Box className="rewards-config-field-cell" role="cell">
              <Typography className="rewards-config-mobile-label">
                {t('Reward')}
              </Typography>
              <TextField
                fullWidth
                value={rank.reward}
                onChange={onRewardRankChange(index, 'reward')}
                error={!!fieldError(`rewardRanks.${index}.reward`)}
                helperText={fieldError(`rewardRanks.${index}.reward`)}
                placeholder={
                  index === 0
                    ? translate('e.g., Certificate of Excellence')
                    : index === 1
                      ? translate('e.g., Certificate of Merit')
                      : translate('e.g., Certificate of Achievement')
                }
                inputProps={{
                  'aria-label': `${RANK_LABELS[rank.rank]} ${translate(
                    'Reward',
                  )}`,
                }}
                size="small"
              />
            </Box>
          </Box>
        ))}
      </Box>

      {fieldError('rewardRanking') && (
        <FormHelperText error className="rewards-config-ranking-error">
          {fieldError('rewardRanking')}
        </FormHelperText>
      )}

      <Typography className="rewards-config-note">{informationNote}</Typography>

      {hasSummary && (
        <Box className="rewards-config-preview">
          <Typography className="rewards-config-preview-title">
            {t('Preview')}
          </Typography>
          {form.rewardRanks.map((rank, index) => {
            if (!rank.criteriaValue) return null;
            const currentValue = Number(rank.criteriaValue);
            const previousValue =
              index === 0
                ? undefined
                : Number(form.rewardRanks[index - 1].criteriaValue);
            const range = getSummaryRange(
              currentValue,
              previousValue,
              usesLessonCount,
              translate('lessons'),
            );
            const status = usesLessonCount
              ? translate('completed')
              : translate('completion');
            const fallback = `Students with ${range} ${status} qualify for ${
              RANK_LABELS[rank.rank]
            } rank`;
            return (
              <Typography key={rank.rank}>
                {translateDynamic(
                  'Students with {{range}} {{status}} qualify for {{rank}} rank',
                  {
                    range,
                    status,
                    rank: RANK_LABELS[rank.rank],
                  },
                  fallback,
                )}
              </Typography>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
