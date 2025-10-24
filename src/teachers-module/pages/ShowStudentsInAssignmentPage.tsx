import React, { useState, useEffect } from "react";
import { PAGES, TableTypes } from "../../common/constants";
import { useHistory } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import Header from "../components/homePage/Header";
import "./ShowStudentsInAssignmentPage.css";
import CreateSelectedAssignment from "../components/homePage/assignment/CreateSelectedAssignment";
import { Util } from "../../utility/util";

const ShowStudentsInAssignmentPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(
    null
  );
  const [currentSchool, setCurrentSchool] = useState<
    TableTypes<"school"> | undefined
  >();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const tempClass = await Util.getCurrentClass();
      if (tempClass) setCurrentClass(tempClass);
      const currentSchool = Util.getCurrentSchool();
      setCurrentSchool(currentSchool);
    } catch (error) {
      console.error("Failed to load ", error);
    }
  };

  const history = useHistory();
  const selectedAssignments =
    (history?.location?.state!["selectedAssignments"] as {}) ?? {};
  const manualAssignments =
    (history.location?.state!["manualAssignments"] as {}) ?? {};
  const recommendedAssignments =
    (history.location.state!["recommendedAssignments"] as {}) ?? {};

  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
  };

  return (
    <div className="main-page">
      <div className="fixed-header">
        <Header
          isBackButton={true}
          onBackButtonClick={onBackButtonClick}
          schoolName={currentSchool?.name}
          showSchool={true}
          showClass={true}
          className={currentClass?.name}
        />
      </div>
      <CreateSelectedAssignment
        selectedAssignments={selectedAssignments}
        manualAssignments={manualAssignments}
        recommendedAssignments={recommendedAssignments}
      ></CreateSelectedAssignment>
    </div>
  );
};

export default ShowStudentsInAssignmentPage;
