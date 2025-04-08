import React, { useEffect, useRef, useState } from "react";
import { t } from "i18next";
import { FaCloudUploadAlt } from "react-icons/fa";
import "./ErrorPage.css";
import ErrorIcon from "../assets/icons/error_icon.png";
import { Link } from "react-router-dom";
import { PAGES } from "../../common/constants";

const ErrorPage = () => {
  return (
    <div className="error-page">
      <div className="error-page-container">
        <img className="error-icon" src={ErrorIcon} alt="Upload Icon" />
        <div className="error-page-header">
          {t("Errors Found in Uploaded File")}
        </div>
        <p className="error-page-info">
          {t(
            "We found issues in your file. A revised version with error details has been generated—please review and fix them before re-uploading."
          )}
        </p>
        <div className="error-page-actions">
          <button className="error-page-btn error-page-next-btn">
            {t("Download File")}
          </button>
        </div>
        <Link
          to={`${PAGES.UPLOAD_PAGE}?reupload=true`}
          className="download-template"
        >
          <FaCloudUploadAlt />
          &nbsp; &nbsp;
          {t("Re-Upload")}
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
