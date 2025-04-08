import React from "react";
import VerifyIcon from "../assets/icons/verifiedicon.svg";
import "./FileVerifiedComponent.css";
import { t } from "i18next";

const VerifiedPage = () => {
  return (
    <div className="verified-page">
      <div className="verified-page-main">
        <div className="verified-page-container">
          <div className="verified-icon-container">
            <div className="verified-image">
              <img src={VerifyIcon} alt="Verification" />
            </div>
            <div className="verified-text">
              <p>{t("Verified")}</p>
            </div>
            <div className="verified-message">
              <p>
                {t(
                  "Your data has been successfully checked, and no errors were found."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifiedPage;
