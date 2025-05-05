import { FC, useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  CLASS,
  CURRENT_SCHOOL,
  MODES,
  PAGES,
  SCHOOL,
  TableTypes,
  USER_ROLE,
} from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { RoleType } from "../../interface/modelInterfaces";
import { AppBar } from "@mui/material";
import { t } from "i18next";
import BackButton from "../../components/common/BackButton";
import "./DisplaySchools.css";
import Header from "../components/homePage/Header";
import { IonFabButton, IonIcon, IonPage } from "@ionic/react";
import { PiUserSwitchFill } from "react-icons/pi";
import CommonToggle from "../../common/CommonToggle";
import { schoolUtil } from "../../utility/schoolUtil";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import AddButton from "../../common/AddButton";
import { addOutline } from "ionicons/icons";

interface SchoolWithRole {
  school: TableTypes<"school">;
  role: RoleType;
}
const DisplaySchools: FC<{}> = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [schoolList, setSchoolList] = useState<SchoolWithRole[]>([]);
  const [user, setUser] = useState<TableTypes<"user">>();

  useEffect(() => {
    lockOrientation();
    initData();
  }, []);

  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "portrait" });
    }
  };
  const initData = async () => {
    const currentUser = await auth.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    const allSchool = await api.getSchoolsForUser(currentUser.id);
    setSchoolList(allSchool);
    const tempSchool = Util.getCurrentSchool();
    if (tempSchool) {
      const localSchool = allSchool.find(
        (school) => school.school.id === tempSchool.id
      );
      if (localSchool) {
        const selectedSchool: SchoolWithRole = {
          school: localSchool.school,
          role: localSchool.role,
        };
        selectSchool(selectedSchool);
      }
    } else if (allSchool.length === 1) {
      selectSchool(allSchool[0]);
    }
  };

  const getClasses = async (schoolId: string) => {
    const tempClasses = await api.getClassesForSchool(schoolId, user?.id!);
    console.log("classes..", tempClasses);
    if (tempClasses.length > 0) {
      return tempClasses;
    } else {
      return [];
    }
  };
  const switchUser = async () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };
  async function selectSchool(school: SchoolWithRole) {
    Util.setCurrentSchool(school.school, school.role);

    await Util.handleClassAndSubjects(
      school.school.id,
      user?.id!,
      history,
      PAGES.DISPLAY_SCHOOLS
    );

    const tempClass = Util.getCurrentClass();
    if (tempClass) {
      Util.setCurrentClass(tempClass);
      history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
    } else {
      const classes = await getClasses(school.school.id);
      if (classes.length > 0) {
        Util.setCurrentClass(classes[0]);
        history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
      }
    }
  }
  return (
    <IonPage className="display-page">
      <Header
        isBackButton={false}
        disableBackButton={true}
        customText="Select School"
      />
      <div className="display-user-switch-user-toggle">
        <div className="display-school-switch-text">
          <PiUserSwitchFill className="display-user-user-switch-icon" />
          <CommonToggle onChange={switchUser} label="Switch to Child's Mode" />
        </div>
      </div>
      <hr className="display-school-horizontal-line" />
      {schoolList.length === 0 ? (
        <div className="no-schools-container">
          <div className="create-school-button">
            <IonFabButton
              onClick={() => {
                history.replace(PAGES.REQ_ADD_SCHOOL, {
                  origin: PAGES.DISPLAY_SCHOOLS,
                });
              }}
            >
              <IonIcon icon={addOutline} />
            </IonFabButton>
            <div className="create-new-school-text">
              {t("Create New School")}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="all-school-display-container">
            <div className="all-school-display">
              {schoolList.map((school) => (
                <div
                  key={school.school.id}
                  onClick={() => selectSchool(school)}
                >
                  <div className="display-school-single-school">
                    <div className="display-school-image">
                      <img
                        className="school-image-p"
                        src={school.school.image ?? "assets/icons/school.png"}
                      ></img>
                    </div>
                    <div className="display-school-name">
                      {school.school.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* comment out the plus icon */}
      {/* {schoolList.length > 0 && (
        <AddButton
          onClick={() => {
            history.replace(PAGES.ADD_SCHOOL, {
              origin: PAGES.DISPLAY_SCHOOLS,
            });
          }}
        />
      )} */}
    </IonPage>
  );
};

export default DisplaySchools;
