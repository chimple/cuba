import React from "react";
import { AppBar, Tab, Tabs } from "@mui/material";
import BackButton from "../common/BackButton";
import { useHistory } from "react-router-dom";


interface TabBarProps {
  tabNames: string[];
  value: string;
  onChange: (newValue: string) => void;
  handleBackButton: () => void;
}

const CustomAppBar: React.FC<TabBarProps> = ({ tabNames, value, onChange, handleBackButton }) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };
  const history: any = useHistory();

  return (
    <div>
      <div className="back-button-InCustomAppBar">
        <BackButton onClicked={handleBackButton} />
      </div>
      <AppBar position="static" sx={{ flexDirection: "inherit", justifyContent: "space-evenly", padding: "3vh 1vw", backgroundColor: "#FF7925 !important", boxShadow: "0px 0px 0px 0px !important" }}>

        <Tabs
          value={value}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="secondary tabs example"
          scrollButtons="auto"
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
          {tabNames.map((tabName) => (
            <Tab key={tabName} value={tabName} label={tabName} id="Custom-AppBar" />
          ))}
        </Tabs>
      </AppBar>
    </div>
  );
};

export default CustomAppBar;

