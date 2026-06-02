import React from 'react';
import { Add, Close, ExpandMore } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CampaignCommunicationRowState } from './campaignCommunicationUtils';

type CampaignCommunicationRowProps = {
  date: string;
  index: number;
  row: CampaignCommunicationRowState;
  dateLabel: string;
  getError: (key: string) => string | undefined;
  onRowChange: (
    date: string,
    updater: (
      row: CampaignCommunicationRowState,
    ) => CampaignCommunicationRowState,
  ) => void;
  onClearRow: (date: string) => void;
};

export const CampaignCommunicationRow: React.FC<
  CampaignCommunicationRowProps
> = ({ date, index, row, dateLabel, getError, onRowChange, onClearRow }) => {
  const { t } = useTranslation();
  const dayLabel = `Day ${index + 1}`;

  return (
    <Box className="campaign-communication-row">
      <Box className="campaign-communication-mobile-row-head">
        <Box>
          <Typography className="campaign-communication-date-label">
            {dayLabel}
          </Typography>
          <Typography className="campaign-communication-date-subtext">
            {dateLabel}
          </Typography>
        </Box>
        <ExpandMore className="campaign-communication-mobile-expand" />
      </Box>

      <Box className="campaign-communication-date-cell">
        <Typography className="campaign-communication-date-label">
          {dayLabel}
        </Typography>
        <Typography className="campaign-communication-date-subtext">
          {dateLabel}
        </Typography>
      </Box>

      <Box className="campaign-communication-cell">
        <Typography className="campaign-communication-mobile-label">
          {t('Daily Message')}
        </Typography>
        <TextField
          className="campaign-communication-message-field"
          fullWidth
          multiline
          minRows={4}
          placeholder={String(t('Enter daily message'))}
          value={row.message}
          onChange={(event) =>
            onRowChange(date, (current) => ({
              ...current,
              message: event.target.value,
            }))
          }
        />
      </Box>

      <Box className="campaign-communication-cell">
        <Typography className="campaign-communication-mobile-label">
          {t('Media Link')}
        </Typography>
        <TextField
          fullWidth
          placeholder={String(t('Paste media drive link...'))}
          value={row.mediaLink}
          onChange={(event) =>
            onRowChange(date, (current) => ({
              ...current,
              mediaLink: event.target.value,
            }))
          }
          error={!!getError(`rows.${date}.mediaLink`)}
          helperText={getError(`rows.${date}.mediaLink`)}
        />
      </Box>

      <Box className="campaign-communication-poll-cell">
        <Typography className="campaign-communication-mobile-label">
          {t('Poll')}
        </Typography>
        <TextField
          fullWidth
          placeholder={String(t('Poll question...'))}
          value={row.pollQuestion}
          onChange={(event) =>
            onRowChange(date, (current) => ({
              ...current,
              pollQuestion: event.target.value,
            }))
          }
          error={!!getError(`rows.${date}.pollQuestion`)}
          helperText={getError(`rows.${date}.pollQuestion`)}
        />

        {row.pollOptions.map((option: string, optionIndex: number) => (
          <Box
            className="campaign-communication-option-row"
            key={`${date}-option-${optionIndex}`}
          >
            <TextField
              fullWidth
              placeholder={`Option ${optionIndex + 1}`}
              value={option}
              onChange={(event) =>
                onRowChange(date, (current) => ({
                  ...current,
                  pollOptions: current.pollOptions.map(
                    (currentOption: string, currentIndex: number) =>
                      currentIndex === optionIndex
                        ? event.target.value
                        : currentOption,
                  ),
                }))
              }
              error={!!getError(`rows.${date}.pollOptions.${optionIndex}`)}
              helperText={getError(`rows.${date}.pollOptions.${optionIndex}`)}
            />
            {optionIndex >= 2 && (
              <Button
                type="button"
                className="campaign-communication-remove-option"
                onClick={() =>
                  onRowChange(date, (current) => ({
                    ...current,
                    pollOptions: current.pollOptions.filter(
                      (_option: string, currentIndex: number) =>
                        currentIndex !== optionIndex,
                    ),
                  }))
                }
                aria-label={`Remove Option ${optionIndex + 1}`}
              >
                <Close fontSize="small" />
              </Button>
            )}
          </Box>
        ))}

        <Button
          type="button"
          className="campaign-communication-add-option"
          startIcon={<Add />}
          onClick={() =>
            onRowChange(date, (current) => ({
              ...current,
              pollOptions: [...current.pollOptions, ''],
            }))
          }
        >
          {t('Option')}
        </Button>
      </Box>

      <Box className="campaign-communication-clear-cell">
        <Button type="button" onClick={() => onClearRow(date)}>
          {t('Clear')}
        </Button>
      </Box>
    </Box>
  );
};
