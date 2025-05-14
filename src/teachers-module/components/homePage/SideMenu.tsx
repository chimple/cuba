import React, { useState, useEffect } from "react";
import {
  IonMenu,
  IonHeader,
  IonMenuButton,
  IonToolbar,
  IonToggle,
  IonLabel,
  IonItem,
} from "@ionic/react";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { Util } from "../../../utility/util";
import {
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  CURRENT_MODE,
  CURRENT_USER,
  MODES,
  PAGES,
  SCHOOL,
} from "../../../common/constants";
import ProfileSection from "./ProfileDetail";
import SchoolSection from "./SchoolSection";
import ClassSection from "./ClassSection";
import "./SideMenu.css";
import { RoleType } from "../../../interface/modelInterfaces";
import { useHistory } from "react-router";
import { PiUserSwitchFill } from "react-icons/pi";
import { schoolUtil } from "../../../utility/schoolUtil";
import CommonToggle from "../../../common/CommonToggle";
import { Capacitor } from "@capacitor/core";
import DialogBoxButtons from "../../../components/parent/DialogBoxButtons​";
import { ImSwitch } from "react-icons/im";
import { t } from "i18next";

const SideMenu: React.FC<{
  handleManageSchoolClick: () => void;
  handleManageClassClick: () => void;
}> = ({ handleManageSchoolClick, handleManageClassClick }) => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [schoolData, setSchoolData] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [classData, setClassData] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [schoolRoles, setSchoolRoles] = useState<
    { schoolId: string; role: RoleType }[]
  >([]);

  const [classCode, setClassCode] = useState<number>();
  const [currentSchoolDetail, setsetcurrentSchoolDetail] = useState<{
    id: string | number;
    name: string;
  }>({ id: "", name: "" });
  const [currentClassDetail, setcurrentClassDetail] = useState<{
    id: string | number;
    name: string;
  }>({ id: "", name: "" });
  const [currentClassId, setCurrentClassId] = useState<string>("");
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, []);

  const api = ServiceConfig.getI()?.apiHandler;
  const fetchData = async () => {
    try {
      const currentUser =
        await ServiceConfig.getI()?.authHandler.getCurrentUser();
      if (!currentUser) {
        console.error("No user is logged in.");
        return;
      }
      setFullName(currentUser.name || "");
      setEmail(currentUser.email || currentUser.phone || "");
      setCurrentUserId(currentUser.id);

      const tempSchool = Util.getCurrentSchool();
      if (tempSchool) {
        setsetcurrentSchoolDetail({ id: tempSchool.id, name: tempSchool.name });

        // Fetch classes for the current school
        const classes = await api.getClassesForSchool(
          tempSchool.id,
          currentUser.id
        );
        const classMap = classes.map((classItem: any) => ({
          id: classItem.id,
          name: classItem.name,
        }));
        setClassData(classMap);
        const tempClass = Util.getCurrentClass();
        if (!tempClass) {
          return;
        }
        setCurrentClassId(tempClass.id);
        setcurrentClassDetail({
          id: tempClass.id,
          name: tempClass.name,
        });
        const classCode = await getClassCodeById(tempClass?.id!);
        setClassCode(classCode);
      }

      const allSchools = await api.getSchoolsForUser(currentUser.id);
      if (allSchools && allSchools.length > 0) {
        const schoolMap = allSchools.map(({ school }: any) => ({
          id: school.id,
          name: school.name,
        }));
        setSchoolData(schoolMap);

        const roles = allSchools.map(({ school, role }: any) => ({
          schoolId: school.id,
          role,
        }));
        setSchoolRoles(roles);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const switchUser = async () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };
  const getClassCodeById = async (class_id: string) => {
    if (class_id) {
      const classCode = await api.getClassCodeById(class_id);
      return classCode;
    }
    return;
  };

  const handleSchoolSelect = async ({
    id,
    name,
  }: { id?: string | number; name?: string } = {}) => {
    try {
      if (!id) {
        console.warn("Invalid ID or no ID provided for school selection");
        return;
      }
      const school = await api.getSchoolById(String(id));
      if (!school?.id) {
        console.warn("School not found");
        return;
      }
      const schoolRole = schoolRoles.find((item) => item.schoolId === id)?.role;
      if (!schoolRole) {
        return;
      }
      Util.setCurrentSchool(school, schoolRole);

      setsetcurrentSchoolDetail({
        id: school.id,
        name: name || school.name,
      });

      const classes = await api.getClassesForSchool(school.id, currentUserId);
      if (!classes || classes.length === 0) {
        console.warn("No classes found for the selected school");
        Util.setCurrentClass(null);
        setCurrentClassId("");
        setcurrentClassDetail({ id: "", name: "" });
        setClassCode(undefined);
        setClassData([]);
        Util.dispatchClassOrSchoolChangeEvent();
        return;
      }
      const firstClass = classes[0];
      Util.setCurrentClass(firstClass);
      const classMap = classes.map((classItem: any) => ({
        id: classItem.id,
        name: classItem.name,
      }));
      setClassData(classMap);
      // Auto-select the first class if available
      setCurrentClassId(firstClass.id);
      setcurrentClassDetail({
        id: firstClass.id,
        name: firstClass.name,
      });
      const classCode = await getClassCodeById(firstClass.id);
      setClassCode(classCode);
      Util.dispatchClassOrSchoolChangeEvent();
    } catch (error) {
      console.error("Error handling school selection:", error);
    }
  };

  const handleClassSelect = async ({
    id,
    name,
  }: { id?: string | number; name?: string } = {}) => {
    try {
      if (!id || id === currentClassId) {
        console.warn("Invalid ID or duplicate selection");
        return;
      }

      const currentClass = await api.getClassById(String(id));
      if (!currentClass?.id) {
        console.warn("Class not found");
        return;
      }
      Util.setCurrentClass(currentClass);
      setCurrentClassId(currentClass.id);
      setcurrentClassDetail({
        id: currentClass.id,
        name: name || currentClass.name,
      });

      const classCode = await getClassCodeById(currentClass.id);
      setClassCode(classCode);
      Util.dispatchClassOrSchoolChangeEvent();
    } catch (error) {
      console.error("Error handling class selection:", error);
    }
  };

  const [showDialogBox, setShowDialogBox] = useState(false);

  const onSignOut = async () => {
    const auth = ServiceConfig.getI().authHandler;
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();
    localStorage.removeItem(CURRENT_USER);
    localStorage.removeItem(CURRENT_MODE);
    history.replace(PAGES.APP_LANG_SELECTION);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };

  return (
    <>
      <IonMenu
        aria-label={String(t("Menu"))}
        contentId="main-content"
        id="main-container"
      >
        <div aria-label={String(t("Menu"))} className="side-menu-container">
          <ProfileSection fullName={fullName} email={email} />
          <div className="side-menu-body">
            <SchoolSection
              schoolData={schoolData}
              currentSchoolDetail={currentSchoolDetail}
              handleSchoolSelect={handleSchoolSelect}
              handleManageSchoolClick={handleManageSchoolClick}
            />
            <ClassSection
              classData={classData}
              currentClassDetail={currentClassDetail}
              currentClassId={currentClassId}
              classCode={classCode}
              handleClassSelect={handleClassSelect}
              handleManageClassClick={handleManageClassClick}
              setClassCode={setClassCode}
            />
          </div>
          <div className="side-menu-switch-user-toggle">
            <IonItem className="side-menu-ion-item-container">
              <PiUserSwitchFill className="side-menu-user-switch-icon" />
              <CommonToggle
                onChange={switchUser}
                label="Switch to Child's Mode"
              />
            </IonItem>
          </div>
          <div
            className="teacher-logout-btn"
            onClick={() => setShowDialogBox(true)}
          >
            {t("Logout")}
          </div>

          {/* Logout Confirmation Dialog */}
          <DialogBoxButtons
            width="100%"
            height="20%"
            message={t("Are you sure you want to logout?")}
            showDialogBox={showDialogBox}
            yesText={t("Cancel")}
            noText={t("Logout")}
            handleClose={() => setShowDialogBox(false)}
            onYesButtonClicked={() => setShowDialogBox(false)}
            onNoButtonClicked={onSignOut}
          />
        </div>
      </IonMenu>

      <div aria-label={String(t("Menu"))} id="main-content">
        <IonHeader aria-label={String(t("Menu"))}>
          <div aria-label={String(t("Menu"))}>
            <IonMenuButton
              aria-label={String(t("Menu"))}
              id="menu-button"
              slot="start"
            />
          </div>
        </IonHeader>
      </div>
    </>
  );
};

export default SideMenu;
