import React, { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
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
  getRequiredAssignmentCount,
  isAlternateWeekEnabled,
} from './campaignAssignmentUtils';
import { CampaignSetupFormState } from './types';
import './CampaignAssignmentStep.css';

type CampaignAssignmentStepProps = {
  form: CampaignSetupFormState;
  campaignId: string;
  selectedGrades: CampaignOption[];
  selectedSchoolIds: string[];
  assignmentOptions: CampaignAssignmentOptions;
  loadingAssignmentOptions: boolean;
  activeGradeId: string;
  configs: Record<string, GradeAssignmentConfig>;
  onActiveGradeChange: (gradeId: string) => void;
  onConfigsChange: React.Dispatch<
    React.SetStateAction<Record<string, GradeAssignmentConfig>>
  >;
  onCompletionChange: (isComplete: boolean) => void;
  onAssignmentsChange: (assignments: CampaignAssignmentDraft[]) => void;
};

export const CampaignAssignmentStep: React.FC<CampaignAssignmentStepProps> = ({
  form,
  campaignId,
  selectedGrades,
  selectedSchoolIds,
  assignmentOptions,
  loadingAssignmentOptions,
  activeGradeId,
  configs,
  onActiveGradeChange,
  onConfigsChange,
  onCompletionChange,
  onAssignmentsChange,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<{
    gradeId: string;
    rowId: string;
  } | null>(null);

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
        const requiredAssignments = getRequiredAssignmentCount(
          form.startDate,
          form.endDate,
          config?.frequency ?? createDefaultConfig().frequency,
        );
        const rowCount = rowsByGrade.get(grade.id)?.length ?? 0;

        return (
          !!config &&
          config.subjectIds.length > 0 &&
          config.chapterIds.length > 0 &&
          (config.frequency !== 'alternate_week' ||
            isAlternateWeekEnabled(form.startDate, form.endDate)) &&
          rowCount > 0 &&
          rowCount >= requiredAssignments &&
          (rowsByGrade.get(grade.id) ?? []).every((row) => row.date)
        );
      }),
    [configs, form.endDate, form.startDate, rowsByGrade, selectedGrades],
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
    onConfigsChange((current) => ({
      ...current,
      [gradeId]: updater(current[gradeId] ?? createDefaultConfig()),
    }));
  };

  const updateSharedFrequency = (frequency: Frequency) => {
    onConfigsChange((current) => {
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
  const activeGradeKey = activeGrade?.id || '';
  const activeSubjects = gradeOptionsById.get(activeGradeKey) ?? [];
  const activeConfig = configs[activeGradeKey] ?? createDefaultConfig();
  const selectedSubjects = activeSubjects.filter((subject) =>
    activeConfig.subjectIds.includes(subject.id),
  );
  const activeRows = rowsByGrade.get(activeGradeKey) ?? [];
  const requiredAssignments = getRequiredAssignmentCount(
    form.startDate,
    form.endDate,
    activeConfig.frequency,
  );
  const insufficientLessons =
    activeRows.length > 0 && activeRows.length < requiredAssignments;

  const toggleChapter = (chapterId: string, lessonIds: string[]) => {
    updateConfig(activeGradeKey, (config) => {
      const isSelected = config.chapterIds.includes(chapterId);
      const chapterRowIds = lessonIds.map(
        (lessonId) => `${chapterId}:${lessonId}`,
      );
      const hasAssignedLessons =
        isSelected &&
        chapterRowIds.some((rowId) => !config.removedRowIds.includes(rowId));

      if (isSelected && !hasAssignedLessons) {
        return {
          ...config,
          removedRowIds: config.removedRowIds.filter(
            (rowId) => !chapterRowIds.includes(rowId),
          ),
        };
      }

      return {
        ...config,
        chapterIds: isSelected
          ? config.chapterIds.filter((id) => id !== chapterId)
          : [...config.chapterIds, chapterId],
        expandedChapterIds: isSelected
          ? config.expandedChapterIds.filter((id) => id !== chapterId)
          : config.expandedChapterIds,
        removedRowIds: isSelected
          ? config.removedRowIds.filter(
              (rowId) => !chapterRowIds.includes(rowId),
            )
          : config.removedRowIds,
      };
    });
  };

  const toggleExpanded = (chapterId: string) => {
    updateConfig(activeGradeKey, (config) => ({
      ...config,
      expandedChapterIds: config.expandedChapterIds.includes(chapterId)
        ? config.expandedChapterIds.filter((id) => id !== chapterId)
        : [...config.expandedChapterIds, chapterId],
    }));
  };

  if (loadingAssignmentOptions) {
    return (
      <Box className="campaign-assignment-step-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="campaign-assignment-step">
      {selectedGrades.length > 1 && (
        <Box className="campaign-assignment-step-helper">
          <InfoOutlined />
          <Typography>
            Assignments should be configured for all selected grades. The
            selected assignment frequency will apply across all grades.
          </Typography>
        </Box>
      )}

      <Box className="campaign-assignment-step-tabs" role="tablist">
        {selectedGrades.map((grade) => (
          <button
            type="button"
            key={grade.id}
            className={`campaign-assignment-step-tab ${
              activeGradeId === grade.id
                ? 'campaign-assignment-step-tab-active'
                : ''
            }`}
            onClick={() => onActiveGradeChange(grade.id)}
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
          updateConfig(activeGradeKey, (config) => ({
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
        requiredAssignments={requiredAssignments}
        insufficientLessons={insufficientLessons}
        onRemoveLesson={(rowId) =>
          setDeleteTarget({
            gradeId: activeGradeKey,
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
