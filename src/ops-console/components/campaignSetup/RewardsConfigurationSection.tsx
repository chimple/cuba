import React from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RANK_LABELS, REWARD_TYPE_OPTIONS, requiredLabel } from './constants';
import { RewardsConfigurationRankRows } from './RewardsConfigurationRankRows';
import type { RewardsConfigurationSectionProps } from './types';
import { CAMPAIGN_OBJECTIVE } from '../../../common/constants';
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
    form.objective === CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY ||
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
            renderValue={(selected) =>
              selected ? (
                translate(
                  REWARD_TYPE_OPTIONS.find(
                    (option) => option.value === selected,
                  )?.label ?? String(selected),
                )
              ) : (
                <span className="rewards-config-select-placeholder">
                  {t('Select Reward Type')}
                </span>
              )
            }
            size="small"
            MenuProps={{
              PaperProps: { className: 'campaign-setup-dropdown-menu' },
            }}
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

        <RewardsConfigurationRankRows
          criteriaLabel={criteriaLabel}
          fieldError={fieldError}
          form={form}
          onRewardRankChange={onRewardRankChange}
          translate={translate}
          translateDynamic={translateDynamic}
          usesLessonCount={usesLessonCount}
        />
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
            const rankLabel = translate(RANK_LABELS[rank.rank]);
            const fallback = `Students with ${range} ${status} qualify for ${rankLabel} rank`;
            return (
              <Typography key={rank.rank}>
                {translateDynamic(
                  'Students with {{range}} {{status}} qualify for {{rank}} rank',
                  {
                    range,
                    status,
                    rank: rankLabel,
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
