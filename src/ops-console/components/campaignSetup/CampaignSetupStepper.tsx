import React from 'react';
import { Box } from '@mui/material';

type CampaignSetupStepperProps = {
  activeStep?: number;
};

export const CampaignSetupStepper: React.FC<CampaignSetupStepperProps> = ({
  activeStep = 0,
}) => (
  <Box className="campaign-setup-stepper" aria-label="Campaign steps">
    {['Setup', 'Assignments', 'Rewards', 'Messaging'].map((step, index) => (
      <React.Fragment key={step}>
        <Box
          className={`campaign-setup-step ${
            index === activeStep ? 'campaign-setup-step-active' : ''
          }`}
        >
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </Box>
        {index < 3 && <span className="campaign-setup-step-line" />}
      </React.Fragment>
    ))}
  </Box>
);
