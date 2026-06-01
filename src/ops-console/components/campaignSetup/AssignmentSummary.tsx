import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DeleteOutline, ExpandLess } from '@mui/icons-material';
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
          <Typography>
            The number of lessons ({rows.length}) may not fully cover the
            campaign duration ({campaignDays} days). Consider adding more
            lessons.
          </Typography>
        </Box>
      )}

      {groupedRows.map(({ subjectName, subjectRows }) => {
        return (
          <Box key={subjectName} className="assignment-summary-box">
            <Box className="assignment-summary-subject">
              <ExpandLess />
              <Typography>{subjectName}</Typography>
              <span>({subjectRows.length} assignments)</span>
            </Box>
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
          </Box>
        );
      })}
    </Box>
  );
};
