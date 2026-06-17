import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Check } from '@mui/icons-material';
import './CampaignSetupStepper.css';

type CampaignSetupStepperProps = {
  activeStep?: number;
};

export const CampaignSetupStepper: React.FC<CampaignSetupStepperProps> = ({
  activeStep = 0,
}) => {
  const stepperRef = useRef<HTMLDivElement | null>(null);
  const activeStepRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(max-width: 48rem) and (orientation: portrait)')
        .matches ||
      !stepperRef.current ||
      !activeStepRef.current
    ) {
      return;
    }

    const container = stepperRef.current;
    const activeItem = activeStepRef.current;
    const targetLeft =
      activeItem.offsetLeft -
      container.clientWidth / 2 +
      activeItem.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, [activeStep]);

  return (
    <Box
      ref={stepperRef}
      className="campaign-setup-stepper"
      aria-label="Campaign steps"
    >
      <Box className="campaign-setup-stepper-track">
        {['Setup', 'Assignments', 'Rewards', 'Messaging', 'Review'].map(
          (step, index) => (
            <React.Fragment key={step}>
              <Box
                ref={index === activeStep ? activeStepRef : null}
                className={`campaign-setup-stepper-step ${
                  index === activeStep
                    ? 'campaign-setup-stepper-step-active'
                    : ''
                } ${index < activeStep ? 'campaign-setup-stepper-step-complete' : ''}`}
              >
                <span>{index < activeStep ? <Check /> : index + 1}</span>
                <strong>{step}</strong>
              </Box>
              {index < 4 && (
                <span className="campaign-setup-stepper-step-line" />
              )}
            </React.Fragment>
          ),
        )}
      </Box>
    </Box>
  );
};
