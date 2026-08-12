import React from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CampaignAudienceSummary } from '../../../services/api/ServiceApi';

type MessagesAudienceSummaryProps = {
  programName: string;
  blockCount: number;
  schoolCount: number;
  userType: string;
  activityRecency: 'all' | 'active_7days' | 'inactive_7days';
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
  activityRecency,
  summary,
  recipientCount,
}) => {
  const { t } = useTranslation();
  const isStudentOnboardedView =
    userType.trim().toLowerCase() === 'student' && activityRecency === 'all';
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
          {t('AUDIENCE SUMMARY')}
        </Box>

        <Box className="messages-page__audience-summary-grid">
          <span className="messages-page__audience-summary-label">
            {t('Program')}
          </span>
          <strong className="messages-page__audience-summary-value">
            {programName || '-'}
          </strong>

          <span className="messages-page__audience-summary-label">
            {t('Block')}
          </span>
          <strong className="messages-page__audience-summary-value">
            {blockCount}
          </strong>

          <span className="messages-page__audience-summary-label">
            {t('Number of Schools')}
          </span>
          <strong className="messages-page__audience-summary-value">
            {schoolCount}
          </strong>

          <span className="messages-page__audience-summary-label">
            {t('Grade')}
          </span>
          <strong className="messages-page__audience-summary-value">
            {gradeLabel}
          </strong>

          <span className="messages-page__audience-summary-label">
            {t('User Type')}
          </span>
          <strong className="messages-page__audience-summary-value">
            {userType}
          </strong>
        </Box>

        <Box className="messages-page__audience-summary-footer">
          <span>{t('Estimated Recipient Count:')}</span>
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
