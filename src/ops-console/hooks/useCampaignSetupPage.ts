import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CAMPAIGN_OBJECTIVE, PAGES } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import type {
  CampaignObjective,
  CampaignRewardType,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
import type { CampaignReviewData } from '../components/campaignSetup/CampaignReviewStep';
import { useCampaignSetupForm } from './useCampaignSetupForm';
import { buildCampaignAudiencePayload } from './campaignSetupFormHelpers';
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
import { t } from 'i18next';

export const useCampaignSetupPage = () => {
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

  const selectedAssignmentSchoolIds = campaignSetup.selectedAssignmentSchoolIds;

  const communicationTimelineDates = useMemo(
    () =>
      buildCommunicationTimelineDates(
        campaignSetup.assignmentDrafts,
        campaignSetup.form,
        campaignSetup.assignmentFrequency,
      ),
    [
      campaignSetup.assignmentDrafts,
      campaignSetup.assignmentFrequency,
      campaignSetup.form,
    ],
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

  const { campaignReach, loadingReach } = useCampaignReach(
    selectedAssignmentSchoolIds,
    campaignSetup.activeStep >= 3,
  );

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
  const isHomepageLearningPathwayCampaign =
    campaignSetup.form.objective ===
    CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY;
  const stepperSteps = isHomepageLearningPathwayCampaign
    ? ['Setup', 'Rewards', 'Messaging', 'Review']
    : ['Setup', 'Assignments', 'Rewards', 'Messaging', 'Review'];
  const stepperActiveStep = isHomepageLearningPathwayCampaign
    ? [0, 2, 3, 4].indexOf(campaignSetup.activeStep)
    : campaignSetup.activeStep;

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
        ? campaignSetup.availableGrades
        : campaignSetup.selectedGrades,
      audienceSummary: campaignSetup.audienceSummary,
      assignmentDrafts: campaignSetup.assignmentDrafts,
      assignmentConfigs: campaignSetup.assignmentConfigs,
      campaignRewards: campaignSetup.campaignRewards,
      campaignReach,
      messageTime: communicationState.messageTime,
      pollTime: communicationState.pollTime,
      applicableMessageDayCount: communicationTimelineDates.length,
      configuredCommunicationDayCount,
      messagingRows,
    }),
    [
      campaignReach,
      campaignSetup.assignmentConfigs,
      campaignSetup.assignmentDrafts,
      campaignSetup.availableGrades,
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
      communicationTimelineDates.length,
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

  const handleMessageTimeChange = useCallback((value: string) => {
    setCommunicationState((current) => ({
      ...current,
      messageTime: value,
    }));
  }, []);

  const handlePollTimeChange = useCallback((value: string) => {
    setCommunicationState((current) => ({
      ...current,
      pollTime: value,
    }));
  }, []);

  const handleClearCommunicationRow = useCallback((date: string) => {
    setCommunicationState((current) => ({
      ...current,
      rows: {
        ...current.rows,
        [date]: createEmptyCommunicationRow(),
      },
    }));
  }, []);

  const setActiveStepSafe = useCallback(
    (nextStep: number) => {
      setCommunicationAttempted(false);
      campaignSetup.setActiveStep(nextStep);
    },
    [campaignSetup],
  );

  const handleCompletedStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= stepperActiveStep) return;

      const activeStep = isHomepageLearningPathwayCampaign
        ? [0, 2, 3, 4][stepIndex]
        : stepIndex;
      setActiveStepSafe(activeStep);
    },
    [isHomepageLearningPathwayCampaign, setActiveStepSafe, stepperActiveStep],
  );

  const handleBackStep = useCallback(() => {
    if (campaignSetup.activeStep === 0) return;

    setActiveStepSafe(
      campaignSetup.activeStep === 1 ||
        (campaignSetup.activeStep === 2 &&
          campaignSetup.form.objective ===
            CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY)
        ? 0
        : campaignSetup.activeStep - 1,
    );
  }, [
    campaignSetup.activeStep,
    campaignSetup.form.objective,
    setActiveStepSafe,
  ]);

  const handleHeaderBack = useCallback(() => {
    if (campaignSetup.activeStep > 0) {
      handleBackStep();
      return;
    }

    history.replace(`${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}`);
  }, [campaignSetup.activeStep, handleBackStep, history]);

  const handleOpenCampaignListing = useCallback(() => {
    history.replace(`${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}`);
  }, [history]);

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
    if (
      !isHomepageLearningPathwayCampaign &&
      (!isAssignmentComplete || campaignSetup.assignmentDrafts.length === 0)
    ) {
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
        frequency: campaignSetup.assignmentFrequency,
        objective: campaignSetup.form.objective as CampaignObjective,
        targetType:
          campaignSetup.form.objective === CAMPAIGN_OBJECTIVE.HOMEWORK
            ? (campaignSetup.form.targetType as CampaignTargetType)
            : undefined,
        targetValue:
          campaignSetup.form.objective === CAMPAIGN_OBJECTIVE.HOMEWORK
            ? Number(campaignSetup.form.targetValue)
            : campaignSetup.form.objective ===
                CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY
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
        objective: campaign.objective,
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
      history.replace(`${PAGES.SIDEBAR_PAGE}${PAGES.ADMIN_CAMPAIGNS}`);
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
    isHomepageLearningPathwayCampaign,
    messagingRows,
    campaignSetup.saveGroup,
    campaignSetup.selectedGradeIds,
    campaignSetup.selectedSavedGroupId,
    campaignSetup.selectedSchoolIds,
    campaignSetup.setCreatedCampaignId,
  ]);

  useEffect(() => {
    document.body.classList.add('campaign-setup-active');
    return () => {
      document.body.classList.remove('campaign-setup-active');
    };
  }, []);

  return {
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
  };
};
