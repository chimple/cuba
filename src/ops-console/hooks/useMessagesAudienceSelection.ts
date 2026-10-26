import { useEffect, useMemo, useRef, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  CampaignAudienceOptions,
  CampaignAudienceSummary,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
} from '../../services/api/ServiceApi';
import logger from '../../utility/logger';
import {
  buildSavedGroupNameSet,
  hasDuplicateSavedGroupName,
} from './campaignSetupFormHelpers';
import {
  areOptionIdArraysEqual,
  areStringArraysEqual,
  emptyAudienceOptions,
  emptyAudienceSummary,
  type ActivityRecency,
  type UserType,
} from './useMessagesAudienceSelection.helpers';
import { useMessagesRecipientCount } from './useMessagesAudienceSelection.counts';

export const useMessagesAudienceSelection = () => {
  const api = ServiceConfig.getI().apiHandler;

  // Form state
  const [programId, setProgramId] = useState('');
  const [programModel, setProgramModel] = useState<string>('');
  const [userType, setUserType] = useState<UserType>('student');
  const [activityRecency, setActivityRecency] =
    useState<ActivityRecency>('all');

  // Audience state
  const [programs, setPrograms] = useState<CampaignOption[]>([]);
  const [savedGroups, setSavedGroups] = useState<CampaignSavedAudienceGroup[]>(
    [],
  );
  const [selectedSavedGroupId, setSelectedSavedGroupId] = useState('');
  const [audienceOptions, setAudienceOptions] =
    useState<CampaignAudienceOptions>(emptyAudienceOptions);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<
    CampaignSchoolOption[]
  >([]);
  const [selectedGrades, setSelectedGrades] = useState<CampaignOption[]>([]);
  const [availableGrades, setAvailableGrades] = useState<CampaignOption[]>([]);
  const [audienceSummary, setAudienceSummary] =
    useState<CampaignAudienceSummary>(emptyAudienceSummary);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingAudienceSummary, setLoadingAudienceSummary] = useState(false);
  const [hasCustomBlockSelection, setHasCustomBlockSelection] = useState(false);
  const [hasCustomSchoolSelection, setHasCustomSchoolSelection] =
    useState(false);
  const [hasCustomGradeSelection, setHasCustomGradeSelection] = useState(false);
  const [saveGroup, setSaveGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [saveGroupAttempted, setSaveGroupAttempted] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const savedGroupNameSet = useMemo(
    () => buildSavedGroupNameSet(savedGroups),
    [savedGroups],
  );
  const groupNameError = useMemo(() => {
    if (!saveGroup) return undefined;
    if (saveGroupAttempted && !groupName.trim()) {
      return 'Group name is required.';
    }
    if (hasDuplicateSavedGroupName(groupName, savedGroupNameSet)) {
      return 'A saved group with this name already exists.';
    }

    return undefined;
  }, [groupName, saveGroup, saveGroupAttempted, savedGroupNameSet]);
  const programError = useMemo(() => {
    if (!saveGroup) return undefined;
    if (!groupName.trim()) return undefined;
    if (programId.trim().length > 0) return undefined;
    return 'Program is required.';
  }, [groupName, programId, saveGroup]);
  const canSaveGroup = useMemo(
    () =>
      saveGroup && programId.trim().length > 0 && groupName.trim().length > 0,
    [groupName, programId, saveGroup],
  );

  // Load initial setup options
  useEffect(() => {
    const fetchSetupOptions = async () => {
      try {
        const setupOptions = await api.getCampaignSetupOptions();
        setPrograms(setupOptions.programs);
        setSavedGroups(setupOptions.savedGroups);
      } catch (error) {
        logger.error('Failed to load campaign setup options:', error);
      }
    };
    fetchSetupOptions();
  }, [api]);

  useEffect(() => {
    if (!programId) {
      setProgramModel('');
    }
  }, [programId]);

  // Load audience options when program changes
  useEffect(() => {
    let isActive = true;
    const fetchAudience = async () => {
      if (!programId) {
        setAudienceOptions(emptyAudienceOptions);
        setSelectedBlocks([]);
        setSelectedSchools([]);
        setSelectedGrades([]);
        setAvailableGrades([]);
        return;
      }
      setLoadingAudience(true);
      try {
        const options = await api.getCampaignAudienceOptions(
          programId,
          programModel,
        );
        if (isActive) setAudienceOptions(options);
      } catch (error) {
        logger.error('Failed to load audience options:', error);
        if (isActive) setAudienceOptions(emptyAudienceOptions);
      } finally {
        if (isActive) setLoadingAudience(false);
      }
    };
    fetchAudience();
    return () => {
      isActive = false;
    };
  }, [api, programId, programModel]);

  // Auto-select blocks when program changes and no custom selection
  useEffect(() => {
    if (selectedSavedGroupId || !programId) return;
    if (!hasCustomBlockSelection) {
      setSelectedBlocks((current) =>
        areStringArraysEqual(current, audienceOptions.blocks)
          ? current
          : audienceOptions.blocks,
      );
    }
  }, [
    audienceOptions.blocks,
    programId,
    hasCustomBlockSelection,
    selectedSavedGroupId,
  ]);

  const schoolsForSelectedBlocks = useMemo(
    () =>
      audienceOptions.schools.filter((school) =>
        selectedBlocks.includes(school.block),
      ),
    [audienceOptions.schools, selectedBlocks],
  );
  const selectedGradeIds = useMemo(
    () => selectedGrades.map((grade) => grade.id),
    [selectedGrades],
  );

  // Auto-select schools when blocks change
  useEffect(() => {
    setSelectedSchools((current) => {
      const nextSchools = hasCustomSchoolSelection
        ? current.filter((school) =>
            schoolsForSelectedBlocks.some((opt) => opt.id === school.id),
          )
        : schoolsForSelectedBlocks;
      return areOptionIdArraysEqual(current, nextSchools)
        ? current
        : nextSchools;
    });
  }, [hasCustomSchoolSelection, schoolsForSelectedBlocks]);

  const allSchoolIds = useMemo(
    () => audienceOptions.schools.map((school) => school.id),
    [audienceOptions.schools],
  );
  const selectedSchoolIds = useMemo(
    () => selectedSchools.map((school) => school.id),
    [selectedSchools],
  );
  const isAllSchools =
    selectedSchoolIds.length > 0 &&
    allSchoolIds.length > 0 &&
    selectedSchoolIds.length === allSchoolIds.length;

  // Load available grades
  useEffect(() => {
    let isActive = true;
    const fetchAvailableGrades = async () => {
      if (!programId) {
        setAvailableGrades([]);
        setLoadingGrades(false);
        return;
      }
      if (isAllSchools) {
        setAvailableGrades((current) =>
          areOptionIdArraysEqual(current, audienceOptions.grades)
            ? current
            : audienceOptions.grades,
        );
        setLoadingGrades(false);
        return;
      }
      if (selectedSchoolIds.length === 0) {
        setAvailableGrades([]);
        setLoadingGrades(false);
        return;
      }
      setLoadingGrades(true);
      try {
        const grades = await api.getCampaignGradesForSchools(selectedSchoolIds);
        if (isActive) setAvailableGrades(grades);
      } catch (error) {
        logger.error('Failed to load grades:', error);
        if (isActive) setAvailableGrades([]);
      } finally {
        if (isActive) setLoadingGrades(false);
      }
    };
    fetchAvailableGrades();
    return () => {
      isActive = false;
    };
  }, [api, audienceOptions.grades, programId, isAllSchools, selectedSchoolIds]);

  // Auto-select grades
  useEffect(() => {
    if (loadingGrades) return;
    setSelectedGrades((current) => {
      const nextGrades = hasCustomGradeSelection ? current : availableGrades;
      return areOptionIdArraysEqual(current, nextGrades) ? current : nextGrades;
    });
  }, [
    audienceOptions.grades,
    availableGrades,
    hasCustomGradeSelection,
    loadingGrades,
  ]);

  const isAllGrades =
    availableGrades.length > 0 &&
    selectedGradeIds.length === availableGrades.length;

  const selectedProgramName =
    programs.find((p) => p.id === programId)?.name || '-';

  const summarySchoolIds = useMemo(
    () =>
      selectedSchoolIds.length === 0
        ? []
        : isAllSchools
          ? allSchoolIds
          : selectedSchoolIds,
    [allSchoolIds, isAllSchools, selectedSchoolIds],
  );
  const summaryGradeIds = useMemo(
    () => (isAllGrades ? availableGrades.map((g) => g.id) : selectedGradeIds),
    [availableGrades, isAllGrades, selectedGradeIds],
  );
  const summaryBlockCount = isAllSchools
    ? audienceOptions.blocks.length
    : new Set(selectedSchools.map((s) => s.block)).size;
  const summarySchoolCount = summarySchoolIds.length;

  // Load audience summary
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      if (summarySchoolIds.length === 0 || summaryGradeIds.length === 0) {
        setAudienceSummary(emptyAudienceSummary);
        setLoadingAudienceSummary(false);
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
        logger.error('Failed to load audience summary:', error);
        if (isMounted) setAudienceSummary(emptyAudienceSummary);
      } finally {
        if (isMounted) setLoadingAudienceSummary(false);
      }
    };
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [api, summarySchoolIds, summaryGradeIds]);

  const { displayRecipientCount, loadingRoleCount } = useMessagesRecipientCount(
    {
      activityRecency,
      isAllGrades,
      isAllSchools,
      programId,
      summaryGradeIds,
      summarySchoolIds,
      userType,
    },
  );

  const handleProgramChange = (event: SelectChangeEvent<string>) => {
    setSelectedSavedGroupId('');
    setSelectedBlocks([]);
    setSelectedSchools([]);
    setSelectedGrades([]);
    setHasCustomBlockSelection(false);
    setHasCustomSchoolSelection(false);
    setHasCustomGradeSelection(false);
    setProgramId(event.target.value);
    setProgramModel('');
  };

  const handleBlocksChange = (blocks: string[]) => {
    setSelectedSavedGroupId('');
    setHasCustomBlockSelection(true);
    setSelectedBlocks(blocks);
    setSelectedSchools(
      audienceOptions.schools.filter((s) => blocks.includes(s.block)),
    );
  };

  const handleSchoolsChange = (schools: CampaignSchoolOption[]) => {
    setSelectedSavedGroupId('');
    setHasCustomSchoolSelection(true);
    setSelectedSchools(schools);
  };

  const handleGradesChange = (grades: CampaignOption[]) => {
    setSelectedSavedGroupId('');
    setHasCustomGradeSelection(true);
    setSelectedGrades(grades);
  };

  const handleSavedGroupChange = (event: SelectChangeEvent<string>) => {
    const groupId = event.target.value;
    const group = savedGroups.find((item) => item.id === groupId);
    setSelectedSavedGroupId(groupId);

    if (!group) {
      setSelectedSavedGroupId('');
      setSelectedBlocks([]);
      setSelectedSchools([]);
      setSelectedGrades([]);
      setHasCustomBlockSelection(false);
      setHasCustomSchoolSelection(false);
      setHasCustomGradeSelection(false);
      setProgramId('');
      setGroupName('');
      setSaveGroup(false);
      setMessage(null);
      return;
    }

    setProgramId(group.programId);
    setGroupName(group.name);
    setHasCustomBlockSelection(!group.isAllSchools);
    setHasCustomSchoolSelection(!group.isAllSchools);
    setHasCustomGradeSelection(!group.isAllGrades);
    setSaveGroup(false);
  };

  // Apply saved group when audience options load
  const selectedSavedGroup = useMemo(
    () => savedGroups.find((g) => g.id === selectedSavedGroupId),
    [savedGroups, selectedSavedGroupId],
  );

  useEffect(() => {
    if (!selectedSavedGroup || !programId) return;
    setHasCustomBlockSelection(!selectedSavedGroup.isAllSchools);
    setHasCustomSchoolSelection(!selectedSavedGroup.isAllSchools);
    setHasCustomGradeSelection(!selectedSavedGroup.isAllGrades);

    if (selectedSavedGroup.isAllSchools) {
      setSelectedBlocks(audienceOptions.blocks);
      setSelectedSchools(audienceOptions.schools);
    } else {
      const schools = audienceOptions.schools.filter((s) =>
        selectedSavedGroup.schoolIds.includes(s.id),
      );
      setSelectedSchools(schools);
      setSelectedBlocks(Array.from(new Set(schools.map((s) => s.block))));
    }

    if (selectedSavedGroup.isAllGrades) {
      setSelectedGrades(audienceOptions.grades);
    } else {
      setSelectedGrades(
        audienceOptions.grades.filter((g) =>
          selectedSavedGroup.gradeIds.includes(g.id),
        ),
      );
    }
  }, [audienceOptions, programId, selectedSavedGroup]);

  const handleSaveGroup = async () => {
    setSaveGroupAttempted(true);
    if (!programId || !groupName.trim()) return;
    if (hasDuplicateSavedGroupName(groupName, savedGroupNameSet)) {
      setMessage({
        type: 'error',
        text: 'A saved group with this name already exists.',
      });
      return;
    }

    setSavingGroup(true);
    setMessage(null);
    try {
      const savedGroup = await api.createCampaignAudienceGroup({
        programId,
        schoolIds: selectedSchoolIds,
        gradeIds: selectedGradeIds,
        isAllSchools,
        isAllGrades,
        isSaved: true,
        name: groupName.trim(),
      });
      setSavedGroups((current) => [savedGroup, ...current]);
      setSelectedSavedGroupId(savedGroup.id);
      setSaveGroup(false);
      setMessage({ type: 'success', text: 'Audience group saved.' });
    } catch (error) {
      logger.error('Failed to save audience group:', error);
      setMessage({ type: 'error', text: 'Unable to save audience group.' });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleCancelSaveGroup = () => {
    setSaveGroup(false);
    setGroupName('');
    setSaveGroupAttempted(false);
  };

  return {
    // Program state
    programs,
    programId,
    selectedProgramName,
    selectedProgramModel: programModel,
    handleProgramChange,

    // Program Model
    programModel,
    setProgramModel,

    // Saved group
    savedGroups,
    savedGroupNameSet,
    selectedSavedGroupId,
    selectedSavedGroup,
    handleSavedGroupChange,

    // Audience options
    audienceOptions,
    loadingAudience,
    selectedBlocks,
    selectedSchools,
    selectedGrades,
    availableGrades,
    loadingGrades,
    schoolsForSelectedBlocks,
    hasCustomBlockSelection,
    hasCustomSchoolSelection,
    hasCustomGradeSelection,
    handleBlocksChange,
    handleSchoolsChange,
    handleGradesChange,

    // Summary
    audienceSummary,
    loadingAudienceSummary,
    loadingRoleCount,
    summaryBlockCount,
    summarySchoolCount,
    displayRecipientCount,
    isAllSchools,
    isAllGrades,

    // Refine filters
    userType,
    activityRecency,
    setUserType,
    setActivityRecency,

    // Save group
    saveGroup,
    groupName,
    savingGroup,
    canSaveGroup,
    programError,
    message,
    groupNameError,
    setSaveGroup,
    setGroupName,
    handleSaveGroup,
    handleCancelSaveGroup,
  };
};
