import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './OpsGenericPopup.css';
import { t } from 'i18next';

interface OpsGenericPopupProps {
  isOpen: boolean;
  imageSrc?: string;
  heading: string;
  text: string;
  primaryButtonText?: string;
  autoCloseSeconds?: number;
  icon?: React.ReactNode;
  onPrimaryClick?: () => void;
  onClose?: () => void;
}

const OpsGenericPopup: React.FC<OpsGenericPopupProps> = ({
  isOpen,
  imageSrc,
  heading,
  text,
  primaryButtonText,
  autoCloseSeconds,
  icon,
  onPrimaryClick,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && autoCloseSeconds && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseSeconds, onClose]);

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      id="ops-generic-popup-overlay"
      className="ops-generic-popup-overlay"
    >
      <DialogContent
        id="ops-generic-popup-container"
        className="ops-generic-popup-container"
      >
        <IconButton
          id="ops-generic-popup-close-btn"
          className="ops-generic-popup-close-btn"
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>

        {icon && (
          <div id="ops-generic-popup-icon" className="ops-generic-popup-icon">
            {icon}
          </div>
        )}

        {!icon && imageSrc && (
          <div
            id="ops-generic-popup-image-wrapper"
            className="ops-generic-popup-image-wrapper"
          >
            <img
              src={imageSrc}
              alt="popup visual"
              className="ops-generic-popup-image"
            />
          </div>
        )}

        <Typography
          id="ops-generic-popup-heading"
          className="ops-generic-popup-heading"
        >
          {typeof heading === 'string' ? t(heading) || heading : ''}
        </Typography>

        <Typography
          id="ops-generic-popup-text"
          className="ops-generic-popup-text"
        >
          {typeof text === 'string' ? t(text) || text : ''}
        </Typography>

        {primaryButtonText && (
          <Button
            id="ops-generic-popup-primary-btn"
            className="ops-generic-popup-primary-btn"
            variant="contained"
            fullWidth
            onClick={() => {
              onPrimaryClick?.();
              handleClose();
            }}
          >
            {typeof primaryButtonText === 'string'
              ? t(primaryButtonText) || primaryButtonText
              : ''}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OpsGenericPopup;
