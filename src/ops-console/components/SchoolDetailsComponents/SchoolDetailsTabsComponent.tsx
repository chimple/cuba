import React, { useState } from "react";
import "./SchoolDetailsTabs.css";
import "../../pages/SchoolDetailsPage.css";
import { t } from "i18next";
import { SchoolTabs } from "../../../interface/modelInterfaces";
import SchoolOverview from "./SchoolOverview";
import SchoolTeachers from "./SchoolTeachers";
import SchoolStudents from "./SchoolStudents";
import SchoolPrincipals from "./SchoolPrincipals";
import SchoolCoordinators from "./SchoolCoordinators";

const tabEnumValues = Object.values(SchoolTabs);

interface SchoolDetailsTabsComponentProps {
  data: any;
  isMobile: boolean;
}

const SchoolDetailsTabsComponent: React.FC<SchoolDetailsTabsComponentProps> = ({
  data,
  isMobile,
}) => {
  const [activeTab, setActiveTab] = useState<SchoolTabs>(SchoolTabs.Overview);

  return (
    <div className="school-detail-role-tabs-wrapper">
      <div className="school-detail-role-tabs-container">
        {tabEnumValues.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`school-detail-role-tab-button ${activeTab === tabKey ? "selectedtab" : ""}`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>
      <div className="school-detail-tab-content">
        {activeTab === SchoolTabs.Overview && (
          <SchoolOverview data={data} isMobile={isMobile} />
        )}
         {activeTab === SchoolTabs.Students && (
          <SchoolStudents data={data} isMobile={isMobile} />
        )}
         {activeTab === SchoolTabs.Teachers && (
          <SchoolTeachers data={data} isMobile={isMobile} />
        )}
         {activeTab === SchoolTabs.Principals && (
          <SchoolPrincipals data={data} isMobile={isMobile} />
        )}
         {activeTab === SchoolTabs.Coordinators && (
          <SchoolCoordinators data={data} isMobile={isMobile} />
        )}
      </div>
    </div>
  );
};

export default SchoolDetailsTabsComponent;
