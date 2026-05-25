import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DeleteOutline, ExpandLess, WarningAmber } from '@mui/icons-material';
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
  if (rows.length === 0) return null;

  return (
    <Box className="campaign-assignment-summary">
      <Typography variant="h6" className="campaign-setup-section-title">
        Assignment Summary ({rows.length} assignments)
      </Typography>
      {insufficientLessons && (
        <Box className="campaign-assignment-warning">
          <WarningAmber />
          <Typography>
            The number of lessons ({rows.length}) may not fully cover the
            campaign duration ({campaignDays} days). Consider adding more
            lessons.
          </Typography>
        </Box>
      )}

      {Array.from(new Set(rows.map((row) => row.subjectName))).map(
        (subjectName) => {
          const subjectRows = rows.filter(
            (row) => row.subjectName === subjectName,
          );
          return (
            <Box key={subjectName} className="campaign-assignment-summary-box">
              <Box className="campaign-assignment-summary-subject">
                <ExpandLess />
                <Typography>{subjectName}</Typography>
                <span>({subjectRows.length} assignments)</span>
              </Box>
              <Box className="campaign-assignment-table">
                <Box className="campaign-assignment-table-row campaign-assignment-table-head">
                  <span>Lesson #</span>
                  <span>Date</span>
                  <span>Lesson Name</span>
                  <span />
                </Box>
                {subjectRows.map((row) => (
                  <Box
                    key={row.rowId}
                    className="campaign-assignment-table-row"
                  >
                    <span className="campaign-assignment-lesson-number">
                      <i>{row.lessonNo}</i> Lesson {row.lessonNo}
                    </span>
                    <span style={{ fontWeight: 400 }}>
                      {formatDisplayDate(row.date)}
                    </span>
                    <span>{row.lessonName}</span>
                    <Button
                      type="button"
                      className="campaign-assignment-delete"
                      onClick={() => onRemoveLesson(row.rowId)}
                    >
                      <DeleteOutline />
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        },
      )}
    </Box>
  );
};
