import React from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import {
  CampaignCommunicationTimelineStep,
  CampaignAssignmentStep,
  CampaignDetailsSection,
  CampaignSetupStepper,
  ObjectiveGoalSection,
  RewardsConfigurationSection,
  TargetAudienceSection,
} from '../components/CampaignSetupSections';
import { CampaignSetupActions } from '../components/campaignSetup/CampaignSetupActions';
import { CampaignSetupHeader } from '../components/campaignSetup/CampaignSetupHeader';
import { CampaignReviewStep } from '../components/campaignSetup/CampaignReviewStep';
import './CampaignSetupPage.css';
import { useCampaignSetupPage } from '../hooks/useCampaignSetupPage';

const CampaignSetupPage: React.FC = () => {
  const {
    campaignSetup,
    canProceedFromCampaignSetup,
    communicationAttempted,
    communicationState,
    communicationValidation,
    handleAssignmentCompletionChange,
    handleBackStep,
    handleClearCommunicationRow,
    handleCompletedStepClick,
    handleCommunicationContinue,
    handleCommunicationRowChange,
    handleHeaderBack,
    handleLaunchCampaign,
    handleMessageTimeChange,
    handleOpenCampaignListing,
    handlePollTimeChange,
    isAssignmentComplete,
    launchMessage,
    launching,
    loadingReach,
    reviewData,
    selectedAssignmentSchoolIds,
    setActiveStepSafe,
    stepperActiveStep,
    stepperSteps,
  } = useCampaignSetupPage();

  if (campaignSetup.loadingInitial) {
    return (
      <Box className="campaign-setup-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="campaign-setup-page">
      <CampaignSetupHeader
        onBack={handleHeaderBack}
        onOpenCampaignListing={handleOpenCampaignListing}
      />

      {(campaignSetup.message || launchMessage) && (
        <Alert
          severity={(launchMessage ?? campaignSetup.message)?.type}
          className="campaign-setup-alert"
        >
          {(launchMessage ?? campaignSetup.message)?.text}
        </Alert>
      )}

      <Box
        component="form"
        className="campaign-setup-form"
        onSubmit={campaignSetup.handleSubmit}
      >
        <Box className="campaign-setup-scroll-area">
          <CampaignSetupStepper
            activeStep={Math.max(0, stepperActiveStep)}
            steps={stepperSteps}
            onStepClick={handleCompletedStepClick}
          />

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
                availableGrades={campaignSetup.availableGrades}
                selectedBlocks={campaignSetup.selectedBlocks}
                selectedSchools={campaignSetup.selectedSchools}
                selectedGrades={campaignSetup.selectedGrades}
                hasCustomBlockSelection={campaignSetup.hasCustomBlockSelection}
                hasCustomSchoolSelection={
                  campaignSetup.hasCustomSchoolSelection
                }
                hasCustomGradeSelection={campaignSetup.hasCustomGradeSelection}
                schoolsForSelectedBlocks={
                  campaignSetup.schoolsForSelectedBlocks
                }
                loadingAudience={campaignSetup.loadingAudience}
                loadingGrades={campaignSetup.loadingGrades}
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
              assignmentOptions={campaignSetup.assignmentOptions}
              loadingAssignmentOptions={campaignSetup.loadingAssignmentOptions}
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
          ) : campaignSetup.activeStep === 3 ? (
            <CampaignCommunicationTimelineStep
              form={campaignSetup.form}
              frequency={campaignSetup.assignmentFrequency}
              assignmentDrafts={campaignSetup.assignmentDrafts}
              campaignReach={reviewData.campaignReach}
              loadingReach={loadingReach}
              communicationState={communicationState}
              communicationValidation={communicationValidation}
              showValidation={communicationAttempted}
              onMessageTimeChange={handleMessageTimeChange}
              onPollTimeChange={handlePollTimeChange}
              onRowChange={handleCommunicationRowChange}
              onClearRow={handleClearCommunicationRow}
            />
          ) : (
            <CampaignReviewStep
              reviewData={reviewData}
              onEditStep={setActiveStepSafe}
            />
          )}
        </Box>

        <CampaignSetupActions
          activeStep={campaignSetup.activeStep}
          isAssignmentComplete={isAssignmentComplete}
          isFormValid={canProceedFromCampaignSetup}
          isSubmitting={campaignSetup.submitting || launching}
          onBackStep={handleBackStep}
          onSetupSubmit={campaignSetup.handleSubmit}
          onGoToRewards={() => setActiveStepSafe(2)}
          onRewardsSubmit={campaignSetup.handleRewardsSubmit}
          onContinueToSummary={handleCommunicationContinue}
          onLaunchCampaign={handleLaunchCampaign}
        />
      </Box>
    </Box>
  );
};

export default CampaignSetupPage;
