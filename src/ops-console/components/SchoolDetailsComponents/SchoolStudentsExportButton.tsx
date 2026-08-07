import React from 'react';
import { FileDownloadOutlined } from '@mui/icons-material';
import { Button as MuiButton } from '@mui/material';
import { t } from 'i18next';

type SchoolStudentsExportButtonProps = {
  hasStudents: boolean;
  isLoading: boolean;
  isPerformanceLoading: boolean;
  isExporting: boolean;
  onClick: () => void | Promise<void>;
};

const SchoolStudentsExportButton: React.FC<SchoolStudentsExportButtonProps> = ({
  hasStudents,
  isLoading,
  isPerformanceLoading,
  isExporting,
  onClick,
}) => (
  <MuiButton
    variant="outlined"
    onClick={onClick}
    disabled={isExporting || isLoading || isPerformanceLoading || !hasStudents}
    className="schoolStudents-newStudentButton-outlined schoolStudents-exportButton"
    startIcon={
      <FileDownloadOutlined className="schoolStudents-newStudentButton-outlined-icon" />
    }
  >
    {isExporting ? t('Exporting...') : t('Export')}
  </MuiButton>
);

export default SchoolStudentsExportButton;
