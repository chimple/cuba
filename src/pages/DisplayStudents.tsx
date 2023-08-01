import { IonContent, IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import ChimpleLogo from "../components/ChimpleLogo";
import "./DisplayStudents.css";
import Loading from "../components/Loading";
import User from "../models/user";
import { AVATARS, MAX_STUDENTS_ALLOWED, PAGES } from "../common/constants";
import { IoAddCircleSharp } from "react-icons/io5";
import { useHistory } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";
import { Util } from "../utility/util";
import ParentalLock from "../components/parent/ParentalLock";
// import { FirebaseApi } from "../services/api/FirebaseApi";
// import { FirebaseAuth } from "../services/auth/FirebaseAuth";

const DisplayStudents: FC<{}> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<User[]>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const history = useHistory();

  useEffect(() => {
    getStudents();
  }, []);
  const getStudents = async () => {
    const students =
      await ServiceConfig.getI().apiHandler.getParentStudentProfiles();
    console.log(
      "🚀 ~ file: DisplayStudents.tsx:13 ~ getStudents ~ students:",
      students
    );

    if (!students || students.length < 1) {
      history.replace(PAGES.CREATE_STUDENT, {
        showBackButton: true,
      });
    }
    setStudents(students);

    // if (students && students.length > 0) {
    //   history.replace(PAGES.DISPLAY_STUDENT, {
    //     showBackButton: true,
    //   });
    // } else {
    //   history.replace(PAGES.CREATE_STUDENT, {
    //     showBackButton: false,
    //   });
    // }
    // setStudents(students);
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
    await Util.setCurrentStudent(student, undefined, false);

    if (!student.board || !student.language || !student.grade) {
      history.push(PAGES.EDIT_STUDENT, {
        from: history.location.pathname,
      });
    } else {
      history.replace(PAGES.HOME);
    }
  };
  const onCreateNewStudent = () => {
    const isProfilesExist = students && students.length > 0;
    const locationState = isProfilesExist ? { showBackButton: true } : undefined;
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
                    "assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"
                  }
                  alt=""
                />
                <span className="student-name">{student.name}</span>
              </div>
            ))}
          </div>
          {students.length < MAX_STUDENTS_ALLOWED && (
            <div className="add-new-button">
              <IoAddCircleSharp
                color="white"
                size="10vh"
                onClick={onCreateNewStudent}
              />
              {t("Create New Child Profile")}
            </div>
          )}
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
      <Loading isLoading={isLoading} />
      {/* </IonContent> */}
    </IonPage>
  );
};
export default DisplayStudents;
