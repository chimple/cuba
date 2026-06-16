import React, { useState } from 'react';
import { Add, Close, ExpandLess, LinkOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(index < 2);
  const updatePollOptions = (optionIndex: number, optionValue: string) =>
    onRowChange(date, (current) => ({
      ...current,
      pollOptions: current.pollOptions.map(
        (currentOption: string, currentIndex: number) =>
          currentIndex === optionIndex ? optionValue : currentOption,
      ),
    }));
  const clearOrRemoveOption = (optionIndex: number) =>
    onRowChange(date, (current) => ({
      ...current,
      pollOptions:
        optionIndex >= 2
          ? current.pollOptions.filter(
              (_option: string, currentIndex: number) =>
                currentIndex !== optionIndex,
            )
          : current.pollOptions.map(
              (currentOption: string, currentIndex: number) =>
                currentIndex === optionIndex ? '' : currentOption,
            ),
    }));

  return (
    <Box className="campaign-communication-row">
      <Box
        component="button"
        type="button"
        className="campaign-communication-mobile-row-head"
        onClick={() => setIsMobileExpanded((current) => !current)}
        aria-expanded={isMobileExpanded}
      >
        <Box>
          <Typography className="campaign-communication-date-label">
            {dayLabel}
          </Typography>
          <Typography className="campaign-communication-date-subtext">
            {dateLabel}
          </Typography>
        </Box>
        <ExpandLess
          className={`campaign-communication-mobile-expand ${
            isMobileExpanded
              ? ''
              : 'campaign-communication-mobile-expand-collapsed'
          }`}
        />
      </Box>

      <Box className="campaign-communication-date-cell">
        <Typography className="campaign-communication-date-label">
          {dayLabel}
        </Typography>
        <Typography className="campaign-communication-date-subtext">
          {dateLabel}
        </Typography>
      </Box>

      <Box
        className={`campaign-communication-row-body ${
          isMobileExpanded
            ? 'campaign-communication-row-body-expanded'
            : 'campaign-communication-row-body-collapsed'
        }`}
      >
        <Box className="campaign-communication-cell">
          <Typography className="campaign-communication-mobile-label">
            {t('Daily Message')}
          </Typography>
          <TextField
            className="campaign-communication-message-field"
            fullWidth
            multiline
            minRows={3}
            placeholder={String(t('Enter daily campaign message...'))}
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
            className="campaign-communication-media-link-field"
            fullWidth
            placeholder={String(t('Paste media drive link...'))}
            value={row.mediaLink}
            onChange={(event) =>
              onRowChange(date, (current) => ({
                ...current,
                mediaLink: event.target.value,
              }))
            }
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  className="campaign-communication-media-link-adornment"
                >
                  <LinkOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
            error={!!getError(`rows.${date}.mediaLink`)}
            helperText={getError(`rows.${date}.mediaLink`)}
          />
        </Box>

        <Box className="campaign-communication-poll-cell">
          <Typography className="campaign-communication-mobile-label">
            {t('Poll')}
          </Typography>
          <TextField
            className="campaign-communication-poll-question-field"
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
                className="campaign-communication-poll-option-field"
                fullWidth
                placeholder={String(
                  t('Option {{number}}', { number: optionIndex + 1 }),
                )}
                value={option}
                onChange={(event) =>
                  updatePollOptions(optionIndex, event.target.value)
                }
                error={!!getError(`rows.${date}.pollOptions.${optionIndex}`)}
                helperText={getError(`rows.${date}.pollOptions.${optionIndex}`)}
              />
              <Button
                type="button"
                className="campaign-communication-mobile-option-clear"
                onClick={() => clearOrRemoveOption(optionIndex)}
                aria-label={String(
                  optionIndex >= 2
                    ? t('Remove Option {{number}}', {
                        number: optionIndex + 1,
                      })
                    : t('Clear Option {{number}}', {
                        number: optionIndex + 1,
                      }),
                )}
              >
                <Close fontSize="small" />
              </Button>
              {optionIndex >= 2 && (
                <Button
                  type="button"
                  className="campaign-communication-remove-option"
                  onClick={() => clearOrRemoveOption(optionIndex)}
                  aria-label={String(
                    t('Remove Option {{number}}', {
                      number: optionIndex + 1,
                    }),
                  )}
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
    </Box>
  );
};
