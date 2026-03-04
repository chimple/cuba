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
      className="ops-common-popup-dialog"
    >
      <DialogContent className="ops-common-popup-content">
        <IconButton
          size="small"
          onClick={onClose}
          className="ops-common-popup-close"
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>
        <div className="ops-common-popup-container">
          <div className="ops-common-popup-icon">{icon}</div>
          <Typography className="ops-common-popup-title">{title}</Typography>
          <Typography className="ops-common-popup-subtitle">
            {subtitle}
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommonPopup;
