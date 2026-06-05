import React from 'react';
import { Button, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type CampaignSetupActionsProps = {
  activeStep: number;
  isAssignmentComplete: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
  onBackStep: () => void;
  onSetupSubmit: () => void;
  onGoToRewards: () => void;
  onRewardsSubmit: () => void;
  onContinueToSummary: () => void;
  onDone: () => void;
};

export const CampaignSetupActions: React.FC<CampaignSetupActionsProps> = ({
  activeStep,
  isAssignmentComplete,
  isFormValid,
  isSubmitting,
  onBackStep,
  onSetupSubmit,
  onGoToRewards,
  onRewardsSubmit,
  onContinueToSummary,
  onDone,
}) => {
  const { t } = useTranslation();

  const isDisabled =
    activeStep === 0
      ? !isFormValid || isSubmitting
      : activeStep === 1
        ? !isAssignmentComplete
        : false;

  const handleNextClick = () => {
    if (activeStep === 0) {
      onSetupSubmit();
      return;
    }
    if (activeStep === 1) {
      onGoToRewards();
      return;
    }
    if (activeStep === 2) {
      onRewardsSubmit();
      return;
    }
    if (activeStep === 3) {
      onContinueToSummary();
      return;
    }
    onDone();
  };

  return (
    <div className="campaign-setup-actions">
      {activeStep > 0 && (
        <Button
          type="button"
          variant="outlined"
          className="campaign-setup-back-cta"
          onClick={onBackStep}
        >
          {t('Back')}
        </Button>
      )}
      {activeStep === 1 && !isAssignmentComplete && (
        <Typography className="campaign-setup-page-assignment-cta-error">
          {t(
            'Please complete the assignment setup for all selected grades before proceeding.',
          )}
        </Typography>
      )}
      <Button
        type="button"
        variant="contained"
        className="campaign-setup-primary-cta"
        endIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
        disabled={isDisabled}
        onClick={handleNextClick}
      >
        {activeStep === 3
          ? t('Continue to Summary')
          : activeStep === 4
            ? t('Done')
            : t('Next')}
      </Button>
    </div>
  );
};
