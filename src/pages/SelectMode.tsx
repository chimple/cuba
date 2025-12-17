import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import Loading from "../components/Loading";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import { RoleType } from "../interface/modelInterfaces";
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
  USER_SELECTION_STAGE,
  STAGES,
  CURRENT_CLASS,
  CURRENT_SCHOOL,
  IS_OPS_USER,
  USER_DATA,
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
  useEffect(() => {
    if (currClass && stage === STAGES.STUDENT) {
      displayStudents(currClass);
    }
  }, [currClass, stage]);
  const init = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const setTab = urlParams.get("tab");
    const currentMode = await schoolUtil.getCurrMode();
    if (setTab) {
      if (setTab === STAGES.STUDENT) {
        setStage(STAGES.STUDENT);
        const className = localStorage.getItem(CURRENT_CLASS_NAME);
        if (className) {
          const parsedClass = JSON.parse(className);
          setCurrClass(parsedClass);
          await displayStudents(parsedClass);
        }
      } else if (setTab === STAGES.CLASS) {
        setStage(STAGES.CLASS);
      }
    }
    const selectedClasses = localStorage.getItem(SELECTED_CLASSES);
    if (selectedClasses) {
      setCurrentClasses(JSON.parse(selectedClasses));
    }
    const displayStudent = localStorage.getItem(SELECTED_STUDENTS);
    if (displayStudent) {
      setCurrentStudents(JSON.parse(displayStudent));
    }

    if (currentMode == MODES.PARENT) {
      const student = Util.getCurrentStudent();
      if (student) {
        history.replace(PAGES.HOME);
        return;
      }
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    } else if (currentMode == MODES.SCHOOL) {
      const schoolName = localStorage.getItem(CURRENT_SCHOOL_NAME);
      if (schoolName) setCurrentSchoolName(JSON.parse(schoolName));
      const className = localStorage.getItem(CURRENT_CLASS_NAME);
      if (className) setCurrClass(JSON.parse(className));
      if (schoolName && className) {
        const selectedUser = localStorage.getItem(USER_SELECTION_STAGE);
        if (selectedUser) {
          const parsedClass = JSON.parse(className);
          setCurrClass(parsedClass);
          setStage(STAGES.STUDENT);
        } else {
          setStage(STAGES.CLASS);
        }
      } else {
        setStage(STAGES.MODE);
      }
    } else if (currentMode === MODES.TEACHER) {
      return history.replace(PAGES.DISPLAY_SCHOOLS);
    } else if (currentMode === MODES.OPS_CONSOLE) {
      history.replace(PAGES.SIDEBAR_PAGE);
      return;
    }

    const currUser = await auth.getCurrentUser();
    if (!currUser) return;
    localStorage.setItem(USER_DATA, JSON.stringify(currUser));
    const allSchool = await api.getSchoolsForUser(currUser.id);
    // Extract school IDs from schoolList
    const schoolIds = allSchool.map((school) => school.school.id);
    const filteredSchools = await api.getSchoolsWithRoleAutouser(schoolIds);
    const filteredSchoolIds = filteredSchools?.map((school) => school.id) || [];
    // Filter allSchool to include only schools that are in filteredSchools
    const matchedSchools = allSchool.filter((entry) =>
      filteredSchoolIds.includes(entry.school.id)
    );

    const isOpsUser = localStorage.getItem(IS_OPS_USER) === "true";
    // If user is ops or program user
    if (isOpsUser) {
      schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
      history.replace(PAGES.SIDEBAR_PAGE);
      return;
    } else {
      const students = await api.getParentStudentProfiles();

      if (!allSchool || allSchool.length < 1) {
        api.currentMode = MODES.PARENT;
        schoolUtil.setCurrMode(MODES.PARENT);
        if (!!students && students.length == 0) {
          history.replace(PAGES.CREATE_STUDENT);
        } else history.replace(PAGES.DISPLAY_STUDENT);
        return;
      } else {
        setIsLoading(false);
      }
      for (let i = 0; i < matchedSchools.length; i++) {
        const element = matchedSchools[i];
        tempSchoolList.push({
          id: element.school.id,
          displayName: element.school.name,
          school: element.school,
        });
      }
      setCurrentUser(currUser);
      setSchoolList(tempSchoolList);
      if (matchedSchools.length > 0) {
        const selectedUser = localStorage.getItem(USER_SELECTION_STAGE);
        if (tempSchoolList.length === 1) {
          setCurrentSchool(tempSchoolList[0].school);
          await displayClasses(tempSchoolList[0].school, currUser);
          if (selectedUser) {
            setStage(STAGES.STUDENT);
          } else {
            setStage(STAGES.CLASS);
          }
        } else {
          if (selectedUser) {
            setStage(STAGES.STUDENT);
          } else {
            setStage(STAGES.SCHOOL);
          }
        }
      } else if (allSchool.length === 0) {
        onParentSelect();
      }
    }

    setIsLoading(false);
  };

  async function changeLanguage() {
    const languageDocId = localStorage.getItem(LANGUAGE);
    if (!!languageDocId) await i18n.changeLanguage(languageDocId);
  }
  const onSchoolSelect = async () => {
    history.replace(PAGES.DISPLAY_SCHOOLS);
  };
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

  const displayClasses = async (
    school?: TableTypes<"school">,
    user?: TableTypes<"user">
  ) => {
    const activeSchool = currentSchool ?? school;
    const activeUser = currentUser ?? user;
    if (!activeSchool || !activeUser) {
      return;
    }
    try {
      const element = await api.getClassesForSchool(
        activeSchool.id,
        activeUser.id
      );
      if (!element || element.length === 0) {
        return;
      }
      setCurrentClasses(element);
      localStorage.setItem(SELECTED_CLASSES, JSON.stringify(element));
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };
  const displayStudents = async (curClass) => {
    // if(!currClass) return;
    const element = await api.getStudentsForClass(curClass.id);
    if (!element) return;
    setCurrentStudents(element);
    // localStorage.setItem(SELECTED_STUDENTS, JSON.stringify(element));
    return;
  };
  const onStudentClick = async (student: TableTypes<"user">) => {
    await Util.setCurrentStudent(student, undefined, true);
    history.replace(PAGES.HOME);
  };
  function randomValue() {
    let random = Math.floor(Math.random() * 37);
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
                  <div></div>
                  {/* <BackButton
                    aria-label={t("Back")}
                    onClicked={() => {
                      //  history.replace(PAGES.SELECT_SCHOOL);
                      localStorage.removeItem(SELECTED_CLASSES);
                      localStorage.removeItem(CURRENT_SCHOOL);
                      localStorage.removeItem(CURRENT_SCHOOL_NAME);
                      setStage(STAGES.SCHOOL);
                    }}
                  /> */}

                  <div className="selectmode-schoolname-header">
                    {currentSchool?.name}
                  </div>
                  <div></div>
                </div>

                <div className="class-container">
                  {currentClasses?.map((tempClass) => (
                    <div
                      key={tempClass.id}
                      onClick={async () => {
                        if (!tempClass) return;
                        // localStorage.setItem(CURRENT_CLASS,JSON.stringify(tempClass));
                        schoolUtil.setCurrentClass(tempClass);
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
                      <div className="class-avatar-counter">
                        {tempClass.name}
                      </div>
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
                  <div id="back-button-in-school-Header">
                    <img
                      src="/assets/icons/BackButtonIcon.svg"
                      alt="BackButtonIcon"
                      onClick={() => {
                        //  history.replace(PAGES.SELECT_SCHOOL);
                        localStorage.removeItem(SELECTED_STUDENTS);
                        localStorage.removeItem(CURRENT_CLASS);
                        localStorage.removeItem(CURRENT_CLASS_NAME);
                        localStorage.removeItem(USER_SELECTION_STAGE);
                        setStage(STAGES.CLASS);
                      }}
                    />
                  </div>

                  <div className="selectmode-schoolClassname-header">
                    {currentSchool?.name + ", " + currClass?.name}
                  </div>
                  <div></div>
                </div>

                <div className="class-container">
                  {currentStudents?.map((tempStudent) => (
                    <div
                      key={tempStudent.id}
                      onClick={() => {
                        setCurrStudent(tempStudent);
                        // setStage(STAGES.STUDENT);
                        localStorage.setItem(USER_SELECTION_STAGE, "true");
                        onStudentClick(tempStudent);
                        // Util.setCurrentStudent(tempStudent);
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
