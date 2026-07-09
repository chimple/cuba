import React, { useMemo, useState } from 'react';
import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import { DeleteOutline, ExpandLess, ExpandMore } from '@mui/icons-material';
import { AssignmentRow, formatDisplayDate } from './campaignAssignmentUtils';
import './AssignmentSummary.css';

type AssignmentSummaryProps = {
  rows: AssignmentRow[];
  requiredAssignments: number;
  insufficientLessons: boolean;
  onRemoveLesson: (rowId: string) => void;
};

export const AssignmentSummary: React.FC<AssignmentSummaryProps> = ({
  rows,
  requiredAssignments,
  insufficientLessons,
  onRemoveLesson,
}) => {
  const isMobileView = useMediaQuery('(max-width:48rem)');
  const [collapsedSubjects, setCollapsedSubjects] = useState<
    Record<string, boolean>
  >({});

  const groupedRows = useMemo(() => {
    const groups = new Map<string, AssignmentRow[]>();
    rows.forEach((row) => {
      if (!groups.has(row.subjectName)) groups.set(row.subjectName, []);
      groups.get(row.subjectName)?.push(row);
    });
    return Array.from(groups.entries()).map(([subjectName, subjectRows]) => ({
      subjectName,
      subjectRows,
    }));
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <Box className="assignment-summary">
      <Typography variant="h6" className="campaign-setup-section-title">
        Assignment Summary ({rows.length} assignments)
      </Typography>
      {insufficientLessons && (
        <Box className="assignment-summary-warning">
          <span className="assignment-summary-warning-icon" aria-hidden="true">
            <span>!</span>
          </span>
          <Typography className="assignment-summary-warning-text">
            The number of lessons ({rows.length}) may not fully cover the
            campaign duration ({requiredAssignments} days). Consider adding more
            lessons.
          </Typography>
        </Box>
      )}

      {groupedRows.map(({ subjectName, subjectRows }) => {
        const isCollapsed = isMobileView
          ? false
          : (collapsedSubjects[subjectName] ?? false);

        return (
          <Box key={subjectName} className="assignment-summary-box">
            <Box
              className={`assignment-summary-subject${
                isMobileView ? ' assignment-summary-subject-static' : ''
              }`}
              component={isMobileView ? 'div' : 'button'}
              type={isMobileView ? undefined : 'button'}
              onClick={
                isMobileView
                  ? undefined
                  : () =>
                      setCollapsedSubjects((current) => ({
                        ...current,
                        [subjectName]: !isCollapsed,
                      }))
              }
              aria-expanded={isMobileView ? undefined : !isCollapsed}
              aria-label={
                isMobileView
                  ? undefined
                  : isCollapsed
                    ? `Expand ${subjectName} assignments`
                    : `Collapse ${subjectName} assignments`
              }
            >
              {!isMobileView && (isCollapsed ? <ExpandMore /> : <ExpandLess />)}
              <Typography>{subjectName}</Typography>
              <span>({subjectRows.length} assignments)</span>
            </Box>
            {!isCollapsed && (
              <Box className="assignment-summary-table">
                <Box className="assignment-summary-table-row assignment-summary-table-head">
                  <span>Lesson #</span>
                  <span>Date</span>
                  <span>Lesson Name</span>
                  <span />
                </Box>
                {subjectRows.map((row) => (
                  <Box key={row.rowId} className="assignment-summary-table-row">
                    <span className="assignment-summary-lesson-number">
                      <i>{row.lessonNo}</i> Lesson {row.lessonNo}
                    </span>
                    <span style={{ fontWeight: 400 }}>
                      {formatDisplayDate(row.date)}
                    </span>
                    <span>{row.lessonName}</span>
                    <Button
                      type="button"
                      className="assignment-summary-delete"
                      onClick={() => onRemoveLesson(row.rowId)}
                    >
                      <DeleteOutline />
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
