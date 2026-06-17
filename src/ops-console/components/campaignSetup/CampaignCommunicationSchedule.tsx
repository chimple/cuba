import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CompactTimePickerField } from './CompactTimePickerField';

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
          <CompactTimePickerField
            label={String(t('Message Time'))}
            value={messageTime}
            error={messageTimeError}
            onChange={onMessageTimeChange}
          />
        </Box>
        <Box className="campaign-communication-field-block">
          <Typography className="campaign-communication-field-label">
            {t('Poll Time')}
          </Typography>
          <CompactTimePickerField
            label={String(t('Poll Time'))}
            value={pollTime}
            error={pollTimeError}
            onChange={onPollTimeChange}
          />
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
