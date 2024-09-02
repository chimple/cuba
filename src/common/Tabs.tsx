import React, { useState } from "react";
import { AppBar, Tabs as MuiTabs, Tab } from "@mui/material";
import { t } from "i18next";

const Tabs: React.FC<{
  tabs: any;
  onSelectTab: (tab) => void;
}> = ({ tabs, onSelectTab }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    onSelectTab(tabs[newValue]);
  };

  return (
    <AppBar position="static" color="default">
      <MuiTabs
        value={selectedTab}
        onChange={handleTabChange}
        textColor="primary"
        variant="fullWidth"
        TabIndicatorProps={{ style: { background: "#7c5db0" } }}
        sx={{
          "& .MuiTab-root": {
            padding: "0 3vw",
            margin: "1vh 1vh",
            minHeight: "37px",
            textTransform: "none",
            fontSize: "var(--text-size)",
            color: "var(--text-color) !important",
          },
          "& .MuiTabs-flexContainer": {
            width: "100vw",
            background: "white",
          },
          "& .Mui-selected": {
            minHeight: "37px",
            background: "white",
            fontWeight: "bold",
            color: "var(--text-color) !important",
          },
        }}
      >
        {tabs &&
          tabs.map((tab, index) => <Tab key={index} label={t(tab)}></Tab>)}
      </MuiTabs>
    </AppBar>
  );
};

export default Tabs;
