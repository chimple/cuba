import React, { useState } from "react";
import { AppBar, IconButton, Tab, Tabs, Box } from "@mui/material";
import "./ChangeClass.css";
import SelectClass from "./SelectClass";
import { t } from "i18next";
import CloseIcon from "@mui/icons-material/Close";

const ChangeClass: React.FC<{
  teachersName?: string;
  classStandard?: string;
}> = ({ teachersName, classStandard }) => {
  const [selectedClass, setSelectedClass] = useState<string | undefined>();
  const [headerClass, setHeaderClass] = useState<string | undefined>();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSwitchClass = (className: string) => {
    setSelectedClass(className);
    console.log("classname...", className);

    setHeaderClass(className);
  };

  return (
    <div className="change-class-header-div">
      <div className="header-class1">
        <div>
          <CloseIcon />
        </div>
        <div className="change-class-header-image-div">
          <img
            style={{ width: "10vh" }}
            src="assets/avatars/owl.png"
            alt="Round"
          />
          <div className="header-teacher-name">
            {teachersName ? (
              <p className="header-teacher-name">{teachersName}</p>
            ) : (
              <p className="header-teacher-name"> Mrs jyoti</p>
            )}
            {headerClass ? (
              <p className="header-teacher-name">{headerClass}</p>
            ) : (
              classStandard
            )}
          </div>
        </div>
        <div></div>
      </div>
      <div>
        <AppBar className="changeclass-page-app-bar">
          <Box>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              TabIndicatorProps={{ style: { display: "none" } }}
              sx={{
                "& .MuiTab-root": {
                  color: "var(--text-color)",
                  backgroundColor: "#FFDC96",
                  borderRadius: "10px",
                  padding: "0 3vw",
                  margin: "2vh 2vh",
                  minHeight: "45px",
                  minWidth: "25vw",
                },
                "& .Mui-selected": {
                  color: "#1976d2 !important",
                  minHeight: "37px",
                  borderRadius: "10px",
                },
              }}
            >
              <Tab label={t("School")} />
              <Tab label={t("Class")} />
              <Tab label={t("Subjects")} />
            </Tabs>
          </Box>
        </AppBar>
      </div>

      {tabValue === 1 && (
        <SelectClass
          classes={["1st standard", "2nd standard", "3rd standard"]}
          selectedClass={selectedClass}
          onSwitchClass={handleSwitchClass}
        />
      )}
    </div>
  );
};

export default ChangeClass;
