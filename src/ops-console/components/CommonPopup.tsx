import React from "react";
import { Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./CommonPopup.css";

type CommonPopupProps = {
  open: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

const CommonPopup: React.FC<CommonPopupProps> = ({
  open,
  onClose,
  icon,
  title,
  subtitle,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      id="ops-common-popup-dialog"
      className="ops-common-popup-dialog"
    >
      <DialogContent id="ops-common-popup-content" className="ops-common-popup-content">
        <IconButton
          size="small"
          onClick={onClose}
          id="ops-common-popup-close"
          className="ops-common-popup-close"
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>
        <div id="ops-common-popup-container" className="ops-common-popup-container">
          <div id="ops-common-popup-icon" className="ops-common-popup-icon">{icon}</div>
          <Typography id="ops-common-popup-title" className="ops-common-popup-title">{title}</Typography>
          <Typography id="ops-common-popup-subtitle" className="ops-common-popup-subtitle">
            {subtitle}
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommonPopup;
