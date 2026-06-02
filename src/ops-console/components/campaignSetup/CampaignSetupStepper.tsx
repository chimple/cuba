import React from 'react';
import { Box } from '@mui/material';
import { Check } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './CampaignSetupStepper.css';

type CampaignSetupStepperProps = {
  activeStep?: number;
};

export const CampaignSetupStepper: React.FC<CampaignSetupStepperProps> = ({
  activeStep = 0,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      className="campaign-setup-stepper"
      aria-label={String(t('Campaign steps'))}
    >
      {['Setup', 'Assignments', 'Rewards', 'Messaging', 'Summary'].map(
        (step, index) => (
          <React.Fragment key={step}>
            <Box
              className={`campaign-setup-step ${
                index === activeStep ? 'campaign-setup-step-active' : ''
              } ${index < activeStep ? 'campaign-setup-step-complete' : ''}`}
            >
              <span>{index < activeStep ? <Check /> : index + 1}</span>
              <strong>{t(step)}</strong>
            </Box>
            {index < 4 && <span className="campaign-setup-step-line" />}
          </React.Fragment>
        ),
      )}
    </Box>
  );
};
