import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CampaignMessagingRowPayload } from './campaignCommunicationUtils';

export type CampaignSummaryData = {
  campaignName: string;
  startDate: string;
  endDate: string;
  messageTime: string;
  pollTime: string;
  configuredCommunicationDayCount: number;
  messagingRows: CampaignMessagingRowPayload[];
};

type CampaignSetupSummaryProps = {
  summaryData: CampaignSummaryData | null;
};

export const CampaignSetupSummary: React.FC<CampaignSetupSummaryProps> = ({
  summaryData,
}) => {
  const { t } = useTranslation();

  return (
    <Box className="campaign-setup-section">
      <Typography variant="h6" className="campaign-setup-section-title">
        {t('Summary')}
      </Typography>
      <Typography className="campaign-setup-section-copy">
        {summaryData?.configuredCommunicationDayCount
          ? t('{{count}} campaign day(s) are configured for communication.', {
              count: summaryData.configuredCommunicationDayCount,
            })
          : t('No campaign communication days have been configured yet.')}
      </Typography>
      <Typography className="campaign-setup-section-copy">
        {t('Campaign')}: {summaryData?.campaignName || '--'} | {t('Dates')}:{' '}
        {summaryData?.startDate || '--'} {t('to')}{' '}
        {summaryData?.endDate || '--'}
      </Typography>
      <Typography className="campaign-setup-section-copy">
        {t('Message Time')}: {summaryData?.messageTime || '--'} |{' '}
        {t('Poll Time')}: {summaryData?.pollTime || '--'}
      </Typography>
    </Box>
  );
};
