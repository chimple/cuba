import React from "react";
import "./comingSoon.css";
import aiImage from '../../../assets/images/aiImage.png';
import { t } from "i18next";

const ComingSoon: React.FC = () => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        <img className="coming-soon-image" src={aiImage} alt="loading..." />
        <div className="coming-soon-content">
          <div className="coming-soon-title">{t("COMING SOON")}</div>
          <div className="coming-soon-description">
            {t("AI-driven workspace designed for teachers to simplify classroom tasks")}
          </div>
          <div className="coming-soon-stay-connected">
            {t("Stay Connected ...")}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ComingSoon;
