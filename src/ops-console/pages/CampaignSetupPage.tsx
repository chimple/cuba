import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { ArrowBack, ChevronRight, Notifications } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import {
  CampaignAssignmentStep,
  CampaignDetailsSection,
  CampaignSetupStepper,
  ObjectiveGoalSection,
  RewardsConfigurationSection,
  TargetAudienceSection,
} from '../components/CampaignSetupSections';
import { useCampaignSetupForm } from '../hooks/useCampaignSetupForm';
import './CampaignSetupPage.css';

const CampaignSetupPage: React.FC = () => {
  const history = useHistory();
  const campaignSetup = useCampaignSetupForm();
  const [isAssignmentComplete, setIsAssignmentComplete] = useState(false);

  const handleAssignmentCompletionChange = useCallback(
    (isComplete: boolean) => {
      setIsAssignmentComplete(isComplete);
    },
    [],
  );

  const selectedAssignmentSchoolIds = useMemo(
    () =>
      campaignSetup.isAllSchools
        ? campaignSetup.audienceOptions.schools.map((school) => school.id)
        : campaignSetup.selectedSchools.map((school) => school.id),
    [
      campaignSetup.audienceOptions.schools,
      campaignSetup.isAllSchools,
      campaignSetup.selectedSchools,
    ],
  );

  useEffect(() => {
    document.body.classList.add('campaign-setup-active');
    return () => {
      document.body.classList.remove('campaign-setup-active');
    };
  }, []);

  if (campaignSetup.loadingInitial) {
    return (
      <Box className="campaign-setup-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="campaign-setup-page">
      <Box className="campaign-setup-header">
        <IconButton
          className="campaign-setup-back-button"
          onClick={() => history.goBack()}
          aria-label="Back"
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" className="campaign-setup-title">
            New Campaign
          </Typography>
          <Box className="campaign-setup-breadcrumb">
            <span>Campaigns</span>
            <ChevronRight className="campaign-setup-breadcrumb-icon" />
            <strong>New Campaign</strong>
          </Box>
        </Box>
        <Notifications className="campaign-setup-notification" />
      </Box>

      {campaignSetup.message && (
        <Alert
          severity={campaignSetup.message.type}
          className="campaign-setup-alert"
        >
          {campaignSetup.message.text}
        </Alert>
      )}

      <Box
        component="form"
        className="campaign-setup-form"
        onSubmit={campaignSetup.handleSubmit}
      >
        <Box className="campaign-setup-scroll-area">
          <CampaignSetupStepper activeStep={campaignSetup.activeStep} />

          {campaignSetup.activeStep === 0 ? (
            <>
              <ObjectiveGoalSection
                form={campaignSetup.form}
                onObjectiveChange={campaignSetup.handleObjectiveChange}
                onSelectChange={campaignSetup.handleSelectChange}
                onNumericChange={campaignSetup.updateNumericForm}
                fieldError={campaignSetup.fieldError}
              />

              <CampaignDetailsSection
                form={campaignSetup.form}
                managers={campaignSetup.managers}
                onTextChange={campaignSetup.updateForm}
                onSelectChange={campaignSetup.handleSelectChange}
                fieldError={campaignSetup.fieldError}
              />

              <TargetAudienceSection
                form={campaignSetup.form}
                programs={campaignSetup.programs}
                savedGroups={campaignSetup.savedGroups}
                selectedSavedGroupId={campaignSetup.selectedSavedGroupId}
                audienceOptions={campaignSetup.audienceOptions}
                selectedBlocks={campaignSetup.selectedBlocks}
                selectedSchools={campaignSetup.selectedSchools}
                selectedGrades={campaignSetup.selectedGrades}
                schoolsForSelectedBlocks={
                  campaignSetup.schoolsForSelectedBlocks
                }
                loadingAudience={campaignSetup.loadingAudience}
                selectedProgramName={campaignSetup.selectedProgramName}
                summaryBlockCount={campaignSetup.summaryBlockCount}
                summarySchoolCount={campaignSetup.summarySchoolCount}
                loadingAudienceSummary={campaignSetup.loadingAudienceSummary}
                audienceSummary={campaignSetup.audienceSummary}
                saveGroup={campaignSetup.saveGroup}
                savingGroup={campaignSetup.savingGroup}
                onSavedGroupChange={campaignSetup.handleSavedGroupChange}
                onProgramChange={campaignSetup.handleProgramChange}
                onBlocksChange={campaignSetup.handleBlocksChange}
                onSchoolsChange={campaignSetup.handleSchoolsChange}
                onGradesChange={campaignSetup.handleGradesChange}
                onSaveGroupChange={campaignSetup.setSaveGroup}
                onGroupNameChange={campaignSetup.updateForm('groupName')}
                onSaveGroup={campaignSetup.handleSaveGroup}
                onCancelSaveGroup={() => {
                  campaignSetup.setSaveGroup(false);
                  campaignSetup.setForm((current) => ({
                    ...current,
                    groupName: '',
                  }));
                }}
                fieldError={campaignSetup.fieldError}
              />
            </>
          ) : campaignSetup.activeStep === 1 ? (
            <CampaignAssignmentStep
              form={campaignSetup.form}
              campaignId={campaignSetup.createdCampaignId}
              selectedGrades={campaignSetup.selectedGrades}
              selectedSchoolIds={selectedAssignmentSchoolIds}
              activeGradeId={campaignSetup.activeAssignmentGradeId}
              configs={campaignSetup.assignmentConfigs}
              onActiveGradeChange={campaignSetup.setActiveAssignmentGradeId}
              onConfigsChange={campaignSetup.setAssignmentConfigs}
              onCompletionChange={handleAssignmentCompletionChange}
              onAssignmentsChange={campaignSetup.handleAssignmentDraftsChange}
            />
          ) : campaignSetup.activeStep === 2 ? (
            <RewardsConfigurationSection
              form={campaignSetup.form}
              onSelectChange={campaignSetup.handleSelectChange}
              onRewardRankChange={campaignSetup.updateRewardRank}
              fieldError={campaignSetup.rewardFieldError}
            />
          ) : (
            <Box className="campaign-setup-section">
              <Typography variant="h6" className="campaign-setup-section-title">
                Messaging
              </Typography>
              <Typography className="campaign-setup-section-copy">
                Messaging setup is not available in this flow yet.
              </Typography>
            </Box>
          )}
        </Box>

        <Box className="campaign-setup-actions">
          {campaignSetup.activeStep > 0 && (
            <Button
              type="button"
              variant="outlined"
              className="campaign-setup-back-cta"
              onClick={() =>
                campaignSetup.setActiveStep(
                  campaignSetup.activeStep === 1 ||
                    (campaignSetup.activeStep === 2 &&
                      campaignSetup.form.objective ===
                        'homepage_learning_pathway_campaign')
                    ? 0
                    : campaignSetup.activeStep - 1,
                )
              }
            >
              Back
            </Button>
          )}
          {campaignSetup.activeStep === 1 && !isAssignmentComplete && (
            <Typography className="campaign-setup-page-assignment-cta-error">
              Please complete the assignment setup for all selected grades
              before proceeding.
            </Typography>
          )}
          <Button
            type={campaignSetup.activeStep === 0 ? 'submit' : 'button'}
            variant="contained"
            endIcon={
              campaignSetup.submitting ? (
                <CircularProgress size={18} />
              ) : undefined
            }
            disabled={
              campaignSetup.activeStep === 0
                ? !campaignSetup.isFormValid || campaignSetup.submitting
                : campaignSetup.activeStep === 1
                  ? !isAssignmentComplete
                  : campaignSetup.activeStep === 2
                    ? false
                    : true
            }
            onClick={
              campaignSetup.activeStep === 1
                ? () => campaignSetup.setActiveStep(2)
                : campaignSetup.activeStep === 2
                  ? campaignSetup.handleRewardsSubmit
                  : undefined
            }
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignSetupPage;
