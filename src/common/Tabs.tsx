import React from "react";
import { AppBar, Tabs as MuiTabs, Tab } from "@mui/material";
import { t } from "i18next";

const Tabs: React.FC<{
  tabs: string[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}> = ({ tabs, selectedTab, onSelectTab }) => {
  const selectedTabIndex = tabs.indexOf(selectedTab);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    onSelectTab(tabs[newValue]);
  };

  return (
    <AppBar position="static" color="default">
      <MuiTabs
        value={selectedTabIndex >= 0 ? selectedTabIndex : 0}
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
            color: "#707070 !important",
            "&:hover": {
              backgroundColor: "transparent",
            },
          },
          "& .MuiTabs-flexContainer": {
            width: "100vw",
            background: "white",
          },
          "& .Mui-selected": {
            minHeight: "37px",
            background: "white",
            fontWeight: "bold",
            color: "#707070 !important",
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab key={index} label={t(tab)} />
        ))}
      </MuiTabs>
    </AppBar>
  );
};

export default Tabs;
