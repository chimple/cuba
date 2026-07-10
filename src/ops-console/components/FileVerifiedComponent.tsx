import React from "react";
import VerifyIcon from "../assets/icons/verifiedicon.svg";
import "./FileVerifiedComponent.css";

interface VerifiedPageProps {
  title: string;
  message: string;
}

const VerifiedPage: React.FC<VerifiedPageProps> = ({ title, message }) => {
  return (
    <div className="verified-page">
      <div className="verified-page-main">
        <div className="verified-page-container">
          <div className="verified-icon-container">
            <div className="verified-image">
              <img src={VerifyIcon} alt="Verification" />
            </div>
            <div className="verified-text">
              <p>{title}</p>
            </div>
            <div className="verified-message">
              <p>{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifiedPage;
