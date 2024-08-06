import React from "react";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import BackButton from "../common/BackButton";
import { useHistory } from "react-router-dom";

interface TabBarProps {
  tabs: { [key: string]: React.ReactNode }; // Using an object map for tabs
  value: string;
  onChange: (newValue: string) => void;
  handleBackButton: () => void;
  customStyle?: boolean;
}

const CustomAppBar: React.FC<TabBarProps> = ({
  tabs,
  value,
  onChange,
  handleBackButton,
  customStyle,
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };
  const history: any = useHistory();

  return (
    <div>
      <div className="back-button-in-custom-app-bar">
        <BackButton onClicked={handleBackButton} />
      </div>
      <AppBar
        position="static"
        sx={{
          flexDirection: "inherit",
          justifyContent: "space-evenly",
          padding: "3vh 3vw 3vh 12vw",
          backgroundColor: "#FF7925 !important",
          boxShadow: "0px 0px 0px 0px !important",
        }}
      >
        <Box
          sx={{
            maxWidth: { xs: 500, sm: "clamp(13vw, 90vw, 90vw)", md: "89vw" },
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons={false}
            aria-label="scrollable auto tabs example"
            centered
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#FFFFFF !important",
                fontSize: "clamp(10px, 3vh, 20px)",
              },
              "& .MuiTab-root": { color: "#000000" },
              "& .Mui-selected": { color: "#FFFFFF !important" },
              "& .MuiTab-wrapper": { justifyContent: "space-around" },
              "& .MuiTab-root:not(:last-child)": { margin: "0 0rem " },
            }}
            className="custom-tabs"
          >
            {Object.entries(tabs).map(([tabId, tabName]) => (
              <Tab
                style={
                  customStyle
                    ? { fontWeight: "bold", width: "17vw" }
                    : undefined
                }
                key={tabId}
                value={tabId}
                label={tabName}
                id="custom-app-bar"
              />
            ))}
          </Tabs>
        </Box>
      </AppBar>
    </div>
  );
};

export default CustomAppBar;
