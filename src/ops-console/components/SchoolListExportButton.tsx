import React from 'react';
import { Button } from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import { t } from 'i18next';
import './SchoolListExportButton.css';

type SchoolListExportButtonProps = {
  disabled: boolean;
  isExporting: boolean;
  onClick: () => void | Promise<void>;
};

// Dedicated export CTA keeps the page toolbar markup small and easier to maintain.
const SchoolListExportButton: React.FC<SchoolListExportButtonProps> = ({
  disabled,
  isExporting,
  onClick,
}) => (
  <Button
    variant="outlined"
    id="school-list-export-button"
    className="school-list-actions-button school-list-export-button"
    startIcon={<FileDownloadOutlined className="school-list-upload-icon" />}
    onClick={onClick}
    disabled={disabled}
  >
    {isExporting ? t('Exporting...') : t('Export')}
  </Button>
);

export default SchoolListExportButton;
