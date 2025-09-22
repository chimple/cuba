import React, { useState, useEffect } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { useHistory, useLocation } from "react-router-dom";
import "./HomePage.css";
import DashBoard from "../components/homePage/dashBoard/DashBoard";
import Header from "../components/homePage/Header";
import { Capacitor, registerPlugin } from "@capacitor/core";
import TeacherAssignment from "../components/homePage/assignment/TeacherAssignment";
import Library from "../components/library/Library";
import ReportTable from "../components/reports/ReportsTable";
import {
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  PAGES,
  ROLE_CHANGED,
  TableTypes,
} from "../../common/constants";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { App } from "@capacitor/app";
import { t } from "i18next";
import ComingSoon from "../components/homePage/ai/comingSoon";
import { updateLocalAttributes, useGbContext } from "../../growthbook/Growthbook";
import { toPng } from "html-to-image";
import { IoShareSocialSharp } from "react-icons/io5";
import { Filesystem, Directory } from "@capacitor/filesystem";
const HomePage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{
    tabValue?: number;
    isAssignments?: boolean;
    selectedType?: string;
    sortType?: string;
    startDate?: string;
    endDate?: string;
  }>();
  // 1) Safely grab tabValue (default to 0)
  const initialTab = location.state?.tabValue ?? 0;
  const [tabValue, setTabValue] = useState<number>(initialTab);
  const [currentClass, setCurrentClass] =
    useState<TableTypes<"class"> | null>(null);
  const currentSchool = Util.getCurrentSchool();
  const [refresh, setRefresh] = useState(false);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [renderKey, setRenderKey] = useState(0);
  const PortPlugin = registerPlugin<any>("Port");
  const { setGbUpdated } = useGbContext();
  useEffect(() => {
    init();
    const handleClassChange = () => {
      init();
      setRefresh(prev => !prev);
    };
    window.addEventListener(CLASS_OR_SCHOOL_CHANGE_EVENT, handleClassChange);
    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        setRenderKey(prev => prev + 1);
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
      const tempClass = Util.getCurrentClass();
      setCurrentClass(tempClass ?? null);
      updateLocalAttributes({
        teacher_class_id: tempClass?.id,
        teacher_school_id: currentSchool?.id,
      });
      setGbUpdated(true);
    } catch (error) {
      console.error("Failed to load class details", error);
    }
  };
  const init = async () => {
    if (Capacitor.isNativePlatform()) {
      window.dispatchEvent(new Event(ROLE_CHANGED));
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
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    // preserve whatever state you need when switching
    setTabValue(newValue);
  };
  const renderComponent = () => {
    const key = currentClass?.id || "";
    switch (tabValue) {
      case 0:
        return <DashBoard key={key} />;
      case 1:
        return <Library key={key} />;
      case 2:
        return (
          <TeacherAssignment key={key} onLibraryClick={() => setTabValue(1)} />
        );
      case 3:
        return (
          <ReportTable
            key={key}
            handleButtonClick={() => setTabValue(1)}
            isAssignmentsProp={location.state?.isAssignments}
            selectedTypeProp={location.state?.selectedType}
            sortTypeProp={location.state?.sortType}
            startDateProp={location.state?.startDate}
            endDateProp={location.state?.endDate}
          />
        );
      case 4:
        return <ComingSoon key={key} />;
      default:
        return <Library key={key} />;
    }
  };
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };
  const handleShare = async () => {
    if (tabValue !== 3) return;
    const el = document.querySelector(
      ".Reports-Table-capture-report-table"
    ) as HTMLElement | null;
    if (!el) return;
    const prevMargin = el.style.marginTop;
    el.style.marginTop = "0px";
    try {
      const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: "white" });
      const fileName = `report-screenshot-${Date.now()}.png`;
      if (!Capacitor.isNativePlatform()) {
        const file = dataURLtoFile(dataUrl, fileName);
        await Util.sendContentToAndroidOrWebShare(
          "Report screenshot attached.",
          "Report Screenshot",
          undefined,
          [file]
        );
      } else {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });
        const fileUri = savedFile.uri.replace("file://", "");
        await PortPlugin.shareContentWithAndroidShare({
          text: "Report screenshot attached.",
          title: "Report Screenshot",
          url: "",
          imageFile: { name: fileName, path: fileUri },
        });
      }
    } catch (err) {
      console.error("Failed to capture or share screenshot.", err);
    } finally {
      el.style.marginTop = prevMargin;
    }
  };
  return (
    <div className="main-container" key={renderKey}>
      <Header
        showSchool
        showClass
        className={currentClass?.name}
        schoolName={currentSchool?.name}
        isBackButton={false}
        showSideMenu
        onShareClick={tabValue === 3 ? handleShare : undefined}
      />
      <main className="home-container-body">{renderComponent()}</main>
      <footer className="container-footer">
        <BottomNavigation
          value={tabValue}
          onChange={handleChange}
          className="homepage-bottom-nav"
          showLabels
          style={{ height: "10vh" }}
        >
          <BottomNavigationAction
            label={t("Home")}
            icon={
              <img
                className="footerIcons"
                src={
                  tabValue === 0
                    ? "assets/icons/homeSelected.png"
                    : "assets/icons/home.png"
                }
                alt=""
              />
            }
          />
          <BottomNavigationAction
            label={t("Library")}
            icon={
              <img
                className="footerIcons"
                src={
                  tabValue === 1
                    ? "assets/icons/bookSelected.png"
                    : "assets/icons/book.png"
                }
                alt=""
              />
            }
          />
          <BottomNavigationAction
            label={t("Assign")}
            icon={
              <img
                className="footerIcons"
                src={
                  tabValue === 2
                    ? "assets/icons/assignmentSelected.png"
                    : "assets/icons/assignmentfooter.png"
                }
                alt=""
              />
            }
            className="middle-action"
          />
          <BottomNavigationAction
            label={t("Reports")}
            icon={
              <img
                className="footerIcons"
                src={
                  tabValue === 3
                    ? "assets/icons/reportSelected.png"
                    : "assets/icons/report.png"
                }
                alt=""
              />
            }
          />
          <BottomNavigationAction
            label="AI"
            icon={
              <img
                className="footerIcons"
                src={
                  tabValue === 4
                    ? "assets/icons/aiSelected.png"
                    : "assets/icons/ai.png"
                }
                alt=""
              />
            }
          />
        </BottomNavigation>
      </footer>
    </div>
  );
};
export default HomePage;