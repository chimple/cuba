import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import Loading from "../components/Loading";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import {
  LANGUAGE,
  AVATARS,
  MODES,
  PAGES,
  TableTypes,
  SELECTED_CLASSES,
  SELECTED_STUDENTS,
  CURRENT_MODE,
  CURRENT_SCHOOL_NAME,
  CURRENT_CLASS_NAME,
} from "../common/constants";
import SelectModeButton from "../components/selectMode/SelectModeButton";
import { IoMdPeople } from "react-icons/io";
import { GiTeacher } from "react-icons/gi";
import { t } from "i18next";
import "./SelectMode.css";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import i18n from "../i18n";
import DropDown from "../components/DropDown";

const SelectMode: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  enum STAGES {
    MODE = "mode",
    SCHOOL = "school",
    CLASS = "class",
    STUDENT = "student",
  }
  const [schoolList, setSchoolList] = useState<
    {
      id: string;
      displayName: string;
      school: TableTypes<"school">;
    }[]
  >([]);
  const [currentSchoolName, setCurrentSchoolName] = useState<string>();
  const [currentSchool, setCurrentSchool] = useState<TableTypes<"school">>();
  const [currentSchoolId, setCurrentSchoolId] = useState<string>();
  const [currentUser, setCurrentUser] = useState<TableTypes<"user">>();
  const [currentClasses, setCurrentClasses] = useState<TableTypes<"class">[]>();
  const [currentStudents, setCurrentStudents] =
    useState<TableTypes<"user">[]>();
  const [currStudent, setCurrStudent] = useState<TableTypes<"user">>();
  const [currClass, setCurrClass] = useState<TableTypes<"class">>();
  let count = 1;
  const tempSchoolList: {
    id: string;
    displayName: string;
    school: TableTypes<"school">;
  }[] = [];
  useEffect(() => {
    init();
    changeLanguage();
    return () => {
      setIsLoading(false);
    };
  }, []);
  // const api = FirebaseApi.getInstance();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const history = useHistory();

  const [stage, setStage] = useState(STAGES.MODE);
  const [isOkayButtonDisabled, setIsOkayButtonDisabled] = useState(true);
  const init = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const setTab = urlParams.get("tab");

    if (setTab) {
      if (setTab === STAGES.STUDENT) {
        setStage(STAGES.STUDENT);
      }
    }
    const displayClasses = localStorage.getItem(SELECTED_CLASSES);
    if (displayClasses) {
      setCurrentClasses(JSON.parse(displayClasses));
    }
    const displayStudent = localStorage.getItem(SELECTED_STUDENTS);
    if (displayStudent) {
      setCurrentStudents(JSON.parse(displayStudent));
    }

    const currentMode = localStorage.getItem(CURRENT_MODE);
    if (currentMode == MODES.PARENT) {
      schoolUtil.setCurrMode(MODES.PARENT);
      const student = Util.getCurrentStudent();
      if (student) {
        history.replace(PAGES.HOME);
        return;
      }
      history.replace(PAGES.DISPLAY_STUDENT);
    } else if (currentMode == MODES.SCHOOL) {
      const schoolName = localStorage.getItem(CURRENT_SCHOOL_NAME);
      if (schoolName) setCurrentSchoolName(JSON.parse(schoolName));
      const className = localStorage.getItem(CURRENT_CLASS_NAME);
      if (className) setCurrClass(JSON.parse(className));
      if (schoolName && className) {
        setStage(STAGES.STUDENT);
      } else {
        setStage(STAGES.MODE);
      }
    }
    const currUser = await auth.getCurrentUser();
    if (!currUser) return;
    console.log("Testing currUser", currUser.id);
    const allSchool = await api.getSchoolsForUser(currUser.id);
    // const allSchool = [];
    console.log("🚀 ~ init ~ allSchool:", allSchool);
    const students = await api.getParentStudentProfiles();
    console.log("🚀 ~ init ~ students:", students);
    // const isTeacher = await api.isUserTeacher(currUser);
    // console.log("This is the current status of teacher " + isTeacher);
    if (!allSchool || allSchool.length < 1) {
      api.currentMode = MODES.PARENT;
      schoolUtil.setCurrMode(MODES.PARENT);
      console.log(students);
      if (!!students && students.length == 0) {
        history.replace(PAGES.CREATE_STUDENT);
      } else history.replace(PAGES.DISPLAY_STUDENT);
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
        id: element.school.id,
        displayName: element.school.name,
        school: element.school,
      });
    }

    setCurrentUser(currUser);
    setSchoolList(tempSchoolList);
  };
  async function changeLanguage() {
    const languageDocId = localStorage.getItem(LANGUAGE);
    console.log("This is the lang " + languageDocId);
    if (!!languageDocId) await i18n.changeLanguage(languageDocId);
  }
  const onParentSelect = async () => {
    api.currentMode = MODES.PARENT;
    const students = await api.getParentStudentProfiles();
    if (!!students && students.length == 0) {
      history.replace(PAGES.CREATE_STUDENT);
    } else history.replace(PAGES.DISPLAY_STUDENT);
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
    if (!currentSchool || !currentUser) return;
    const element = await api.getClassesForSchool(
      currentSchool?.id ?? "",
      currentUser.id ?? ""
    );
    console.log("this are the classes " + element);
    setCurrentClasses(element);
    localStorage.setItem(SELECTED_CLASSES, JSON.stringify(element));

    return;
  };
  const displayStudents = async (curClass) => {
    // if(!currClass) return;
    const element = await api.getStudentsForClass(curClass.id);
    console.log("THis are the students " + element);
    if (!element) return;
    setCurrentStudents(element);
    localStorage.setItem(SELECTED_STUDENTS, JSON.stringify(element));
    return;
  };
  const onStudentClick = async (student: TableTypes<"user">) => {
    console.log(
      "🚀 ~ file: DisplayStudents.tsx:30 ~ onStudentClick:student",
      student
    );
    await Util.setCurrentStudent(student, undefined, true);
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
                  {t("How would you like to join?")}
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
                <DropDown
                  placeholder={t("Select the School").toString()}
                  onValueChange={async (selectedSchoolDocId) => {
                    const currSchool = schoolList.find(
                      (element) => element.id === selectedSchoolDocId
                    )?.school;

                    if (!currSchool) {
                      setIsOkayButtonDisabled(true);
                      return;
                    }
                    console.log(currSchool);
                    setCurrentSchool(currSchool);
                    localStorage.setItem(
                      CURRENT_SCHOOL_NAME,
                      JSON.stringify(currSchool.name)
                    );
                    setCurrentSchoolName(currSchool.name);
                    setCurrentSchoolId(currSchool.id);
                    setIsOkayButtonDisabled(false);
                    schoolUtil.setCurrentSchool(currSchool);
                  }}
                  optionList={schoolList}
                  width="26vw"
                  currentValue={currentSchoolId}
                />
                <button
                  className={`okay-btn ${
                    isOkayButtonDisabled ? "okay-btn-disabled" : ""
                  }`}
                  onClick={async function () {
                    // history.replace(PAGES.SELECT_CLASS);
                    await displayClasses();
                    setStage(STAGES.CLASS);
                    return;
                  }}
                  disabled={isOkayButtonDisabled}
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
                      key={tempClass.id}
                      onClick={async () => {
                        if (!tempClass) return;
                        // localStorage.setItem(CURRENT_CLASS,JSON.stringify(tempClass));
                        schoolUtil.setCurrentClass(tempClass);
                        console.log("This is the selected class " + tempClass);
                        setCurrClass(tempClass);
                        localStorage.setItem(
                          CURRENT_CLASS_NAME,
                          JSON.stringify(tempClass)
                        );
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
                      key={tempStudent.id}
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
