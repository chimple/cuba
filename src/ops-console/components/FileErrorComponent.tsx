// ErrorPage.tsx
import React from "react";
import { t } from "i18next";
import { FaCloudUploadAlt } from "react-icons/fa";
import "./FileErrorComponent.css";
import ErrorIcon from "../assets/icons/error_icon.png";

interface ErrorPageProps {
  handleDownload?: () => void;
  reUplod: () => void;
  message?: string | null;
  title?: string | null;
}
const ErrorPage: React.FC<ErrorPageProps> = ({
  handleDownload,
  reUplod,
  message,
  title,
}) => {
  return (
    <div className="error-page">
      <div className="error-page-container">
        <img className="error-icon" src={ErrorIcon} alt="Upload Icon" />
        <div className="error-page-header">
          <p>{title ?? t("Errors Found in Uploaded File")}</p>
        </div>
        <p className="error-page-info">
          {message ??
            t(
              "We found issues in your file. A revised version with error details has been generated—please review and fix them before re-uploading."
            )}
        </p>
        <div className="error-page-actions">
          {!title && (
            <button
              className="error-page-btn error-page-next-btn"
              onClick={handleDownload}
            >
              {t("Download File")}
            </button>
          )}
        </div>
        {!title && (
          <button className="download-template" onClick={reUplod}>
            <FaCloudUploadAlt />
            &nbsp; &nbsp;
            {t("Re-Upload")}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
