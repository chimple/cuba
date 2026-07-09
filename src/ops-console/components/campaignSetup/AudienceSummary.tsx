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
}) => {
  const totalStudentCount = audienceSummary.grades.reduce(
    (total, grade) => total + grade.studentCount,
    0,
  );
  const hasNoStudents = !loadingAudienceSummary && totalStudentCount === 0;

  return (
    <>
      <Box className="target-audience-section-summary">
        <Box className="target-audience-section-summary-row">
          <span>
            Program:{' '}
            <strong title={selectedProgramName}>{selectedProgramName}</strong>
          </span>
          <span className="target-audience-section-summary-dot">·</span>
          <span>
            Blocks: <strong>{summaryBlockCount}</strong>
          </span>
          <span className="target-audience-section-summary-dot">·</span>
          <span>
            Schools: <strong>{summarySchoolCount}</strong>
          </span>
        </Box>
        <Box className="target-audience-section-summary-row">
          <span>Students:</span>
          {loadingAudienceSummary && <span>Loading...</span>}
          {!loadingAudienceSummary &&
            (audienceSummary.grades.length > 0 ? (
              audienceSummary.grades.map((grade, index) => (
                <React.Fragment key={grade.gradeId}>
                  {index > 0 && (
                    <span className="target-audience-section-summary-dot">
                      ·
                    </span>
                  )}
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
      </Box>
      {hasNoStudents && (
        <Box className="target-audience-section-zero-students-error">
          Unable to proceed. The selected Target Audience has 0 students.
        </Box>
      )}
    </>
  );
};
