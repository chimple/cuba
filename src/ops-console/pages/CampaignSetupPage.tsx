import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { ServiceConfig } from '../../services/ServiceConfig';
import type {
  CampaignObjective,
  CampaignRewardType,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
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
  CampaignReviewData,
  CampaignReviewStep,
} from '../components/campaignSetup/CampaignReviewStep';
import { useCampaignSetupForm } from '../hooks/useCampaignSetupForm';
import { buildCampaignAudiencePayload } from '../hooks/campaignSetupFormHelpers';
import {
  CampaignCommunicationState,
  buildCampaignMessagingPayload,
  buildCommunicationTimelineDates,
  createEmptyCommunicationRow,
  getCampaignCommunicationValidation,
  isCommunicationRowConfigured,
} from '../components/campaignSetup/campaignCommunicationUtils';
import { useCampaignReach } from '../components/campaignSetup/useCampaignReach';
import logger from '../../utility/logger';
import './CampaignSetupPage.css';
import { t } from 'i18next';

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
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

  const { campaignReach } = useCampaignReach(selectedAssignmentSchoolIds);

  const targetAudienceStudentCount = useMemo(
    () =>
      campaignSetup.audienceSummary.grades.reduce(
        (total, grade) => total + grade.studentCount,
        0,
      ),
    [campaignSetup.audienceSummary.grades],
  );
  const hasNoTargetAudienceStudents =
    !campaignSetup.loadingAudienceSummary && targetAudienceStudentCount === 0;
  const canProceedFromCampaignSetup =
    campaignSetup.isFormValid && !hasNoTargetAudienceStudents;

  const messagingRows = useMemo(
    () =>
      buildCampaignMessagingPayload({
        campaignId: campaignSetup.createdCampaignId,
        timelineDates: communicationTimelineDates,
        communicationState,
      }),
    [
      campaignSetup.createdCampaignId,
      communicationState,
      communicationTimelineDates,
    ],
  );

  const reviewData: CampaignReviewData = useMemo(
    () => ({
      form: campaignSetup.form,
      managerName:
        campaignSetup.managers.find(
          (manager) => manager.id === campaignSetup.form.managerId,
        )?.name || '',
      programName: campaignSetup.selectedProgramName,
      selectedBlocks: campaignSetup.selectedBlocks,
      selectedSchools: campaignSetup.isAllSchools
        ? campaignSetup.audienceOptions.schools
        : campaignSetup.selectedSchools,
      selectedGrades: campaignSetup.isAllGrades
        ? campaignSetup.audienceOptions.grades
        : campaignSetup.selectedGrades,
      audienceSummary: campaignSetup.audienceSummary,
      assignmentDrafts: campaignSetup.assignmentDrafts,
      assignmentConfigs: campaignSetup.assignmentConfigs,
      campaignRewards: campaignSetup.campaignRewards,
      campaignReach,
      messageTime: communicationState.messageTime,
      pollTime: communicationState.pollTime,
      configuredCommunicationDayCount,
      messagingRows,
    }),
    [
      campaignReach,
      campaignSetup.assignmentConfigs,
      campaignSetup.assignmentDrafts,
      campaignSetup.audienceOptions.grades,
      campaignSetup.audienceOptions.schools,
      campaignSetup.audienceSummary,
      campaignSetup.campaignRewards,
      campaignSetup.form,
      campaignSetup.isAllGrades,
      campaignSetup.isAllSchools,
      campaignSetup.managers,
      campaignSetup.selectedBlocks,
      campaignSetup.selectedGrades,
      campaignSetup.selectedProgramName,
      campaignSetup.selectedSchools,
      communicationState.messageTime,
      communicationState.pollTime,
      configuredCommunicationDayCount,
      messagingRows,
    ],
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
    setLaunchMessage(null);
    if (!communicationValidation.isValid) return;

    setActiveStepSafe(4);
  }, [communicationValidation.isValid, setActiveStepSafe]);

  const handleLaunchCampaign = useCallback(async () => {
    setLaunchMessage(null);

    if (!campaignSetup.campaignRewards) {
      logger.warn('Campaign launch blocked by incomplete setup state:', {
        hasRewards: Boolean(campaignSetup.campaignRewards),
        isFormValid: campaignSetup.isFormValid,
      });
      setLaunchMessage({
        type: 'error',
        text: t('Complete campaign setup before launching.'),
      });
      return;
    }
    if (!campaignSetup.isFormValid) {
      logger.warn('Campaign launch blocked by invalid setup form:', {
        campaignId: campaignSetup.createdCampaignId,
      });
      setLaunchMessage({
        type: 'error',
        text: t('Complete campaign setup before launching.'),
      });
      return;
    }
    if (!isAssignmentComplete || campaignSetup.assignmentDrafts.length === 0) {
      setLaunchMessage({
        type: 'error',
        text: t('Complete assignment setup before launching.'),
      });
      return;
    }
    if (!communicationValidation.isValid || messagingRows.length === 0) {
      setLaunchMessage({
        type: 'error',
        text: t('Complete communication setup before launching.'),
      });
      return;
    }

    setLaunching(true);
    try {
      const currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User is not logged in.');
      }

      const campaign = {
        programId: campaignSetup.form.programId,
        campaignName: campaignSetup.form.campaignName.trim(),
        objective: campaignSetup.form.objective as CampaignObjective,
        targetType:
          campaignSetup.form.objective === 'homework_campaign'
            ? (campaignSetup.form.targetType as CampaignTargetType)
            : undefined,
        targetValue:
          campaignSetup.form.objective === 'homework_campaign'
            ? Number(campaignSetup.form.targetValue)
            : campaignSetup.form.objective ===
                'homepage_learning_pathway_campaign'
              ? Number(campaignSetup.form.learningPathCount)
              : undefined,
        managerId: campaignSetup.form.managerId,
        startDate: campaignSetup.form.startDate,
        endDate: campaignSetup.form.endDate,
      };
      const rewards = {
        type: campaignSetup.campaignRewards.type as CampaignRewardType,
        rules: campaignSetup.campaignRewards.rules,
      };
      const campaignId =
        campaignSetup.createdCampaignId ||
        (
          await ServiceConfig.getI().apiHandler.createCampaignSetup({
            ...buildCampaignAudiencePayload(
              campaignSetup.form,
              campaignSetup.saveGroup,
              {
                isAllSchools: campaignSetup.isAllSchools,
                isAllGrades: campaignSetup.isAllGrades,
                selectedSchoolIds: campaignSetup.selectedSchoolIds,
                selectedGradeIds: campaignSetup.selectedGradeIds,
              },
            ),
            ...campaign,
            rewards,
            savedAudienceGroupId:
              campaignSetup.selectedSavedGroupId || undefined,
          })
        ).campaignId;

      campaignSetup.setCreatedCampaignId(campaignId);

      await ServiceConfig.getI().apiHandler.launchCampaign({
        campaignId,
        currentUserId: currentUser.id,
        rewards,
        assignments: campaignSetup.assignmentDrafts.map((assignment) => ({
          gradeId: assignment.gradeId,
          schoolIds: assignment.schoolIds,
          courseId: assignment.courseId,
          chapterId: assignment.chapterId,
          lessonId: assignment.lessonId,
          startsAt: assignment.startsAt,
          endsAt: assignment.endsAt,
          type: assignment.type,
          source: assignment.source,
          setNumber: assignment.setNumber,
        })),
        messagingRows: messagingRows.map((row) => ({
          messageTime: row.message_time,
          pollTime: row.poll_time,
          message: row.message,
          mediaLink: row.media_link,
          poll: row.poll,
        })),
      });
      setLaunchMessage({
        type: 'success',
        text: t('Campaign launched successfully.'),
      });
      history.goBack();
    } catch (error) {
      logger.error('Failed to launch campaign:', error);
      setLaunchMessage({
        type: 'error',
        text: t('Unable to launch campaign.'),
      });
    } finally {
      setLaunching(false);
    }
  }, [
    campaignSetup.createdCampaignId,
    campaignSetup.form,
    campaignSetup.isFormValid,
    campaignSetup.isAllGrades,
    campaignSetup.isAllSchools,
    campaignSetup.campaignRewards,
    campaignSetup.assignmentDrafts,
    communicationValidation.isValid,
    history,
    isAssignmentComplete,
    messagingRows,
    campaignSetup.saveGroup,
    campaignSetup.selectedGradeIds,
    campaignSetup.selectedSavedGroupId,
    campaignSetup.selectedSchoolIds,
    campaignSetup.setCreatedCampaignId,
    t,
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
          onLaunchCampaign={handleLaunchCampaign}
        />
      </Box>
    </Box>
  );
};

export default CampaignSetupPage;
