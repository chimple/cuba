import React from "react";
import "./SchoolPerformance.css";
import { t } from "i18next";

interface SchoolPerformanceProps {
  overall: string;
  students: string;
  teachers: string;
  onViewAnalytics: () => void;
}

const SchoolPerformance: React.FC<SchoolPerformanceProps> = ({
  overall,
  students,
  teachers,
  onViewAnalytics,
}) => {
  return (
    <div className="school-performance-container">
      <div className="school-performance-header">
        <h2 className="school-performance-title">{t("School Performance")}</h2>
      </div>
      <hr className="school-performance-divider" />
      <div className="school-performance-content">
        <div className="school-performance-row">
          <p className="school-performance-label">{t("Over All")}</p>
          <p className="school-performance-value">{overall}</p>
        </div>
        <div className="school-performance-row">
          <p className="school-performance-label">{t("Students")}</p>
          <p className="school-performance-value">{students}</p>
        </div>
        <div className="school-performance-row">
          <p className="school-performance-label">{t("Teachers")}</p>
          <p className="school-performance-value">{teachers}</p>
        </div>
        <button className="school-performance-button" onClick={onViewAnalytics}>
          View Detailed Analytics
        </button>
      </div>
    </div>
  );
};

const SchoolPerformanceSection = () => {
  const handleAnalyticsClick = () => {
    alert("Redirecting to detailed analytics...");
  };

  return (
    <SchoolPerformance
      overall="85%"
      students="83%"
      teachers="78%"
      onViewAnalytics={handleAnalyticsClick}
    />
  );
};

export default SchoolPerformanceSection;
