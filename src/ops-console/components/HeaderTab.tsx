import React from "react";
import { Tabs, Tab } from "@mui/material";
import "./HeaderTab.css";

interface TabComponentProps {
  activeTab: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: { label: string }[];
}

const TabComponent: React.FC<TabComponentProps> = ({
  activeTab,
  handleTabChange,
  tabs,
}) => {
  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      className="HeaderTab-tabs-container"
      variant="scrollable"
      scrollButtons="auto"
      TabIndicatorProps={{ className: "HeaderTab-custom-tab-indicator" }}
    >
      {tabs.map((tab, index) => (
        <Tab
          sx={{
            textTransform: "none",
          }}
          key={index}
          label={tab.label}
          className={`HeaderTab-tab-item ${
            activeTab === index ? "active" : ""
          }`}
        />
      ))}
    </Tabs>
  );
};

export default TabComponent;
