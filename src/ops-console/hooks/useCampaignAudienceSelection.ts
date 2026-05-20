import React, { useEffect, useMemo, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import {
  CampaignAudienceOptions,
  CampaignAudienceSummary,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
  ServiceApi,
} from '../../services/api/ServiceApi';
import logger from '../../utility/logger';
import { CampaignSetupFormState } from '../components/CampaignSetupSections';

export type CampaignSetupMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

const emptyAudienceOptions: CampaignAudienceOptions = {
  blocks: [],
  schools: [],
  grades: [],
};

const emptyAudienceSummary: CampaignAudienceSummary = {
  totalStudents: 0,
  grades: [],
};

type UseCampaignAudienceSelectionParams = {
  api: ServiceApi;
  form: CampaignSetupFormState;
  programs: CampaignOption[];
  savedGroups: CampaignSavedAudienceGroup[];
  setForm: React.Dispatch<React.SetStateAction<CampaignSetupFormState>>;
  setMessage: React.Dispatch<React.SetStateAction<CampaignSetupMessage>>;
  setSaveGroup: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useCampaignAudienceSelection = ({
  api,
  form,
  programs,
  savedGroups,
  setForm,
  setMessage,
  setSaveGroup,
}: UseCampaignAudienceSelectionParams) => {
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
  const [loadingAudience, setLoadingAudience] = useState(false);

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
  }, [api, form.programId, setMessage]);

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

  const handleProgramChange = (event: SelectChangeEvent<string>) => {
    setSelectedSavedGroupId('');
    setForm((current) => ({ ...current, programId: event.target.value }));
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

  return {
    audienceOptions,
    audienceSummary,
    handleBlocksChange,
    handleGradesChange,
    handleProgramChange,
    handleSavedGroupChange,
    handleSchoolsChange,
    isAllGrades,
    isAllSchools,
    loadingAudience,
    loadingAudienceSummary,
    schoolsForSelectedBlocks,
    selectedBlocks,
    selectedGradeIds,
    selectedGrades,
    selectedProgramName,
    selectedSavedGroupId,
    selectedSchoolIds,
    selectedSchools,
    setSelectedSavedGroupId,
    summaryBlockCount,
    summarySchoolCount,
  };
};
