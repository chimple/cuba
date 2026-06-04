import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DeleteOutline, ExpandLess, ExpandMore } from '@mui/icons-material';
import { AssignmentRow, formatDisplayDate } from './campaignAssignmentUtils';
import './AssignmentSummary.css';

type AssignmentSummaryProps = {
  rows: AssignmentRow[];
  campaignDays: number;
  insufficientLessons: boolean;
  onRemoveLesson: (rowId: string) => void;
};

export const AssignmentSummary: React.FC<AssignmentSummaryProps> = ({
  rows,
  campaignDays,
  insufficientLessons,
  onRemoveLesson,
}) => {
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

  useEffect(() => {
    setCollapsedSubjects((current) => {
      const next: Record<string, boolean> = {};
      groupedRows.forEach(({ subjectName }) => {
        next[subjectName] = current[subjectName] ?? false;
      });
      return next;
    });
  }, [groupedRows]);

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
            campaign duration ({campaignDays} days). Consider adding more
            lessons.
          </Typography>
        </Box>
      )}

      {groupedRows.map(({ subjectName, subjectRows }) => {
        const isCollapsed = collapsedSubjects[subjectName] ?? false;

        return (
          <Box key={subjectName} className="assignment-summary-box">
            <button
              type="button"
              className="assignment-summary-subject"
              onClick={() =>
                setCollapsedSubjects((current) => ({
                  ...current,
                  [subjectName]: !isCollapsed,
                }))
              }
              aria-expanded={!isCollapsed}
              aria-label={
                isCollapsed
                  ? `Expand ${subjectName} assignments`
                  : `Collapse ${subjectName} assignments`
              }
            >
              {isCollapsed ? <ExpandMore /> : <ExpandLess />}
              <Typography>{subjectName}</Typography>
              <span>({subjectRows.length} assignments)</span>
            </button>
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
