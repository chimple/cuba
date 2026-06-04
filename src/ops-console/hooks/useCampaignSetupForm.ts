import { useCallback, useEffect, useMemo, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  CampaignObjective,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
import logger from '../../utility/logger';
import { CampaignSetupFormState } from '../components/CampaignSetupSections';
import {
  CampaignAssignmentDraft,
  createDefaultConfig,
  GradeAssignmentConfig,
  isAlternateWeekEnabled,
} from '../components/campaignSetup/campaignAssignmentUtils';
import {
  buildCampaignAudiencePayload,
  buildSavedGroupNameSet,
  buildCampaignRewardsPayload,
  getCampaignRewardsValidationErrors,
  getCampaignSetupValidationErrors,
  hasDuplicateSavedGroupName,
  initialCampaignSetupForm,
  resetObjectiveFields,
  usesLessonRewardCriteria,
} from './campaignSetupFormHelpers';
import type { CampaignRewardsDraftPayload } from './campaignSetupFormHelpers';
import {
  CampaignSetupMessage,
  useCampaignAudienceSelection,
} from './useCampaignAudienceSelection';

const getAssignmentDraftKey = (draft: CampaignAssignmentDraft) =>
  [
    draft.batchId,
    draft.gradeId,
    draft.courseId,
    draft.chapterId,
    draft.lessonId,
    draft.startsAt,
    draft.setNumber,
    draft.schoolIds.join(','),
  ].join('|');

export const useCampaignSetupForm = () => {
  const { t } = useTranslation();
  const api = ServiceConfig.getI().apiHandler;

  const [form, setForm] = useState<CampaignSetupFormState>(
    initialCampaignSetupForm,
  );
  const [programs, setPrograms] = useState<CampaignOption[]>([]);
  const [managers, setManagers] = useState<CampaignOption[]>([]);
  const [savedGroups, setSavedGroups] = useState<CampaignSavedAudienceGroup[]>(
    [],
  );
  const [saveGroup, setSaveGroup] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingGroup, setSavingGroup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [createdCampaignId, setCreatedCampaignId] = useState('');
  const [campaignRewards, setCampaignRewards] =
    useState<CampaignRewardsDraftPayload | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<
    CampaignAssignmentDraft[]
  >([]);
  const [assignmentConfigs, setAssignmentConfigs] = useState<
    Record<string, GradeAssignmentConfig>
  >({});
  const [activeAssignmentGradeId, setActiveAssignmentGradeId] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rewardSubmitAttempted, setRewardSubmitAttempted] = useState(false);
  const [message, setMessage] = useState<CampaignSetupMessage>(null);

  const audience = useCampaignAudienceSelection({
    api,
    form,
    programs,
    savedGroups,
    setForm,
    setMessage,
    setSaveGroup,
  });

  useEffect(() => {
    const selectedGrades = audience.selectedGrades;

    setActiveAssignmentGradeId((current) =>
      selectedGrades.some((grade) => grade.id === current)
        ? current
        : selectedGrades[0]?.id || '',
    );
    setAssignmentConfigs((current) => {
      const next = { ...current };
      let changed = false;
      const sharedFrequency =
        Object.values(current)[0]?.frequency ?? createDefaultConfig().frequency;

      selectedGrades.forEach((grade) => {
        if (!next[grade.id]) {
          changed = true;
          next[grade.id] = {
            ...createDefaultConfig(),
            frequency: sharedFrequency,
          };
        }
      });

      return changed ? next : current;
    });
  }, [audience.selectedGrades]);

  useEffect(() => {
    if (isAlternateWeekEnabled(form.startDate, form.endDate)) return;

    setAssignmentConfigs((current) => {
      let changed = false;
      const next = { ...current };

      Object.entries(current).forEach(([gradeId, config]) => {
        if (config.frequency === 'alternate_week') {
          changed = true;
          next[gradeId] = {
            ...config,
            frequency: createDefaultConfig().frequency,
          };
        }
      });

      return changed ? next : current;
    });
  }, [form.endDate, form.startDate]);

  useEffect(() => {
    const fetchSetupOptions = async () => {
      setLoadingInitial(true);
      try {
        const setupOptions = await api.getCampaignSetupOptions();
        setPrograms(setupOptions.programs);
        setManagers(setupOptions.managers);
        setSavedGroups(setupOptions.savedGroups);
      } catch (error) {
        logger.error('Failed to load campaign setup options:', error);
        setMessage({
          type: 'error',
          text: t('Unable to load campaign setup options.'),
        });
      } finally {
        setLoadingInitial(false);
      }
    };

    void fetchSetupOptions();
  }, [api, t]);

  const updateForm =
    (field: keyof CampaignSetupFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const updateNumericForm =
    (
      field: keyof Pick<
        CampaignSetupFormState,
        'targetValue' | 'learningPathCount'
      >,
    ) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const max = field === 'targetValue' ? 100 : undefined;
      const rawValue = event.target.value;
      const nextValue = max && Number(rawValue) > max ? String(max) : rawValue;
      setForm((current) => ({ ...current, [field]: nextValue }));
    };

  const updateRewardRank =
    (index: number, field: 'criteriaValue' | 'reward') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const rawValue = event.target.value;
      setForm((current) => {
        const nextValue =
          field === 'criteriaValue' ? rawValue.replace(/\D/g, '') : rawValue;
        const clampedValue =
          field === 'criteriaValue' &&
          !usesLessonRewardCriteria(current) &&
          Number(nextValue) > 100
            ? '100'
            : nextValue;

        return {
          ...current,
          rewardRanks: current.rewardRanks.map((rank, rankIndex) =>
            rankIndex === index ? { ...rank, [field]: clampedValue } : rank,
          ),
        };
      });
    };

  const handleSelectChange =
    (field: keyof CampaignSetupFormState) =>
    (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      if (field === 'objective') {
        setForm((current) =>
          resetObjectiveFields(current, value as CampaignObjective),
        );
        return;
      }

      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleObjectiveChange = (objective: CampaignObjective) => {
    setForm((current) => resetObjectiveFields(current, objective));
  };

  const handleAssignmentDraftsChange = useCallback(
    (drafts: CampaignAssignmentDraft[]) => {
      setAssignmentDrafts((current) => {
        const currentKeys = current.map(getAssignmentDraftKey);
        const nextKeys = drafts.map(getAssignmentDraftKey);

        if (
          currentKeys.length === nextKeys.length &&
          currentKeys.every((key, index) => key === nextKeys[index])
        ) {
          return current;
        }

        return drafts;
      });
    },
    [],
  );

  const savedGroupNameSet = useMemo(
    () => buildSavedGroupNameSet(savedGroups),
    [savedGroups],
  );

  const validationErrors = useMemo(
    () => getCampaignSetupValidationErrors(form, saveGroup, savedGroupNameSet),
    [form, saveGroup, savedGroupNameSet],
  );

  const rewardValidationErrors = useMemo(
    () => getCampaignRewardsValidationErrors(form),
    [form],
  );

  const isFormValid = Object.keys(validationErrors).length === 0;
  const areRewardsValid = Object.keys(rewardValidationErrors).length === 0;

  const buildAudiencePayload = () =>
    buildCampaignAudiencePayload(form, saveGroup, {
      isAllSchools: audience.isAllSchools,
      isAllGrades: audience.isAllGrades,
      selectedSchoolIds: audience.selectedSchoolIds,
      selectedGradeIds: audience.selectedGradeIds,
    });

  const handleSaveGroup = async () => {
    setSubmitAttempted(true);
    if (!form.programId || !form.groupName.trim()) return;

    if (hasDuplicateSavedGroupName(form.groupName, savedGroupNameSet)) {
      setMessage({
        type: 'error',
        text: t('A saved group with this name already exists.'),
      });
      return;
    }

    setSavingGroup(true);
    setMessage(null);
    try {
      const savedGroup = await api.createCampaignAudienceGroup({
        ...buildAudiencePayload(),
        isSaved: true,
        name: form.groupName.trim(),
      });
      setSavedGroups((current) => [savedGroup, ...current]);
      audience.setSelectedSavedGroupId(savedGroup.id);
      setSaveGroup(false);
      setMessage({ type: 'success', text: t('Audience group saved.') });
    } catch (error) {
      logger.error('Failed to save campaign audience group:', error);
      setMessage({
        type: 'error',
        text: t('Unable to save audience group.'),
      });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSubmitAttempted(true);
    setMessage(null);

    if (!isFormValid) return;

    setSubmitting(true);
    try {
      const savedAudienceGroupId =
        audience.selectedSavedGroupId && !saveGroup
          ? audience.selectedSavedGroupId
          : undefined;

      const result = await api.createCampaignSetup({
        ...buildAudiencePayload(),
        savedAudienceGroupId,
        campaignName: form.campaignName.trim(),
        objective: form.objective as CampaignObjective,
        targetType:
          form.objective === 'homework_campaign'
            ? (form.targetType as CampaignTargetType)
            : undefined,
        targetValue:
          form.objective === 'homework_campaign'
            ? Number(form.targetValue)
            : undefined,
        learningPathCount:
          form.objective === 'homepage_learning_pathway_campaign'
            ? Number(form.learningPathCount)
            : undefined,
        managerId: form.managerId,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setCreatedCampaignId(result.campaignId);
      setActiveStep(
        form.objective === 'homepage_learning_pathway_campaign' ? 2 : 1,
      );
    } catch (error) {
      logger.error('Failed to create campaign setup:', error);
      setMessage({
        type: 'error',
        text: t('Unable to save campaign setup.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRewardsSubmit = () => {
    setRewardSubmitAttempted(true);
    setMessage(null);

    if (!createdCampaignId) {
      setMessage({
        type: 'error',
        text: t('Save campaign setup before configuring rewards.'),
      });
      return;
    }

    if (!areRewardsValid) return;

    setCampaignRewards(buildCampaignRewardsPayload(form));
    setActiveStep(3);
  };

  const fieldError = (key: string) =>
    submitAttempted ? validationErrors[key] : undefined;

  const rewardFieldError = (key: string) =>
    rewardSubmitAttempted ? rewardValidationErrors[key] : undefined;

  return {
    activeStep,
    activeAssignmentGradeId,
    areRewardsValid,
    assignmentConfigs,
    assignmentDrafts,
    campaignRewards,
    createdCampaignId,
    fieldError,
    form,
    handleObjectiveChange,
    handleAssignmentDraftsChange,
    handleRewardsSubmit,
    handleSaveGroup,
    handleSelectChange,
    handleSubmit,
    isFormValid,
    loadingInitial,
    managers,
    message,
    programs,
    saveGroup,
    savedGroups,
    savingGroup,
    setForm,
    setActiveStep,
    setActiveAssignmentGradeId,
    setAssignmentConfigs,
    setSaveGroup,
    submitting,
    updateForm,
    updateNumericForm,
    updateRewardRank,
    rewardFieldError,
    ...audience,
  };
};
