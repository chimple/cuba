import React, { useState } from "react";
import "./SchoolDetailsTabs.css";
import OverviewLayout from "./schools/OverviewLayout";
import { t } from "i18next";
import SchoolHeader from "./SchoolHeader";

const tabs = [
  t("Overview"),
  t("Students"),
  t("Teachers"),
  t("Principals"),
  t("Coordinators"),
];

const SchoolDetailsTabs: React.FC = () => {
  const tabKeys = [
    "Overview",
    "Students",
    "Teachers",
    "Principals",
    "Coordinators",
  ];
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <>
      <div className="school-header">
        <SchoolHeader id="357c524e-de59-412e-a3d7-8b4b7d46b6ad" />
      </div>
      <div className="role-tabs-wrapper">
        <div className="role-tabs-container">
          {tabs.map((tabLabel, i) => (
            <button
              key={tabKeys[i]}
              onClick={() => setActiveTab(tabKeys[i])}
              className={`role-tab-button ${activeTab === tabKeys[i] ? "active" : ""}`}
            >
              {tabLabel}
            </button>
          ))}
        </div>
      </div>
      <div className="tab-content">
        {activeTab === "Overview" && (
          <div className="overview-grid">
            <OverviewLayout id="357c524e-de59-412e-a3d7-8b4b7d46b6ad" />
          </div>
        )}
      </div>
    </>
  );
};

export default SchoolDetailsTabs;
