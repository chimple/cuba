import React from "react";
import { Fab } from "@mui/material";
import { FileUploadOutlined } from "@mui/icons-material";
import "./UploadButton.css";
import { t } from "i18next";

const UploadButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <div className="custom-fab-upload" onClick={onClick}>
      <div className="upload-button-file-upload-button-container">
        <FileUploadOutlined sx={{ color: "#1a71f6" }} />
        <div>{t("Upload")}</div>
      </div>
    </div>
  );
};

export default UploadButton;
