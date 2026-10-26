import React from 'react';
import { Button } from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import { t } from 'i18next';
import './SchoolListExportButton.css';

type SchoolListExportButtonProps = {
  disabled: boolean;
  id?: string;
  isExporting: boolean;
  isMenuOpen?: boolean;
  menuId?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
};

// Dedicated export CTA keeps the page toolbar markup small and easier to maintain.
const SchoolListExportButton: React.FC<SchoolListExportButtonProps> = ({
  disabled,
  id = 'school-list-export-button',
  isExporting,
  isMenuOpen = false,
  menuId,
  onClick,
}) => (
  <Button
    variant="outlined"
    id={id}
    className="school-list-actions-button school-list-export-button"
    startIcon={<FileDownloadOutlined className="school-list-upload-icon" />}
    onClick={onClick}
    disabled={disabled}
    aria-controls={isMenuOpen ? menuId : undefined}
    aria-expanded={menuId ? isMenuOpen : undefined}
    aria-haspopup={menuId ? 'menu' : undefined}
  >
    {isExporting ? t('Exporting...') : t('Export')}
  </Button>
);

export default SchoolListExportButton;
