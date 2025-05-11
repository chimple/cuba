// src/components/BottomNav.js
import React, { useState, useEffect } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { useHistory, useLocation } from "react-router-dom";
import "./HomePage.css";
import DashBoard from "../components/homePage/dashBoard/DashBoard";
import Header from "../components/homePage/Header";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import TeacherAssignment from "../components/homePage/assignment/TeacherAssignment";
import Library from "../components/library/Library";
import ReportTable from "../components/reports/ReportsTable";
import {
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  PAGES,
  TableTypes,
} from "../../common/constants";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { App } from "@capacitor/app";
import { t } from "i18next";
import ComingSoon from "../components/homePage/ai/comingSoon";

const HomePage: React.FC = () => {
  const history = useHistory();
  const tab = (history.location.state!["tabValue"] as number) ?? 0;
  const [tabValue, setTabValue] = useState(tab);
  const [currentClass, setCurrentClass] =
    useState<TableTypes<"class"> | null>();
  const currentSchool = Util.getCurrentSchool();
  const [refresh, setRefresh] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    init();
    const handleClassChange = () => {
      init();
      setRefresh((prev) => !prev);
    };

    window.addEventListener(CLASS_OR_SCHOOL_CHANGE_EVENT, handleClassChange);

    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        setRenderKey((prev) => prev + 1);
        console.log("Active");
      } else {
        console.log("Non Active");
      }
    });

    return () => {
      window.removeEventListener(
        CLASS_OR_SCHOOL_CHANGE_EVENT,
        handleClassChange
      );
      listener.remove();
    };
  }, [currentSchool, currentClass]);

  const fetchClassDetails = async () => {
    try {
      const tempClass = await Util.getCurrentClass();
      if (!tempClass) {
        setCurrentClass(null);
      }
      if (tempClass) setCurrentClass(tempClass);
      console.log("class data...", tempClass);
    } catch (error) {
      console.error("Failed to load class details", error);
    }
  };

  const init = async () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "portrait" });
    }
    const currentUser = await auth.getCurrentUser();
    await Util.handleClassAndSubjects(
      currentSchool?.id!,
      currentUser?.id!,
      history,
      PAGES.HOME_PAGE
    );

    await fetchClassDetails();
  };

  const handleChange = (event, newValue) => {
    if (newValue == 3) {
      const tabValue = history.location.state!["tabValue"];
      history.replace(history.location.pathname, { tabValue });
    }
    setTabValue(newValue);
  };
  const renderComponent = () => {
    switch (tabValue) {
      case 0:
        return <DashBoard />;
      case 1:
        return <Library />;
      case 2:
        return (
          <TeacherAssignment
            onLibraryClick={() => {
              setTabValue(1);
            }}
          />
        );
      case 3:
        return (
          <ReportTable
            handleButtonClick={() => {
              setTabValue(1);
            }}
            isAssignmentsProp={
              history.location.state!["isAssignments"] ?? undefined
            }
            selectedTypeProp={
              history.location.state!["selectedType"] ?? undefined
            }
            sortTypeProp={history.location.state!["sortType"] ?? undefined}
            endDateProp={history.location.state!["endDate"] ?? undefined}
            startDateProp={history.location.state!["startDate"] ?? undefined}
          />
        );
      case 4:
        return <ComingSoon/>

      default:
        return <Library />;
    }
  };

  return (
    <div className="main-container" key={renderKey}>
      <Header
        showSchool={true}
        showClass={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
        isBackButton={false}
        showSideMenu={true}
        onButtonClick={() => {}}
      />
      <main className="home-container-body" key={`refresh-${refresh}`}>
        {renderComponent()}
      </main>
      <footer className="container-footer">
        <BottomNavigation
          value={tabValue}
          onChange={handleChange}
          className="bottom-nav"
          showLabels
          style={{ height: "10vh" }}
        >
          <BottomNavigationAction
            label={t("Home")}
            icon={
              tabValue === 0 ? (
                <img
                  className="footerIcons"
                  src="assets/icons/homeSelected.png"
                />
              ) : (
                <img className="footerIcons" src="assets/icons/home.png" />
              )
            }
            className="bottom-nav-action"
          />
          <BottomNavigationAction
            label={t("Library")}
            icon={
              tabValue === 1 ? (
                <img
                  className="footerIcons"
                  src="assets/icons/bookSelected.png"
                />
              ) : (
                <img className="footerIcons" src="assets/icons/book.png" />
              )
            }
            className="bottom-nav-action"
          />
          <BottomNavigationAction
            label={t("Assign")}
            icon={
              tabValue === 2 ? (
                <img
                  className="footerIcons assignSelectedIcon"
                  src="assets/icons/assignmentSelected.png"
                />
              ) : (
                <img
                  className="footerIcons assignSelectedIcon"
                  src="assets/icons/assignmentfooter.png"
                />
              )
            }
            className="bottom-nav-action middle-action"
          />
          <BottomNavigationAction
            label={t("Reports")}
            icon={
              tabValue === 3 ? (
                <img
                  className="footerIcons"
                  src="./assets/icons/reportSelected.png"
                />
              ) : (
                <img className="footerIcons" src="./assets/icons/report.png" />
              )
            }
            className="bottom-nav-action"
          />
          <BottomNavigationAction
            label="AI"
            icon={
              tabValue === 4 ? (
                <img
                  className="footerIcons"
                  src="./assets/icons/aiSelected.png"
                />
              ) : (
                <img className="footerIcons" src="./assets/icons/ai.png" />
              )
            }
            className="bottom-nav-action"
          />
        </BottomNavigation>
      </footer>
    </div>
  );
};

export default HomePage;
