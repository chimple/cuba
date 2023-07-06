import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import Loading from "../components/Loading";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import {
  AVATARS,
  CURRENT_CLASS,
  CURRENT_MODE,
  CURRENT_SCHOOL,
  MODES,
  PAGES,
} from "../common/constants";
import SelectModeButton from "../components/selectMode/SelectModeButton";
import { IoMdPeople } from "react-icons/io";
import { GiTeacher } from "react-icons/gi";
import { t } from "i18next";
import "./SelectMode.css";
import RectangularOutlineDropDown from "../components/parent/RectangularOutlineDropDown";
import BackButton from "../components/common/BackButton";
import Class from "../models/class";
import User from "../models/user";
import School from "../models/school";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";

const SelectMode: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  enum STAGES {
    MODE,
    SCHOOL,
    CLASS,
    STUDENT,
  }
  const [schoolList, setSchoolList] = useState<
    {
      id: string;
      displayName: string;
      school: School;
    }[]
  >([]);
  const [currentSchoolName, setCurrentSchoolName] = useState<string>();
  const [currentSchool, setCurrentSchool] = useState<any>();
  const [currentSchoolId, setCurrentSchoolId] = useState<string>();
  const [currentUser, setCurrentUser] = useState<any>();
  const [currentClasses, setCurrentClasses] = useState<Class[]>();
  const [currentStudents, setCurrentStudents] = useState<User[]>();
  const [currStudent, setCurrStudent] = useState<User>();
  const [currClass, setCurrClass] = useState<any>();
  let count = 1;
  const tempSchoolList: {
    id: string;
    displayName: string;
    school: School;
  }[] = [];
  useEffect(() => {
    init();
  }, []);
  // const api = FirebaseApi.getInstance();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();

  const [stage, setStage] = useState(STAGES.MODE);
  const init = async () => {
    setIsLoading(true);
    const currUser = await auth.getCurrentUser();
    if (!currUser) return;
    const allSchool = await api.getSchoolsForUser(currUser);

    // const isTeacher = await api.isUserTeacher(currUser);
    // console.log("This is the current status of teacher " + isTeacher);
    if (!allSchool || allSchool.length < 1) {
      api.currentMode = MODES.PARENT;
      schoolUtil.setCurrMode(MODES.PARENT);
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    } else {
      setIsLoading(false);
    }
    // if (!currentUser) {
    //   history.push(PAGES.DISPLAY_STUDENT);
    //   return;
    // }

    console.log("allSchool", allSchool);
    for (let i = 0; i < allSchool.length; i++) {
      const element = allSchool[i];
      tempSchoolList.push({
        id: element.docId,
        displayName: element.name,
        school: allSchool[i],
      });
    }

    setCurrentUser(currUser);
    setSchoolList(tempSchoolList);
  };

  const onParentSelect = () => {
    api.currentMode = MODES.PARENT;
    history.replace(PAGES.DISPLAY_STUDENT);
    schoolUtil.setCurrMode(MODES.PARENT);
    // setStage(STAGES.MODE);
  };

  const onTeacherSelect = () => {
    api.currentMode = MODES.SCHOOL;
    // history.replace(PAGES.SELECT_SCHOOL);
    // localStorage.setItem(CURRENT_MODE,JSON.stringify(MODES.SCHOOL));
    schoolUtil.setCurrMode(MODES.SCHOOL);
    setStage(STAGES.SCHOOL);
  };
  const displayClasses = async () => {
    const element = await api.getClassesForSchool(currentSchool, currentUser);
    console.log("this are the classes " + element);
    setCurrentClasses(element);

    return;
  };
  const displayStudents = async (curClass) => {
    // if(!currClass) return;
    const element = await api.getStudentsForClass(curClass.docId);
    console.log("THis are the students " + element);
    if (!element) return;
    setCurrentStudents(element);

    return;
  };
  const onStudentClick = async (student: User) => {
    console.log(
      "🚀 ~ file: DisplayStudents.tsx:30 ~ onStudentClick:student",
      student
    );
    await Util.setCurrentStudent(student);
    history.replace(PAGES.HOME);
  };
  function randomValue() {
    let random = Math.floor(Math.random() * 37);
    console.log("This is the random generated value  " + random);
    return random;
  }

  return (
    <IonPage>
      {!isLoading && (
        <div>
          <div>
            {stage === STAGES.MODE && (
              <div className="select-mode-main">
                <span className="select-mode-text">
                  {t("How do you want to join as?")}
                </span>

                <SelectModeButton
                  text={t("Parent")}
                  icon={IoMdPeople}
                  onClick={onParentSelect}
                />

                <SelectModeButton
                  text={t("Teacher")}
                  icon={GiTeacher}
                  onClick={onTeacherSelect}
                />
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.SCHOOL && (
              <div className="select-school-main">
                <span className="select-school-text">
                  {t("Choose the School")}
                </span>
                <RectangularOutlineDropDown
                  placeholder={t("Select School").toString()}
                  onValueChange={async (selectedSchoolDocId) => {
                    const currSchool = schoolList.find(
                      (element) => element.id === selectedSchoolDocId
                    )?.school;

                    if (!currSchool) return;
                    console.log(currSchool);
                    setCurrentSchool(currSchool);
                    setCurrentSchoolName(currSchool.name);
                    setCurrentSchoolId(currSchool.docId);

                    schoolUtil.setCurrentSchool(currSchool);
                  }}
                  optionList={schoolList}
                  width="26vw"
                  currentValue={currentSchoolId}
                />
                <button
                  className={"okay-btn"}
                  onClick={async function () {
                    // history.replace(PAGES.SELECT_CLASS);
                    await displayClasses();

                    setStage(STAGES.CLASS);

                    return;
                  }}
                >
                  {t("Okay")}
                </button>
              </div>
            )}
          </div>

          <div>
            {stage === STAGES.CLASS && (
              <div className="class-main">
                <div className="class-header">
                  <BackButton
                    onClicked={() => {
                      //  history.replace(PAGES.SELECT_SCHOOL);
                      setStage(STAGES.SCHOOL);
                    }}
                  />

                  <div className="schoolname-header">{currentSchoolName}</div>
                  <div className="right-button"></div>
                </div>

                <div className="class-container">
                  {currentClasses?.map((tempClass) => (
                    <div
                      key={tempClass.docId}
                      onClick={async () => {
                        if (!tempClass) return;
                        // localStorage.setItem(CURRENT_CLASS,JSON.stringify(tempClass));
                        schoolUtil.setCurrentClass(tempClass);
                        console.log("This is the selected class " + tempClass);
                        setCurrClass(tempClass);

                        await displayStudents(tempClass);
                        setStage(STAGES.STUDENT);
                      }}
                      className="class-avatar"
                    >
                      <div className="class-avatar-counter">{count++}</div>
                      <span className="class-name">{tempClass.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="class-main">
            {stage === STAGES.STUDENT && (
              <div>
                <div className="class-header">
                  <BackButton
                    onClicked={() => {
                      //  history.replace(PAGES.SELECT_SCHOOL);
                      setStage(STAGES.CLASS);
                    }}
                  />

                  <div className="schoolClassname-header">
                    {currentSchoolName + ", " + currClass?.name}
                  </div>
                  <div className="right-button"></div>
                </div>

                <div className="class-container">
                  {currentStudents?.map((tempStudent) => (
                    <div
                      key={tempStudent.docId}
                      onClick={() => {
                        setCurrStudent(tempStudent);
                        // setStage(STAGES.STUDENT);
                        onStudentClick(tempStudent);
                        // Util.setCurrentStudent(tempStudent);
                        console.log(
                          "This is the selected student " + tempStudent.name
                        );
                      }}
                      className="class-avatar"
                    >
                      {!!tempStudent.image ? (
                        <img
                          className="class-avatar-img"
                          src={tempStudent.image}
                          alt=""
                        />
                      ) : (
                        <img
                          className="class-avatar-img"
                          src={
                            "assets/avatars/" +
                            (tempStudent.avatar ?? AVATARS[randomValue()]) +
                            ".png"
                          }
                          alt=""
                        />
                      )}
                      <span className="class-name">{tempStudent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default SelectMode;
