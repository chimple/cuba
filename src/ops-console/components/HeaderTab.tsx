import React from "react";
import { Tabs, Tab } from "@mui/material";
import "./HeaderTab.css"; // Import the CSS file

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
      className="tabs-container-HeaderTab"
    >
      {tabs.map((tab, index) => (
        <Tab
          key={index}
          label={tab.label}
          className={`tab-item ${activeTab === index ? "active" : ""}`}
        />
      ))}
    </Tabs>
  );
};

export default TabComponent;