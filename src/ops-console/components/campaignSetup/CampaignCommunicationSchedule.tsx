import React from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type CampaignCommunicationScheduleProps = {
  messageTime: string;
  pollTime: string;
  timeOptions: string[];
  messageTimeError?: string;
  pollTimeError?: string;
  onMessageTimeChange: (value: string) => void;
  onPollTimeChange: (value: string) => void;
};

export const CampaignCommunicationSchedule: React.FC<
  CampaignCommunicationScheduleProps
> = ({
  messageTime,
  pollTime,
  timeOptions,
  messageTimeError,
  pollTimeError,
  onMessageTimeChange,
  onPollTimeChange,
}) => {
  const { t } = useTranslation();

  return (
    <Box className="campaign-communication-schedule">
      <Box className="campaign-communication-schedule-grid">
        <Typography className="campaign-communication-subtitle campaign-communication-schedule-heading">
          {t('Global Send Schedule')}
        </Typography>
        <Box className="campaign-communication-field-block">
          <Typography className="campaign-communication-field-label">
            {t('Message Time')}
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            inputProps={{ 'aria-label': String(t('Message Time')) }}
            value={messageTime}
            onChange={(event) => onMessageTimeChange(event.target.value)}
            error={!!messageTimeError}
            helperText={messageTimeError}
          >
            {timeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box className="campaign-communication-field-block">
          <Typography className="campaign-communication-field-label">
            {t('Poll Time')}
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            inputProps={{ 'aria-label': String(t('Poll Time')) }}
            value={pollTime}
            onChange={(event) => onPollTimeChange(event.target.value)}
            error={!!pollTimeError}
            helperText={pollTimeError}
          >
            {timeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Typography className="campaign-communication-schedule-note campaign-communication-schedule-note-mobile">
          {t('Applied globally across all campaign days.')}
        </Typography>
        <Typography className="campaign-communication-schedule-note campaign-communication-schedule-note-desktop">
          {t('Applied globally across all campaign days.')}
        </Typography>
      </Box>
    </Box>
  );
};
