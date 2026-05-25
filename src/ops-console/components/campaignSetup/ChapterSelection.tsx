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
  onToggleChapter: (chapterId: string) => void;
  onToggleExpanded: (chapterId: string) => void;
};

export const ChapterSelection: React.FC<ChapterSelectionProps> = ({
  gradeName,
  selectedSubjects,
  activeConfig,
  onToggleChapter,
  onToggleExpanded,
}) => (
  <>
    <Box className="campaign-assignment-section-heading">
      <Typography variant="h6" className="campaign-setup-section-title">
        Chapter Selection
      </Typography>
      <Typography className="campaign-setup-section-copy">
        Assign chapters for {gradeName || 'this grade'}.
      </Typography>
    </Box>

    <Box className="campaign-assignment-subjects">
      {selectedSubjects.map((subject) => (
        <Box key={subject.id} className="campaign-assignment-subject">
          <Box className="campaign-assignment-subject-header">
            <Typography className="campaign-assignment-subject-title">
              {subject.name}
            </Typography>
          </Box>
          <Box className="campaign-assignment-chapter-list">
            {subject.chapters.map((chapter) => {
              const isAssigned = activeConfig.chapterIds.includes(chapter.id);
              const isExpanded = activeConfig.expandedChapterIds.includes(
                chapter.id,
              );

              return (
                <Box
                  key={chapter.id}
                  className={`campaign-assignment-chapter ${
                    isExpanded ? 'campaign-assignment-chapter-expanded' : ''
                  }`}
                >
                  <Box className="campaign-assignment-chapter-row">
                    <Typography className="campaign-assignment-chapter-name">
                      {chapter.name}
                    </Typography>
                    <Typography className="campaign-assignment-activity-count">
                      {chapter.lessons.length} activities
                    </Typography>
                    <Button
                      type="button"
                      className={
                        isAssigned
                          ? 'campaign-assignment-remove-button'
                          : 'campaign-assignment-assign-button'
                      }
                      onClick={() => onToggleChapter(chapter.id)}
                    >
                      {isAssigned ? 'Remove' : 'Assign'}
                    </Button>
                    <Button
                      type="button"
                      className="campaign-assignment-expand-button"
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
                    <Box className="campaign-assignment-lessons">
                      {chapter.lessons.map((lesson) => (
                        <Box
                          key={lesson.id}
                          className="campaign-assignment-lesson-row"
                        >
                          <span />
                          <Typography>{lesson.name}</Typography>
                          {isAssigned && <strong>Assigned</strong>}
                        </Box>
                      ))}
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
