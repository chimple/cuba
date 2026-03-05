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
    null,
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
  const navigationState = history.location?.state as
    | {
        selectedAssignments?: {};
        manualAssignments?: {};
        recommendedAssignments?: {};
        fromPage?: string;
        qrAssignmentNavigationState?: {
          chapterId: string;
          courseId: string;
          fromPage?: string;
        };
      }
    | undefined;
  const selectedAssignments =
    (navigationState?.selectedAssignments as {}) ?? {};
  const manualAssignments = (navigationState?.manualAssignments as {}) ?? {};
  const recommendedAssignments =
    (navigationState?.recommendedAssignments as {}) ?? {};
  const fromPage = navigationState?.fromPage;
  const qrAssignmentNavigationState =
    navigationState?.qrAssignmentNavigationState;

  const onBackButtonClick = () => {
    if (fromPage === PAGES.TEACHER_RECOMMENDED_ASSIGNMENTS) {
      history.replace(PAGES.TEACHER_RECOMMENDED_ASSIGNMENTS);
      return;
    }
    if (fromPage === PAGES.QR_ASSIGNMENTS && qrAssignmentNavigationState) {
      history.replace(PAGES.QR_ASSIGNMENTS, qrAssignmentNavigationState);
      return;
    }
    history.replace(PAGES.TEACHER_ASSIGNMENT);
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
