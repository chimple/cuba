import React, { useEffect, useState } from "react";
import "./DashBoardDetails.css";
import { useHistory, useLocation } from "react-router";
import Header from "../components/homePage/Header";
import { BANDWISECOLOR, PAGES, TableTypes } from "../../common/constants";
import { t } from "i18next";
import DashBoardStudentProgres from "../components/homePage/DashBoardStudentProgres";
import { Util } from "../../utility/util";

interface DashBoardDetailsProps {}
const DashBoardDetails: React.FC<DashBoardDetailsProps> = ({}) => {
  const [currentClass, setCurrentClass] = useState<TableTypes<"class"> | null>(null);
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
  
  const currentSchool = Util.getCurrentSchool();

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const tempClass = await Util.getCurrentClass();
        setCurrentClass(tempClass || null);
      } catch (err) {
        console.error("DashBoardDetails → Failed to load current class:", err);
        setCurrentClass(null);
      }
    };

    fetchClassDetails();
  }, []);
  return (
    <div className="dashboard-details-container">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
        }}
        showSchool={true}
        showClass={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
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
            {studentsProgress?.length} / {studentLength}
          </span>
        </div>
        {studentsProgress?.map((stdpr) => (
          <DashBoardStudentProgres studentProgress={stdpr} />
        ))}
      </main>
    </div>
  );
};

export default DashBoardDetails;
