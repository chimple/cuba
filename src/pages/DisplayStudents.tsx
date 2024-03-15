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
// import { FirebaseApi } from "../services/api/FirebaseApi";
// import { FirebaseAuth } from "../services/auth/FirebaseAuth";

const DisplayStudents: FC<{}> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<User[]>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  useEffect(() => {
    getStudents();
    return () => {
      setIsLoading(false);
    };
  }, []);
  const getStudents = async () => {
    const currMode = await schoolUtil.getCurrMode();
    setStudentMode(currMode);
    const students =
      await ServiceConfig.getI().apiHandler.getParentStudentProfiles();
    console.log(
      "🚀 ~ file: DisplayStudents.tsx:13 ~ getStudents ~ students:",
      students
    );

    if (!students || students.length < 1) {
      history.replace(PAGES.CREATE_STUDENT, {
        showBackButton: false,
      });
      return;
    }
    setStudents(students);

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) {
      return;
    }

    await FirebaseAnalytics.setUserId({
      userId: currentUser.docId,
    });

    Util.setUserProperties(currentUser);

    // setStudents([students[0]]);

    // setStudents([...students, students[0]]);

    // const currentUser = await FirebaseAuth.getInstance().getCurrentUser();
    // const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    // console.log(
    //   "🚀 ~ file: DisplayStudents.tsx:35 ~ getStudents ~ FirebaseAuth.getInstance().currentUser:",
    //   currentUser
    // );
    // // const iseTeacher = await FirebaseApi.getInstance().isUserTeacher(
    //   currentUser!
    // );
    //  if (!currentUser) return;
    // const iseTeacher = await ServiceConfig.getI().apiHandler.isUserTeacher(
    //   currentUser
    // );
    // console.log(
    //   "🚀 ~ file: DisplayStudents.tsx:34 ~ getStudents ~ iseTeacher:",
    //   iseTeacher
    // );

    setIsLoading(false);
  };
  const onStudentClick = async (student: User) => {
    console.log(
      "🚀 ~ file: DisplayStudents.tsx:30 ~ onStudentClick:student",
      student
    );
    await Util.setCurrentStudent(student, undefined, true);

    if (
      !student.board ||
      !student.language ||
      !student.grade ||
      !student.courses
    ) {
      history.replace(PAGES.EDIT_STUDENT, {
        from: history.location.pathname,
      });
    } else {
      Util.setPathToBackButton(PAGES.HOME, history);
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
                key={student.docId}
                onClick={() => onStudentClick(student)}
                className="avatar"
              >
                <img
                  className="avatar-img"
                  src={
                    (studentMode === MODES.SCHOOL && student.image) ||
                    "assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"
                  }
                  alt=""
                />
                <span className="student-name">{student.name}</span>
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
                console.log("Close", false);
              }}
              onHandleClose={() => {
                setShowDialogBox(false);
                console.log("Close", false);
              }}
            ></ParentalLock>
          ) : null}
        </div>
      )}
      <SkeltonLoading isLoading={isLoading} header={PAGES.DISPLAY_STUDENT}/>
      {/* </IonContent> */}
    </IonPage>
  );
};
export default DisplayStudents;
