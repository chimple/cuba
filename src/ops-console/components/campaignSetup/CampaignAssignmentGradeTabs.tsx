import React from 'react';
import { Box, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { CampaignOption } from '../../../services/api/ServiceApi';

type CampaignAssignmentGradeTabsProps = {
  activeGradeId: string;
  onActiveGradeChange: (gradeId: string) => void;
  selectedGrades: CampaignOption[];
  shouldShowSharedGradeHelper: boolean;
};

export const CampaignAssignmentGradeTabs = ({
  activeGradeId,
  onActiveGradeChange,
  selectedGrades,
  shouldShowSharedGradeHelper,
}: CampaignAssignmentGradeTabsProps) => (
  <>
    {shouldShowSharedGradeHelper && (
      <Box className="campaign-assignment-step-helper">
        <InfoOutlined />
        <Typography>
          Assignments should be configured for all selected grades. The selected
          assignment frequency will apply across all grades.
        </Typography>
      </Box>
    )}
    <Box
      className={`campaign-assignment-step-tabs ${
        shouldShowSharedGradeHelper
          ? ''
          : 'campaign-assignment-step-tabs-no-helper'
      }`}
      role="tablist"
    >
      {selectedGrades.map((grade) => (
        <button
          type="button"
          key={grade.id}
          className={`campaign-assignment-step-tab ${
            activeGradeId === grade.id
              ? 'campaign-assignment-step-tab-active'
              : ''
          }`}
          onClick={() => onActiveGradeChange(grade.id)}
        >
          {grade.name}
        </button>
      ))}
    </Box>
  </>
);
