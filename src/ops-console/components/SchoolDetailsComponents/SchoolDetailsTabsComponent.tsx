import React, { useState } from "react";
import "./SchoolDetailsTabs.css";
import "../../pages/SchoolDetailsPage.css";
import { t } from "i18next";
import { SchoolTabs } from "../../../interface/modelInterfaces";
import SchoolOverview from "./SchoolOverview";

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
    <div className="role-tabs-wrapper">
      <div className="role-tabs-container">
        {tabEnumValues.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`role-tab-button ${activeTab === tabKey ? "active" : ""}`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === SchoolTabs.Overview && (
          <SchoolOverview data={data} isMobile={isMobile} />
        )}
        {activeTab !== SchoolTabs.Overview && (
          <div>
            <h2>{activeTab} Tab</h2>
            <p>Content for the {activeTab} tab will go here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDetailsTabsComponent;
