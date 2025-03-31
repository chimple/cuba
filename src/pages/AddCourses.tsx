import { FC, useEffect, useState } from "react";
import Course from "../models/course";
import { useHistory } from "react-router-dom";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  ACTION,
  // DISPLAY_SUBJECTS_STORE,
  EVENTS,
  HOMEHEADERLIST,
  MODES,
  PAGES,
  TableTypes,
} from "../common/constants";
import { IonPage } from "@ionic/react";
import "./DisplaySubjects.css";
import Loading from "../components/Loading";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import AddCourse from "../components/displaySubjects/AddCourse";
import NextButton from "../components/common/NextButton";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import { t } from "i18next";
import SkeltonLoading from "../components/SkeltonLoading";
import "./DisplayChapters.css";

const localData: any = {};
let localStorageData: any = {};
const AddCourses: React.FC = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<TableTypes<"course">[]>();
  const [reloadSubjects, setReloadSubjects] = useState<boolean>(false);
  const [selectedCourses, setSelectedCourses] =
    useState<TableTypes<"course">[]>();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const currentStudent = Util.getCurrentStudent();

  useEffect(() => {
    setIsLoading(true);
    init();
    getCourses();
  }, [reloadSubjects]);

  const init = async () => {
    await getCourses();
  };

  // function addDataToLocalStorage() {
  //   localStorage.setItem(
  //     DISPLAY_SUBJECTS_STORE,
  //     JSON.stringify(localStorageData)
  //   );
  // }

  const getCourses = async (): Promise<TableTypes<"course">[]> => {
    setIsLoading(true);
    let isGrade1: string | boolean = false;
    let isGrade2: string | boolean = false;

    // Check if gradeDocId matches any of the specified grades and assign the value to isGrade1 or isGrade2
    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent) {
      history.replace(PAGES.SELECT_MODE);
      return [];
    }
    // const currClass = localStorage.getItem(CURRENT_CLASS);
    const currClass = schoolUtil.getCurrentClass();
    const currMode = await schoolUtil.getCurrMode();

    const courses = await api.getAdditionalCourses(currentStudent.id);
    localData.courses = courses;
    localStorageData.courses = courses;
    setCourses(courses);
    // addDataToLocalStorage();
    setIsLoading(false);
    return courses;
  };

  const updateCourses = async (): Promise<Course[]> => {
    setIsLoading(true);
    if (selectedCourses && currentStudent) {
      await api.addCourseForParentsStudent(selectedCourses, currentStudent);
    }
    const eventParams = {
      // user_id: currentStudent?.id,
      // user_type: currentStudent?.role,
      // user_name: currentStudent?.name,
      // user_gender: currentStudent?.gender!,
      // user_age: currentStudent?.age!,
      // phone_number: currentStudent?.username,
      // parent_id: currentStudent?.uid,
      // parent_username: currentStudent?.username,
      // action_type: ACTION.UPDATE,
    };
    console.log(
      "Util.logEvent(EVENTS.USER_PROFILE, eventParams);",
      EVENTS.USER_PROFILE,
      eventParams
    );
    Util.logEvent(EVENTS.USER_PROFILE, eventParams);
    setIsLoading(false);
    switch (stage) {
      case STAGES.SUBJECTS:
        // localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        history.replace(PAGES.HOME);
        break;
      default:
        break;
    }
    return [];
  };

  const onBackButton = () => {
    switch (stage) {
      case STAGES.SUBJECTS:
        // localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        history.replace(PAGES.HOME);
        break;
      default:
        break;
    }
  };

  function handleCallback(data: TableTypes<"course">[]) {
    setSelectedCourses(data);
  }

  return (
    <IonPage id="display-subjects-page">
      <Loading isLoading={isLoading} />
      <div className="subjects-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        <div id="next-button">
          <NextButton
            disabled={selectedCourses === (undefined) ? true : false}
            onClicked={() => {
              if (!online) {
                presentToast({
                  message: t(`Device is offline.`),
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
              updateCourses();
            }}
          />
        </div>
        {/* {stage !== STAGES.CHAPTERS && <div className="button-right" />} */}
      </div>
      <div id="display-subjects-page" style={{ height: "100%" }}>
        <SkeltonLoading
          isLoading={isLoading}
          header={HOMEHEADERLIST.SUBJECTS}
        />
        {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 ? (
          <div className="add-subjects-content">
            <AddCourse
              courses={courses}
              onSelectedCoursesChange={handleCallback}
            />
          </div>
        ) : (
          <div className="center">
            {!isLoading && t("No more subjects available to add")}
          </div>
        )}
      </div>
    </IonPage>
  );
};
export default AddCourses;
