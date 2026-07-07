import React from 'react';
import { ArrowBack, ChevronRight, Notifications } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type CampaignSetupHeaderProps = {
  onBack: () => void;
  onOpenCampaignListing: () => void;
};

export const CampaignSetupHeader: React.FC<CampaignSetupHeaderProps> = ({
  onBack,
  onOpenCampaignListing,
}) => {
  const { t } = useTranslation();

  return (
    <Box className="campaign-setup-header">
      <IconButton
        className="campaign-setup-back-button"
        onClick={onBack}
        aria-label={String(t('Back'))}
      >
        <ArrowBack />
      </IconButton>
      <Box>
        <Typography variant="h4" className="campaign-setup-title">
          {t('New Campaign')}
        </Typography>
        <Box className="campaign-setup-breadcrumb">
          <button
            type="button"
            className="campaign-setup-breadcrumb-link"
            onClick={onOpenCampaignListing}
          >
            {t('Campaigns')}
          </button>
          <ChevronRight className="campaign-setup-breadcrumb-icon" />
          <strong>{t('New Campaign')}</strong>
        </Box>
      </Box>
      <Notifications className="campaign-setup-notification" />
    </Box>
  );
};
