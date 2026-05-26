import React, { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { ServiceConfig } from '../../../services/ServiceConfig';
import {
  CampaignAssignmentOptions,
  CampaignOption,
} from '../../../services/api/ServiceApi';
import logger from '../../../utility/logger';
import { AssignmentConfigurationCard } from './AssignmentConfigurationCard';
import { AssignmentSummary } from './AssignmentSummary';
import { ChapterSelection } from './ChapterSelection';
import { RemoveLessonDialog } from './RemoveLessonDialog';
import {
  AssignmentRow,
  CampaignAssignmentDraft,
  Frequency,
  GradeAssignmentConfig,
  buildAssignmentDrafts,
  buildRows,
  createDefaultConfig,
  getCampaignDaysWithoutSundays,
} from './campaignAssignmentUtils';
import { CampaignSetupFormState } from './types';
import './CampaignAssignmentStep.css';

type CampaignAssignmentStepProps = {
  form: CampaignSetupFormState;
  campaignId: string;
  selectedGrades: CampaignOption[];
  selectedSchoolIds: string[];
  onCompletionChange: (isComplete: boolean) => void;
  onAssignmentsChange: (assignments: CampaignAssignmentDraft[]) => void;
};

export const CampaignAssignmentStep: React.FC<CampaignAssignmentStepProps> = ({
  form,
  campaignId,
  selectedGrades,
  selectedSchoolIds,
  onCompletionChange,
  onAssignmentsChange,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [assignmentOptions, setAssignmentOptions] =
    useState<CampaignAssignmentOptions>({ grades: [] });
  const [loading, setLoading] = useState(false);
  const [activeGradeId, setActiveGradeId] = useState(
    selectedGrades[0]?.id || '',
  );
  const [configs, setConfigs] = useState<Record<string, GradeAssignmentConfig>>(
    {},
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    gradeId: string;
    rowId: string;
  } | null>(null);

  useEffect(() => {
    setActiveGradeId((current) =>
      selectedGrades.some((grade) => grade.id === current)
        ? current
        : selectedGrades[0]?.id || '',
    );
    setConfigs((current) => {
      const next = { ...current };
      const sharedFrequency =
        Object.values(current)[0]?.frequency ?? createDefaultConfig().frequency;
      selectedGrades.forEach((grade) => {
        if (!next[grade.id]) {
          next[grade.id] = {
            ...createDefaultConfig(),
            frequency: sharedFrequency,
          };
        }
      });
      return next;
    });
  }, [selectedGrades]);

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      if (!form.programId || selectedGrades.length === 0) return;
      setLoading(true);
      try {
        const options = await api.getCampaignAssignmentOptions({
          programId: form.programId,
          schoolIds: selectedSchoolIds,
          gradeIds: selectedGrades.map((grade) => grade.id),
        });
        if (isMounted) setAssignmentOptions(options);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [api, form.programId, selectedGrades, selectedSchoolIds]);

  const gradeOptionsById = useMemo(
    () =>
      new Map(
        assignmentOptions.grades.map((grade) => [
          grade.gradeId,
          grade.subjects,
        ]),
      ),
    [assignmentOptions.grades],
  );

  const rowsByGrade = useMemo(() => {
    const next = new Map<string, AssignmentRow[]>();
    selectedGrades.forEach((grade) => {
      const config = configs[grade.id] ?? createDefaultConfig();
      const subjects = (gradeOptionsById.get(grade.id) ?? []).filter(
        (subject) => config.subjectIds.includes(subject.id),
      );
      next.set(grade.id, buildRows(grade.id, subjects, config, form));
    });
    return next;
  }, [configs, form, gradeOptionsById, selectedGrades]);

  const isComplete = useMemo(
    () =>
      selectedGrades.every((grade) => {
        const config = configs[grade.id];
        return (
          !!config &&
          config.subjectIds.length > 0 &&
          config.chapterIds.length > 0 &&
          (rowsByGrade.get(grade.id)?.length ?? 0) > 0
        );
      }),
    [configs, rowsByGrade, selectedGrades],
  );

  useEffect(() => {
    onCompletionChange(isComplete);
  }, [isComplete, onCompletionChange]);

  useEffect(() => {
    const assignmentDrafts = buildAssignmentDrafts(
      rowsByGrade,
      selectedSchoolIds,
      campaignId,
    );

    logger.info('Campaign assignment drafts generated', {
      campaignId,
      selectedSchoolIds,
      selectedGradeIds: selectedGrades.map((grade) => grade.id),
      assignments: assignmentDrafts,
    });
    onAssignmentsChange(assignmentDrafts);
  }, [
    campaignId,
    onAssignmentsChange,
    rowsByGrade,
    selectedGrades,
    selectedSchoolIds,
  ]);

  const updateConfig = (
    gradeId: string,
    updater: (config: GradeAssignmentConfig) => GradeAssignmentConfig,
  ) => {
    setConfigs((current) => ({
      ...current,
      [gradeId]: updater(current[gradeId] ?? createDefaultConfig()),
    }));
  };

  const updateSharedFrequency = (frequency: Frequency) => {
    setConfigs((current) => {
      const next = { ...current };
      selectedGrades.forEach((grade) => {
        next[grade.id] = {
          ...(next[grade.id] ?? createDefaultConfig()),
          frequency,
          removedRowIds: [],
        };
      });
      return next;
    });
  };

  const activeGrade =
    selectedGrades.find((grade) => grade.id === activeGradeId) ??
    selectedGrades[0];
  const activeSubjects = gradeOptionsById.get(activeGradeId) ?? [];
  const activeConfig = configs[activeGradeId] ?? createDefaultConfig();
  const selectedSubjects = activeSubjects.filter((subject) =>
    activeConfig.subjectIds.includes(subject.id),
  );
  const activeRows = rowsByGrade.get(activeGradeId) ?? [];
  const campaignDays = getCampaignDaysWithoutSundays(
    form.startDate,
    form.endDate,
  );
  const insufficientLessons =
    activeRows.length > 0 && activeRows.length < campaignDays;

  const toggleChapter = (chapterId: string) => {
    updateConfig(activeGradeId, (config) => {
      const isSelected = config.chapterIds.includes(chapterId);
      return {
        ...config,
        chapterIds: isSelected
          ? config.chapterIds.filter((id) => id !== chapterId)
          : [...config.chapterIds, chapterId],
        expandedChapterIds: isSelected
          ? config.expandedChapterIds.filter((id) => id !== chapterId)
          : Array.from(new Set([...config.expandedChapterIds, chapterId])),
        removedRowIds: [],
      };
    });
  };

  const toggleExpanded = (chapterId: string) => {
    updateConfig(activeGradeId, (config) => ({
      ...config,
      expandedChapterIds: config.expandedChapterIds.includes(chapterId)
        ? config.expandedChapterIds.filter((id) => id !== chapterId)
        : [...config.expandedChapterIds, chapterId],
    }));
  };

  if (loading) {
    return (
      <Box className="campaign-assignment-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="campaign-assignment-step">
      {selectedGrades.length > 1 && (
        <Box className="campaign-assignment-helper">
          <InfoOutlined />
          <Typography>
            Assignments should be configured for all selected grades. The
            selected assignment frequency will apply across all grades.
          </Typography>
        </Box>
      )}

      <Box className="campaign-assignment-tabs" role="tablist">
        {selectedGrades.map((grade) => (
          <button
            type="button"
            key={grade.id}
            className={`campaign-assignment-tab ${
              activeGradeId === grade.id ? 'campaign-assignment-tab-active' : ''
            }`}
            onClick={() => setActiveGradeId(grade.id)}
          >
            {grade.name}
          </button>
        ))}
      </Box>

      <AssignmentConfigurationCard
        gradeName={activeGrade?.name || 'Grade'}
        form={form}
        activeSubjects={activeSubjects}
        selectedSubjects={selectedSubjects}
        activeConfig={activeConfig}
        onSubjectsChange={(subjects) =>
          updateConfig(activeGradeId, (config) => ({
            ...config,
            subjectIds: subjects.map((subject) => subject.id),
            chapterIds: config.chapterIds.filter((chapterId) =>
              subjects.some((subject) =>
                subject.chapters.some((chapter) => chapter.id === chapterId),
              ),
            ),
            removedRowIds: [],
          }))
        }
        onFrequencyChange={updateSharedFrequency}
      />

      <ChapterSelection
        gradeName={activeGrade?.name || 'this grade'}
        selectedSubjects={selectedSubjects}
        activeConfig={activeConfig}
        onToggleChapter={toggleChapter}
        onToggleExpanded={toggleExpanded}
      />

      <AssignmentSummary
        rows={activeRows}
        campaignDays={campaignDays}
        insufficientLessons={insufficientLessons}
        onRemoveLesson={(rowId) =>
          setDeleteTarget({
            gradeId: activeGradeId,
            rowId,
          })
        }
      />

      <RemoveLessonDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            updateConfig(deleteTarget.gradeId, (config) => ({
              ...config,
              removedRowIds: [...config.removedRowIds, deleteTarget.rowId],
            }));
          }
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
};
