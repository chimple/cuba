import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./OpsGenericPopup.css";
import { t } from "i18next";

interface OpsGenericPopupProps {
  isOpen: boolean;
  // MUI icon support
  imageSrc?: string;          // Image support
  heading: string;
  text: string;
  primaryButtonText?: string;
  autoCloseSeconds?: number;
  icon?: React.ReactNode;
}

const OpsGenericPopup: React.FC<OpsGenericPopupProps> = ({
  isOpen,
  imageSrc,
  heading,
  text,
  primaryButtonText,
  autoCloseSeconds,
  icon
}) => {
  const [open, setOpen] = useState(isOpen);

  // Sync with parent open state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Auto close logic
  useEffect(() => {
    if (open && autoCloseSeconds) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, autoCloseSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [open, autoCloseSeconds]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      id="ops-generic-popup-overlay"
      className="ops-generic-popup-overlay"
    >
      <DialogContent
        id="ops-generic-popup-container"
        className="ops-generic-popup-container"
      >
        {/* Close Button */}
        <IconButton
          id="ops-generic-popup-close-btn"
          className="ops-generic-popup-close-btn"
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>

        {/* Icon OR Image */}
        {icon && (
          <div
            id="ops-generic-popup-icon"
            className="ops-generic-popup-icon"
          >
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

        {/* Heading */}
        <Typography
          id="ops-generic-popup-heading"
          className="ops-generic-popup-heading"
        >
          {typeof heading === "string" ? t(heading) || heading : ""}
        </Typography>

        {/* Text */}
        <Typography
          id="ops-generic-popup-text"
          className="ops-generic-popup-text"
        >
          {typeof text === "string" ? t(text) || text : ""}
        </Typography>

        {/* Optional Button */}
        {primaryButtonText && (
          <Button
            id="ops-generic-popup-primary-btn"
            className="ops-generic-popup-primary-btn"
            variant="contained"
            fullWidth
            onClick={handleClose}
          >
            {typeof primaryButtonText === "string"
              ? t(primaryButtonText) || primaryButtonText
              : ""}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OpsGenericPopup;
