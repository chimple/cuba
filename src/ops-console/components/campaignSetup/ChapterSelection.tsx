import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CampaignAssignmentSubjectOption } from '../../../services/api/ServiceApi';
import { GradeAssignmentConfig } from './campaignAssignmentUtils';
import './ChapterSelection.css';

type ChapterSelectionProps = {
  gradeName: string;
  selectedSubjects: CampaignAssignmentSubjectOption[];
  activeConfig: GradeAssignmentConfig;
  onToggleChapter: (chapterId: string, lessonIds: string[]) => void;
  onToggleExpanded: (chapterId: string) => void;
};

export const ChapterSelection: React.FC<ChapterSelectionProps> = ({
  gradeName,
  selectedSubjects,
  activeConfig,
  onToggleChapter,
  onToggleExpanded,
}) => {
  const removedLessonIds = new Set(
    activeConfig?.removedRowIds?.map((rowId) => rowId.split(':')[1]) ?? [],
  );

  return (
    <>
      <Box className="chapter-selection-section-heading">
        <Typography variant="h6" className="campaign-setup-section-title">
          Chapter Selection
        </Typography>
        <Typography className="campaign-setup-section-copy">
          Assign chapters for {gradeName || 'this grade'}.
        </Typography>
      </Box>

      <Box className="chapter-selection-subjects">
        {selectedSubjects.map((subject) => (
          <Box key={subject.id} className="chapter-selection-subject">
            <Box className="chapter-selection-subject-header">
              <Typography className="chapter-selection-subject-title">
                {subject.name}
              </Typography>
            </Box>
            <Box className="chapter-selection-chapter-list">
              {subject.chapters.map((chapter) => {
                const chapterLessonIds = chapter.lessons.map(
                  (lesson) => lesson.id,
                );
                const hasAssignedLessons =
                  activeConfig.chapterIds.includes(chapter.id) &&
                  chapterLessonIds.some(
                    (lessonId) => !removedLessonIds.has(lessonId),
                  );
                const isExpanded = activeConfig.expandedChapterIds.includes(
                  chapter.id,
                );

                return (
                  <Box
                    key={chapter.id}
                    className={`chapter-selection-chapter ${
                      isExpanded ? 'chapter-selection-chapter-expanded' : ''
                    }`}
                  >
                    <Box className="chapter-selection-chapter-row">
                      <Typography className="chapter-selection-chapter-name">
                        {chapter.name}
                      </Typography>
                      <Typography className="chapter-selection-activity-count">
                        {chapter.lessons.length} activities
                      </Typography>
                      <Button
                        type="button"
                        className={
                          hasAssignedLessons
                            ? 'chapter-selection-remove-button'
                            : 'chapter-selection-assign-button'
                        }
                        onClick={() =>
                          onToggleChapter(chapter.id, chapterLessonIds)
                        }
                      >
                        {hasAssignedLessons ? 'Remove' : 'Assign'}
                      </Button>
                      <Button
                        type="button"
                        className="chapter-selection-expand-button"
                        onClick={() => onToggleExpanded(chapter.id)}
                        aria-label={
                          isExpanded
                            ? `Collapse ${chapter.name}`
                            : `Expand ${chapter.name}`
                        }
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </Button>
                    </Box>
                    {isExpanded && (
                      <Box className="chapter-selection-lessons">
                        {chapter.lessons.map((lesson) => {
                          const isLessonAssigned =
                            activeConfig.chapterIds.includes(chapter.id) &&
                            !removedLessonIds.has(lesson.id);

                          return (
                            <Box
                              key={lesson.id}
                              className="chapter-selection-lesson-row"
                            >
                              <span />
                              <Typography>{lesson.name}</Typography>
                              {isLessonAssigned && <strong>Assigned</strong>}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};
