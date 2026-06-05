import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useHistory } from 'react-router-dom';
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
import {
  CampaignSetupSummary,
  CampaignSummaryData,
} from '../components/campaignSetup/CampaignSetupSummary';
import { useCampaignSetupForm } from '../hooks/useCampaignSetupForm';
import {
  CampaignCommunicationState,
  buildCampaignMessagingPayload,
  buildCommunicationTimelineDates,
  createEmptyCommunicationRow,
  getCampaignCommunicationValidation,
  isCommunicationRowConfigured,
} from '../components/campaignSetup/campaignCommunicationUtils';
import './CampaignSetupPage.css';

const CampaignSetupPage: React.FC = () => {
  const history = useHistory();
  const campaignSetup = useCampaignSetupForm();
  const [isAssignmentComplete, setIsAssignmentComplete] = useState(false);
  const [communicationAttempted, setCommunicationAttempted] = useState(false);
  const [communicationState, setCommunicationState] =
    useState<CampaignCommunicationState>({
      messageTime: '',
      pollTime: '',
      rows: {},
    });
  const [summaryData, setSummaryData] = useState<CampaignSummaryData | null>(
    null,
  );

  const handleAssignmentCompletionChange = useCallback(
    (isComplete: boolean) => setIsAssignmentComplete(isComplete),
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

  const communicationTimelineDates = useMemo(
    () => buildCommunicationTimelineDates(campaignSetup.assignmentDrafts),
    [campaignSetup.assignmentDrafts],
  );

  const communicationValidation = useMemo(
    () =>
      getCampaignCommunicationValidation(
        communicationState,
        communicationTimelineDates,
      ),
    [communicationState, communicationTimelineDates],
  );

  const configuredCommunicationDayCount = useMemo(
    () =>
      communicationTimelineDates.filter((date) =>
        isCommunicationRowConfigured(communicationState.rows[date]),
      ).length,
    [communicationState.rows, communicationTimelineDates],
  );

  const handleCommunicationRowChange = useCallback(
    (
      date: string,
      updater: (
        row: ReturnType<typeof createEmptyCommunicationRow>,
      ) => ReturnType<typeof createEmptyCommunicationRow>,
    ) => {
      setCommunicationState((current) => ({
        ...current,
        rows: {
          ...current.rows,
          [date]: updater(current.rows[date] ?? createEmptyCommunicationRow()),
        },
      }));
    },
    [],
  );

  const setActiveStepSafe = useCallback(
    (nextStep: number) => {
      setCommunicationAttempted(false);
      campaignSetup.setActiveStep(nextStep);
    },
    [campaignSetup],
  );

  const handleCommunicationContinue = useCallback(() => {
    setCommunicationAttempted(true);
    if (!communicationValidation.isValid) return;

    setSummaryData({
      campaignName: campaignSetup.form.campaignName.trim(),
      startDate: campaignSetup.form.startDate,
      endDate: campaignSetup.form.endDate,
      messageTime: communicationState.messageTime,
      pollTime: communicationState.pollTime,
      configuredCommunicationDayCount,
      messagingRows: buildCampaignMessagingPayload({
        campaignId: campaignSetup.createdCampaignId,
        timelineDates: communicationTimelineDates,
        communicationState,
      }),
    });
    setActiveStepSafe(4);
  }, [
    campaignSetup.createdCampaignId,
    campaignSetup.form.campaignName,
    campaignSetup.form.endDate,
    campaignSetup.form.startDate,
    communicationState,
    communicationTimelineDates,
    communicationValidation.isValid,
    configuredCommunicationDayCount,
    setActiveStepSafe,
  ]);

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
      <CampaignSetupHeader onBack={() => history.goBack()} />

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
          ) : campaignSetup.activeStep === 3 ? (
            <CampaignCommunicationTimelineStep
              form={campaignSetup.form}
              assignmentDrafts={campaignSetup.assignmentDrafts}
              selectedSchoolIds={selectedAssignmentSchoolIds}
              communicationState={communicationState}
              communicationValidation={communicationValidation}
              showValidation={communicationAttempted}
              onMessageTimeChange={(value) =>
                setCommunicationState((current) => ({
                  ...current,
                  messageTime: value,
                }))
              }
              onPollTimeChange={(value) =>
                setCommunicationState((current) => ({
                  ...current,
                  pollTime: value,
                }))
              }
              onRowChange={handleCommunicationRowChange}
              onClearRow={(date) =>
                setCommunicationState((current) => ({
                  ...current,
                  rows: {
                    ...current.rows,
                    [date]: createEmptyCommunicationRow(),
                  },
                }))
              }
            />
          ) : (
            <CampaignSetupSummary summaryData={summaryData} />
          )}
        </Box>

        <CampaignSetupActions
          activeStep={campaignSetup.activeStep}
          isAssignmentComplete={isAssignmentComplete}
          isFormValid={campaignSetup.isFormValid}
          isSubmitting={campaignSetup.submitting}
          onBackStep={() =>
            setActiveStepSafe(
              campaignSetup.activeStep === 1 ||
                (campaignSetup.activeStep === 2 &&
                  campaignSetup.form.objective ===
                    'homepage_learning_pathway_campaign')
                ? 0
                : campaignSetup.activeStep - 1,
            )
          }
          onSetupSubmit={campaignSetup.handleSubmit}
          onGoToRewards={() => setActiveStepSafe(2)}
          onRewardsSubmit={campaignSetup.handleRewardsSubmit}
          onContinueToSummary={handleCommunicationContinue}
          onDone={() => history.goBack()}
        />
      </Box>
    </Box>
  );
};

export default CampaignSetupPage;
