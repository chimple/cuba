import React, { useEffect, useState } from "react";
import "./DashBoardDetails.css";
import { useHistory, useLocation } from "react-router";
import Header from "../components/homePage/Header";
import { BANDWISECOLOR, PAGES, TableTypes } from "../../common/constants";
import { t } from "i18next";
import DashBoardStudentProgres from "../components/homePage/DashBoardStudentProgres";

interface DashBoardDetailsProps {}
const DashBoardDetails: React.FC<DashBoardDetailsProps> = ({}) => {
  const history = useHistory();
  const bandcolor: string = history.location.state!["bandcolor"] as string;
  const studentsProgress: Map<
    string,
    TableTypes<"user"> | TableTypes<"result">[]
  >[] = history.location.state!["studentProgress"] as Map<
    string,
    TableTypes<"user"> | TableTypes<"result">[]
  >[];
  const studentLength: string = history.location.state![
    "studentLength"
  ] as string;
  return (
    <div className="dashboard-details-container">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
        }}
      />
      <main className="dashboard-details-body">
        <div
          className="dashboard-group-wise-header"
          style={{ backgroundColor: bandcolor }}
        >
          {bandcolor === BANDWISECOLOR.RED
            ? t("Need Help")
            : bandcolor === BANDWISECOLOR.YELLOW
              ? t("Still Learning")
              : bandcolor === BANDWISECOLOR.GREEN
                ? t("Doing Good")
                : t("Not Tracked")}
          <span style={{ marginLeft: "10px" }}>
            {studentsProgress.length} / {studentLength}
          </span>
        </div>
        {studentsProgress.map((stdpr) => (
          <DashBoardStudentProgres studentProgress={stdpr} />
        ))}
      </main>
    </div>
  );
};

export default DashBoardDetails;
