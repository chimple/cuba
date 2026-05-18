import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { ArrowBack, ChevronRight, Notifications } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import {
  CampaignDetailsSection,
  CampaignSetupFormState,
  CampaignSetupStepper,
  ObjectiveGoalSection,
  TargetAudienceSection,
} from '../components/CampaignSetupSections';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  CampaignAudienceOptions,
  CampaignAudienceSummary,
  CampaignObjective,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
  CampaignTargetType,
} from '../../services/api/ServiceApi';
import logger from '../../utility/logger';
import './CampaignSetupPage.css';

const emptyAudienceOptions: CampaignAudienceOptions = {
  blocks: [],
  schools: [],
  grades: [],
};

const emptyAudienceSummary: CampaignAudienceSummary = {
  totalStudents: 0,
  grades: [],
};

const CampaignSetupPage: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  const [form, setForm] = useState<CampaignSetupFormState>({
    objective: 'homework_campaign',
    targetType: 'percentage_completion',
    targetValue: '',
    learningPathCount: '',
    campaignName: '',
    managerId: '',
    startDate: '',
    endDate: '',
    programId: '',
    groupName: '',
  });
  const [programs, setPrograms] = useState<CampaignOption[]>([]);
  const [managers, setManagers] = useState<CampaignOption[]>([]);
  const [savedGroups, setSavedGroups] = useState<CampaignSavedAudienceGroup[]>(
    [],
  );
  const [audienceOptions, setAudienceOptions] =
    useState<CampaignAudienceOptions>(emptyAudienceOptions);
  const [audienceSummary, setAudienceSummary] =
    useState<CampaignAudienceSummary>(emptyAudienceSummary);
  const [loadingAudienceSummary, setLoadingAudienceSummary] = useState(false);
  const [selectedSavedGroupId, setSelectedSavedGroupId] = useState('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<
    CampaignSchoolOption[]
  >([]);
  const [selectedGrades, setSelectedGrades] = useState<CampaignOption[]>([]);
  const [saveGroup, setSaveGroup] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [createdCampaignId, setCreatedCampaignId] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    document.body.classList.add('campaign-setup-active');
    return () => {
      document.body.classList.remove('campaign-setup-active');
    };
  }, []);

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
          text: 'Unable to load campaign setup options.',
        });
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchSetupOptions();
  }, [api]);

  useEffect(() => {
    const fetchAudience = async () => {
      if (!form.programId) {
        setAudienceOptions(emptyAudienceOptions);
        setSelectedBlocks([]);
        setSelectedSchools([]);
        setSelectedGrades([]);
        return;
      }

      setLoadingAudience(true);
      try {
        const options = await api.getCampaignAudienceOptions(form.programId);
        setAudienceOptions(options);
        setSelectedBlocks(options.blocks);
        setSelectedSchools(options.schools);
        setSelectedGrades([]);
      } catch (error) {
        logger.error('Failed to load campaign audience options:', error);
        setAudienceOptions(emptyAudienceOptions);
        setMessage({
          type: 'error',
          text: 'Unable to load target audience options.',
        });
      } finally {
        setLoadingAudience(false);
      }
    };

    fetchAudience();
  }, [api, form.programId]);

  const schoolsForSelectedBlocks = useMemo(
    () =>
      audienceOptions.schools.filter((school) =>
        selectedBlocks.includes(school.block),
      ),
    [audienceOptions.schools, selectedBlocks],
  );

  useEffect(() => {
    setSelectedSchools((current) =>
      current.filter((school) =>
        schoolsForSelectedBlocks.some((option) => option.id === school.id),
      ),
    );
  }, [schoolsForSelectedBlocks]);

  const selectedSavedGroup = useMemo(
    () => savedGroups.find((group) => group.id === selectedSavedGroupId),
    [savedGroups, selectedSavedGroupId],
  );

  const allSchoolIds = useMemo(
    () => audienceOptions.schools.map((school) => school.id),
    [audienceOptions.schools],
  );
  const selectedSchoolIds = useMemo(
    () => selectedSchools.map((school) => school.id),
    [selectedSchools],
  );
  const selectedGradeIds = useMemo(
    () => selectedGrades.map((grade) => grade.id),
    [selectedGrades],
  );
  const isAllSchools =
    selectedSchoolIds.length === 0 ||
    (allSchoolIds.length > 0 &&
      selectedSchoolIds.length === allSchoolIds.length);
  const isAllGrades =
    audienceOptions.grades.length > 0 &&
    selectedGradeIds.length === audienceOptions.grades.length;

  const selectedProgramName =
    programs.find((program) => program.id === form.programId)?.name || '-';
  const summarySchoolIds = useMemo(
    () => (isAllSchools ? allSchoolIds : selectedSchoolIds),
    [allSchoolIds, isAllSchools, selectedSchoolIds],
  );
  const summaryGradeIds = useMemo(
    () =>
      isAllGrades
        ? audienceOptions.grades.map((grade) => grade.id)
        : selectedGradeIds,
    [audienceOptions.grades, isAllGrades, selectedGradeIds],
  );
  const summaryBlockCount = isAllSchools
    ? audienceOptions.blocks.length
    : new Set(selectedSchools.map((school) => school.block)).size;
  const summarySchoolCount = summarySchoolIds.length;

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

  const handleSelectChange =
    (field: keyof CampaignSetupFormState) =>
    (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [field]: value }));

      if (field === 'objective') {
        setForm((current) => ({
          ...current,
          objective: value as CampaignObjective,
          targetType: '',
          targetValue: '',
          learningPathCount: '',
        }));
      }
    };

  const handleObjectiveChange = (objective: CampaignObjective) => {
    setForm((current) => ({
      ...current,
      objective,
      targetType: '',
      targetValue: '',
      learningPathCount: '',
    }));
  };

  const handleProgramChange = (event: SelectChangeEvent<string>) => {
    setSelectedSavedGroupId('');
    handleSelectChange('programId')(event);
  };

  const handleBlocksChange = (blocks: string[]) => {
    setSelectedSavedGroupId('');
    setSelectedBlocks(blocks);
    setSelectedSchools(
      audienceOptions.schools.filter((school) => blocks.includes(school.block)),
    );
  };

  const handleSchoolsChange = (schools: CampaignSchoolOption[]) => {
    setSelectedSavedGroupId('');
    setSelectedSchools(schools);
  };

  const handleGradesChange = (grades: CampaignOption[]) => {
    setSelectedSavedGroupId('');
    setSelectedGrades(grades);
  };

  const handleSavedGroupChange = (event: SelectChangeEvent<string>) => {
    const groupId = event.target.value;
    const group = savedGroups.find((item) => item.id === groupId);
    setSelectedSavedGroupId(groupId);

    if (!group) return;

    setForm((current) => ({
      ...current,
      programId: group.programId,
      groupName: group.name,
    }));
    setSaveGroup(false);
  };

  useEffect(() => {
    if (!selectedSavedGroup || !form.programId) return;
    if (selectedSavedGroup.isAllSchools) {
      setSelectedBlocks(audienceOptions.blocks);
      setSelectedSchools(audienceOptions.schools);
    } else {
      const schools = audienceOptions.schools.filter((school) =>
        selectedSavedGroup.schoolIds.includes(school.id),
      );
      setSelectedSchools(schools);
      setSelectedBlocks(
        Array.from(new Set(schools.map((school) => school.block))),
      );
    }

    if (selectedSavedGroup.isAllGrades) {
      setSelectedGrades(audienceOptions.grades);
    } else {
      setSelectedGrades(
        audienceOptions.grades.filter((grade) =>
          selectedSavedGroup.gradeIds.includes(grade.id),
        ),
      );
    }
  }, [audienceOptions, form.programId, selectedSavedGroup]);

  useEffect(() => {
    let isMounted = true;

    const fetchAudienceSummary = async () => {
      if (summarySchoolIds.length === 0 || summaryGradeIds.length === 0) {
        setAudienceSummary(emptyAudienceSummary);
        return;
      }

      setLoadingAudienceSummary(true);
      try {
        const summary = await api.getCampaignAudienceSummary({
          schoolIds: summarySchoolIds,
          gradeIds: summaryGradeIds,
        });
        if (isMounted) setAudienceSummary(summary);
      } catch (error) {
        logger.error('Failed to load campaign audience summary:', error);
        if (isMounted) setAudienceSummary(emptyAudienceSummary);
      } finally {
        if (isMounted) setLoadingAudienceSummary(false);
      }
    };

    fetchAudienceSummary();

    return () => {
      isMounted = false;
    };
  }, [api, summarySchoolIds, summaryGradeIds]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!form.objective) errors.objective = 'Campaign objective is required.';
    if (form.objective === 'homework_campaign') {
      if (!form.targetType) errors.targetType = 'Target type is required.';
      if (!Number(form.targetValue) || Number(form.targetValue) <= 0) {
        errors.targetValue = 'Target value is required.';
      } else if (Number(form.targetValue) > 100) {
        errors.targetValue = 'Target value cannot be more than 100.';
      }
    }
    if (form.objective === 'homepage_learning_pathway_campaign') {
      if (
        !Number(form.learningPathCount) ||
        Number(form.learningPathCount) <= 0
      ) {
        errors.learningPathCount = 'Number of learning paths is required.';
      }
    }
    if (!form.campaignName.trim()) {
      errors.campaignName = 'Campaign name is required.';
    }
    if (!form.managerId) errors.managerId = 'Campaign manager is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';
    if (!form.endDate) errors.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errors.endDate = 'End date must be after start date.';
    }
    if (!form.programId) errors.programId = 'Program is required.';
    if (selectedGrades.length === 0) errors.grades = 'Grade is required.';
    if (saveGroup && !form.groupName.trim()) {
      errors.groupName = 'Group name is required.';
    }
    return errors;
  }, [form, saveGroup, selectedGrades.length]);

  const isFormValid = Object.keys(validationErrors).length === 0;

  const buildAudiencePayload = () => ({
    programId: form.programId,
    schoolIds: isAllSchools ? [] : selectedSchoolIds,
    gradeIds: isAllGrades ? [] : selectedGradeIds,
    isAllSchools,
    isAllGrades,
    isSaved: saveGroup,
    name: saveGroup ? form.groupName.trim() : undefined,
  });

  const handleSaveGroup = async () => {
    setSubmitAttempted(true);
    if (
      !form.programId ||
      selectedGrades.length === 0 ||
      !form.groupName.trim()
    ) {
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
      setSelectedSavedGroupId(savedGroup.id);
      setSaveGroup(false);
      setMessage({ type: 'success', text: 'Audience group saved.' });
    } catch (error) {
      logger.error('Failed to save campaign audience group:', error);
      setMessage({ type: 'error', text: 'Unable to save audience group.' });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setMessage(null);

    if (!isFormValid) return;

    setSubmitting(true);
    try {
      const savedAudienceGroupId =
        selectedSavedGroupId && !saveGroup ? selectedSavedGroupId : undefined;
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
      setActiveStep(1);
    } catch (error) {
      logger.error('Failed to create campaign setup:', error);
      setMessage({ type: 'error', text: 'Unable to save campaign setup.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    submitAttempted ? validationErrors[key] : undefined;

  if (loadingInitial) {
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

      {message && (
        <Alert severity={message.type} className="campaign-setup-alert">
          {message.text}
        </Alert>
      )}

      <Box
        component="form"
        className="campaign-setup-form"
        onSubmit={handleSubmit}
      >
        <CampaignSetupStepper activeStep={activeStep} />

        <ObjectiveGoalSection
          form={form}
          onObjectiveChange={handleObjectiveChange}
          onSelectChange={handleSelectChange}
          onNumericChange={updateNumericForm}
          fieldError={fieldError}
        />

        <CampaignDetailsSection
          form={form}
          managers={managers}
          onTextChange={updateForm}
          onSelectChange={handleSelectChange}
          fieldError={fieldError}
        />

        <TargetAudienceSection
          form={form}
          programs={programs}
          savedGroups={savedGroups}
          selectedSavedGroupId={selectedSavedGroupId}
          audienceOptions={audienceOptions}
          selectedBlocks={selectedBlocks}
          selectedSchools={selectedSchools}
          selectedGrades={selectedGrades}
          schoolsForSelectedBlocks={schoolsForSelectedBlocks}
          loadingAudience={loadingAudience}
          selectedProgramName={selectedProgramName}
          summaryBlockCount={summaryBlockCount}
          summarySchoolCount={summarySchoolCount}
          loadingAudienceSummary={loadingAudienceSummary}
          audienceSummary={audienceSummary}
          saveGroup={saveGroup}
          savingGroup={savingGroup}
          onSavedGroupChange={handleSavedGroupChange}
          onProgramChange={handleProgramChange}
          onBlocksChange={handleBlocksChange}
          onSchoolsChange={handleSchoolsChange}
          onGradesChange={handleGradesChange}
          onSaveGroupChange={setSaveGroup}
          onGroupNameChange={updateForm('groupName')}
          onSaveGroup={handleSaveGroup}
          onCancelSaveGroup={() => {
            setSaveGroup(false);
            setForm((current) => ({ ...current, groupName: '' }));
          }}
          fieldError={fieldError}
        />

        <Box className="campaign-setup-actions">
          <Button
            type="submit"
            variant="contained"
            endIcon={submitting ? <CircularProgress size={18} /> : undefined}
            disabled={!isFormValid || submitting || !!createdCampaignId}
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignSetupPage;
