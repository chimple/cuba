import React from 'react';
import { Box } from '@mui/material';
import { Check } from '@mui/icons-material';
import './CampaignSetupStepper.css';

type CampaignSetupStepperProps = {
  activeStep?: number;
};

export const CampaignSetupStepper: React.FC<CampaignSetupStepperProps> = ({
  activeStep = 0,
}) => (
  <Box className="campaign-setup-stepper" aria-label="Campaign steps">
    {['Setup', 'Assignments', 'Rewards', 'Messaging', 'Review'].map(
      (step, index) => (
        <React.Fragment key={step}>
          <Box
            className={`campaign-setup-stepper-step ${
              index === activeStep ? 'campaign-setup-stepper-step-active' : ''
            } ${index < activeStep ? 'campaign-setup-stepper-step-complete' : ''}`}
          >
            <span>{index < activeStep ? <Check /> : index + 1}</span>
            <strong>{step}</strong>
          </Box>
          {index < 4 && <span className="campaign-setup-stepper-step-line" />}
        </React.Fragment>
      ),
    )}
  </Box>
);
