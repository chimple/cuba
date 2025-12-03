import React, { useEffect, useState } from "react";
import "./SchoolDetailsTabs.css";
import "../../pages/SchoolDetailsPage.css";
import { t } from "i18next";
import { SchoolTabs } from "../../../interface/modelInterfaces";
import SchoolOverview from "./SchoolOverview";
import SchoolTeachers from "./SchoolTeachers";
import SchoolStudents from "./SchoolStudents";
import SchoolPrincipals from "./SchoolPrincipals";
import SchoolCoordinators from "./SchoolCoordinators";
import ClassDetailsPage from "./ClassDetailsPage";
import SchoolClasses from "./SchoolClass";

const tabEnumValues = Object.values(SchoolTabs);

interface SchoolDetailsTabsComponentProps {
  data: any;
  isMobile: boolean;
  schoolId: string;
  refreshClasses?: () => void;
  goToClassesTab?: boolean;
}

const SchoolDetailsTabsComponent: React.FC<SchoolDetailsTabsComponentProps> = ({
  data,
  isMobile,
  schoolId,
  refreshClasses,
  goToClassesTab
}) => {
  const [activeTab, setActiveTab] = useState<SchoolTabs>(SchoolTabs.Overview);
  
  useEffect(() => {
    if (goToClassesTab) {
      setActiveTab(SchoolTabs.Classes);
    }
  }, [goToClassesTab]);


  return (
    <div className="school-detail-role-tabs-wrapper">
      <div className="school-detail-role-tabs-container">
        {tabEnumValues.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`school-detail-role-tab-button ${
              activeTab === tabKey ? "selectedtab" : ""
            }`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>
      <div className="school-detail-tab-content">
        {activeTab === SchoolTabs.Overview && (
          <SchoolOverview data={data} isMobile={isMobile} />
        )}
        {activeTab === SchoolTabs.Classes && (
          <SchoolClasses data={data} isMobile={isMobile} schoolId={schoolId} refreshClasses={refreshClasses} />
        )}
        {activeTab === SchoolTabs.Students && (
          <SchoolStudents data={data} isMobile={isMobile} schoolId={schoolId} />
        )}
        {activeTab === SchoolTabs.Teachers && (
          <SchoolTeachers data={data} isMobile={isMobile} schoolId={schoolId} />
        )}
        {activeTab === SchoolTabs.Principals && (
          <SchoolPrincipals
            data={data}
            isMobile={isMobile}
            schoolId={schoolId}
          />
        )}
        {activeTab === SchoolTabs.Coordinators && (
          <SchoolCoordinators
            data={data}
            isMobile={isMobile}
            schoolId={schoolId}
          />
        )}
      </div>
    </div>
  );
};

export default SchoolDetailsTabsComponent;
