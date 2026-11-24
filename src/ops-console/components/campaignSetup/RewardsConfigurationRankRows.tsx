import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { RANK_LABELS } from './constants';
import type { RewardsConfigurationSectionProps } from './types';

type TranslationValues = Record<string, string | number>;

type RewardsConfigurationRankRowsProps = Pick<
  RewardsConfigurationSectionProps,
  'form' | 'onRewardRankChange' | 'fieldError'
> & {
  criteriaLabel: string;
  usesLessonCount: boolean;
  translate: (key: string, options?: TranslationValues) => string;
  translateDynamic: (
    key: string,
    options: TranslationValues,
    fallback: string,
  ) => string;
};

const PERCENTAGE_PLACEHOLDER_VALUES = [90, 70, 50];
const LESSON_COUNT_PLACEHOLDER_VALUE = 10;

export const RewardsConfigurationRankRows = ({
  criteriaLabel,
  fieldError,
  form,
  onRewardRankChange,
  translate,
  translateDynamic,
  usesLessonCount,
}: RewardsConfigurationRankRowsProps): React.ReactElement => (
  <>
    {form.rewardRanks.map((rank, index) => {
      const rankLabel = translate(RANK_LABELS[rank.rank]);
      const criteriaPlaceholder = usesLessonCount
        ? LESSON_COUNT_PLACEHOLDER_VALUE
        : PERCENTAGE_PLACEHOLDER_VALUES[index];

      return (
        <Box className="rewards-config-row" role="row" key={rank.rank}>
          <Typography className="rewards-config-rank" role="cell">
            <span className="rewards-config-rank-badge">{rankLabel}</span>
            <span className="rewards-config-rank-title">
              {translateDynamic(
                '{{rank}} Rank',
                { rank: rankLabel },
                `${rankLabel} Rank`,
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
              placeholder={`${translate('e.g.,')} ${criteriaPlaceholder}`}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                'aria-label': `${rankLabel} ${criteriaLabel}`,
              }}
              size="small"
            />
          </Box>
          <Box className="rewards-config-field-cell" role="cell">
            <Typography className="rewards-config-mobile-label">
              {translate('Reward')}
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
                'aria-label': `${rankLabel} ${translate('Reward')}`,
              }}
              size="small"
            />
          </Box>
        </Box>
      );
    })}
  </>
);
