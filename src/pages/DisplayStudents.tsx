import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import ChimpleLogo from "../components/ChimpleLogo";
import "./DisplayStudents.css";
import Loading from "../components/Loading";
import User from "../models/user";
import {
  AVATARS,
  MAX_STUDENTS_ALLOWED,
  PAGES,
  MODES,
  CONTINUE,
  TableTypes,
  CURRENT_CLASS,
} from "../common/constants";
import { IoAddCircleSharp } from "react-icons/io5";
import { useHistory } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";
import { Util } from "../utility/util";
import ParentalLock from "../components/parent/ParentalLock";
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
import { schoolUtil } from "../utility/schoolUtil";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import SkeltonLoading from "../components/SkeltonLoading";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { updateLocalAttributes, useGbContext } from "../growthbook/Growthbook";
const DisplayStudents: FC<{}> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<TableTypes<"user">[]>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const { setGbUpdated } = useGbContext();
  useEffect(() => {
    const body = document.querySelector("body");
    body?.style.setProperty(
      "background-image",
      "url(/pathwayAssets/pathwayBackground.svg)"
    );
    getStudents();
    lockOrientation();
    return () => {
      setIsLoading(false);
    };
  }, []);
  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "landscape" });
    }
  };
  const getStudents = async () => {
    const currMode = await schoolUtil.getCurrMode();
    setStudentMode(currMode);
    const tempStudents =
      await ServiceConfig.getI().apiHandler.getParentStudentProfiles();

    if (!tempStudents || tempStudents.length < 1) {
      history.replace(PAGES.CREATE_STUDENT, {
        showBackButton: false,
      });
      return;
    }
    updateLocalAttributes({ count_of_children: tempStudents.length });
    setGbUpdated(true);
    setStudents(tempStudents);
    setIsLoading(false);

    // const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    // if (!currentUser) {
    //   return;
    // }

    // await FirebaseAnalytics.setUserId({
    //   userId: currentUser.id,
    // });

    // Util.setUserProperties(currentUser);

    // setStudents([students[0]]);

    // setStudents([...students, students[0]]);

    // const currentUser = await FirebaseAuth.getInstance().getCurrentUser();
    // const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    //  const iseTeacher = await FirebaseApi.getInstance().isUserTeacher(
    //   currentUser!
    // );
    //  if (!currentUser) return;
    // const iseTeacher = await ServiceConfig.getI().apiHandler.isUserTeacher(
    //   currentUser
    // );
  };
  const onStudentClick = async (student: TableTypes<"user">) => {
    await Util.setCurrentStudent(student, undefined, true);
    const linkedData = await api.getStudentClassesAndSchools(student.id);
    if (linkedData.classes && linkedData.classes.length > 0) {
      const firstClass = linkedData.classes[0];
      const currClass = await api.getClassById(firstClass.id);
      await schoolUtil.setCurrentClass(currClass ?? undefined);
    } else {
      console.warn("No classes found for the student.");
      await schoolUtil.setCurrentClass(undefined);
    }
    if (
      !student.curriculum_id ||
      !student.language_id
      //  ||
      // !student.grade_id ||
      // !student.courses
    ) {
      history.replace(PAGES.EDIT_STUDENT, {
        from: history.location.pathname,
      });
    } else {
      // Util.setPathToBackButton(PAGES.HOME + history.location.search, history);
      history.replace(PAGES.HOME + window.location.search);
    }
  };
  const onCreateNewStudent = () => {
    if (!online) {
      presentToast({
        message: t(`Device is offline. Cannot create a new child profile`),
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [
          {
            text: "Dismiss",
            role: "cancel",
          },
        ],
      });

      return;
    }
    const isProfilesExist = students && students.length > 0;
    const locationState = isProfilesExist
      ? { showBackButton: true }
      : undefined;
    history.replace(PAGES.CREATE_STUDENT, locationState);
  };
  return (
    <IonPage id="display-students">
      {/* <IonContent> */}
      <div id="display-students-chimple-logo">
        <div id="display-students-parent-icon"></div>
        <ChimpleLogo
          header={t("Welcome to Chimple!")}
          msg={[
            t("Select the child’s profile"),
            // t("where curiosity meets education!"),
          ]}
        />
        <button
          id="display-students-parent-button"
          onClick={() => {
            // history.replace(PAGES.PARENT);
            setShowDialogBox(true);
          }}
        >
          {t("Parent")}
          <img id="parent-icon" src={"assets/icons/user.png"} alt="" />
        </button>
      </div>
      {!isLoading && students && (
        <div className="display-student-content">
          <div className="avatar-container">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => onStudentClick(student)}
                className="display-students-avatar"
              >
                <img
                  className="avatar-img"
                  src={
                    (studentMode === MODES.SCHOOL && student.image) ||
                    "assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"
                  }
                  alt=""
                />
                {student.name && (
                  <span className="display-student-name-profile">Profile:</span>
                )}
                {student.name && (
                  <span className="display-student-name">{student?.name}</span>
                )}
              </div>
            ))}
          </div>
          {/* {students.length < MAX_STUDENTS_ALLOWED && (
            <div className="add-new-button">
              <IoAddCircleSharp
                color="white"
                size="10vh"
                onClick={onCreateNewStudent}
              />
              {t("Create a New Child Profile")}
            </div>
          )} */}
          {showDialogBox ? (
            <ParentalLock
              showDialogBox={showDialogBox}
              handleClose={() => {
                setShowDialogBox(true);
              }}
              onHandleClose={() => {
                setShowDialogBox(false);
              }}
            ></ParentalLock>
          ) : null}
        </div>
      )}
      <SkeltonLoading isLoading={isLoading} header={PAGES.DISPLAY_STUDENT} />
      {/* </IonContent> */}
    </IonPage>
  );
};
export default DisplayStudents;
