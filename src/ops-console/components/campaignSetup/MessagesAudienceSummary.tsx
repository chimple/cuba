import React from 'react';
import { Box } from '@mui/material';
import { CampaignAudienceSummary } from '../../../services/api/ServiceApi';

type MessagesAudienceSummaryProps = {
  programName: string;
  blockCount: number;
  schoolCount: number;
  userType: string;
  summary: CampaignAudienceSummary;
  recipientCount: number | null;
};

const getEmptyAudienceMessage = (userType: string) => {
  const normalized = userType.trim().toLowerCase();

  if (normalized === 'teacher') {
    return 'Unable to proceed. The selected Target Audience has 0 teachers.';
  }

  if (normalized === 'principal') {
    return 'Unable to proceed. The selected Target Audience has 0 principals.';
  }

  return 'Unable to proceed. The selected Target Audience has 0 students.';
};

export const MessagesAudienceSummary: React.FC<
  MessagesAudienceSummaryProps
> = ({
  programName,
  blockCount,
  schoolCount,
  userType,
  summary,
  recipientCount,
}) => {
  const hasNoStudents = recipientCount === 0;
  const emptyAudienceMessage = getEmptyAudienceMessage(userType);
  const gradeLabel =
    summary.grades.length > 0
      ? summary.grades.map((grade) => grade.gradeName).join(', ')
      : '-';
  return (
    <>
      <Box className="messages-page__audience-summary-card">
        <Box className="messages-page__audience-summary-title">
          AUDIENCE SUMMARY
        </Box>

        <Box className="messages-page__audience-summary-grid">
          <span className="messages-page__audience-summary-label">Program</span>
          <strong className="messages-page__audience-summary-value">
            {programName || '-'}
          </strong>

          <span className="messages-page__audience-summary-label">Block</span>
          <strong className="messages-page__audience-summary-value">
            {blockCount}
          </strong>

          <span className="messages-page__audience-summary-label">
            Number of Schools
          </span>
          <strong className="messages-page__audience-summary-value">
            {schoolCount}
          </strong>

          <span className="messages-page__audience-summary-label">Grade</span>
          <strong className="messages-page__audience-summary-value">
            {gradeLabel}
          </strong>

          <span className="messages-page__audience-summary-label">
            User Type
          </span>
          <strong className="messages-page__audience-summary-value">
            {userType}
          </strong>
        </Box>

        <Box className="messages-page__audience-summary-footer">
          <span>Estimated Recipient Count:</span>
          <strong>{recipientCount ?? ''}</strong>
        </Box>
      </Box>
      {hasNoStudents && (
        <Box className="messages-page__audience-summary-error">
          {emptyAudienceMessage}
        </Box>
      )}
    </>
  );
};

export default MessagesAudienceSummary;
