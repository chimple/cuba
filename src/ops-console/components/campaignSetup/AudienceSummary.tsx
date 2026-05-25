import React from 'react';
import { Box } from '@mui/material';
import { CampaignAudienceSummary } from '../../../services/api/ServiceApi';

type AudienceSummaryProps = {
  selectedProgramName: string;
  summaryBlockCount: number;
  summarySchoolCount: number;
  loadingAudienceSummary: boolean;
  audienceSummary: CampaignAudienceSummary;
};

export const AudienceSummary: React.FC<AudienceSummaryProps> = ({
  selectedProgramName,
  summaryBlockCount,
  summarySchoolCount,
  loadingAudienceSummary,
  audienceSummary,
}) => (
  <Box className="campaign-setup-audience-summary">
    <span>
      Program:{' '}
      <strong title={selectedProgramName}>{selectedProgramName}</strong>
    </span>
    <span className="campaign-setup-summary-dot">·</span>
    <span>
      Blocks: <strong>{summaryBlockCount}</strong>
    </span>
    <span className="campaign-setup-summary-dot">·</span>
    <span>
      Schools: <strong>{summarySchoolCount}</strong>
    </span>
    <span className="campaign-setup-summary-dot">·</span>
    <span>Students:</span>
    {loadingAudienceSummary && <span>Loading...</span>}
    {!loadingAudienceSummary &&
      (audienceSummary.grades.length > 0 ? (
        audienceSummary.grades.map((grade, index) => (
          <React.Fragment key={grade.gradeId}>
            {index > 0 && <span className="campaign-setup-summary-dot">·</span>}
            <span>
              {grade.gradeName} - <strong>{grade.studentCount}</strong>
            </span>
          </React.Fragment>
        ))
      ) : (
        <span>
          <strong>0</strong>
        </span>
      ))}
  </Box>
);
