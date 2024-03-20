import { FC, useEffect, useState } from "react";
import Course from "../models/course";

import { StudentLessonResult } from "../common/courseConstants";
import { useLocation } from "react-router";
import { useHistory } from "react-router-dom"
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CONTINUE,
  DISPLAY_SUBJECTS_STORE,
  MODES,
  PAGES,
} from "../common/constants";
import { IonPage } from "@ionic/react";
import "./DisplaySubjects.css";
import Loading from "../components/Loading";
import Grade from "../models/grade";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import AddCourse from "../components/displaySubjects/AddCourse";

const localData: any = {};
let localStorageData: any = {};
const AddSubjects: React.FC = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>();
  const [currentCourse, setCurrentCourse] = useState<Course>();
  const [reloadSubjects, setReloadSubjects] = useState<boolean>(false);
  const [localGradeMap, setLocalGradeMap] = useState<{
    grades: Grade[];
    courses: Course[];
  }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  useEffect(() => {
    setIsLoading(true);
    init();
    getCourses();
  }, [reloadSubjects]);

  const init = async () => {
    const urlParams = new URLSearchParams(location.search);
    if (
      !!urlParams.get(CONTINUE) &&
      !!localData.currentCourse 
    ) {
      setCourses(localData.courses);

      setIsLoading(false);
    } else if (!!urlParams.get("isReload")) {
      let strLocalStoreData = localStorage.getItem(DISPLAY_SUBJECTS_STORE);
      if (!!strLocalStoreData) {
        localStorageData = JSON.parse(strLocalStoreData);

        if (!!localStorageData.courses) {
          let tmpCourses: Course[] = Util.convertCourses(
            localStorageData.courses
          );
          localData.courses = tmpCourses;
          setCourses(tmpCourses);
          if (
            !!localStorageData.stage &&
            localStorageData.stage !== STAGES.SUBJECTS &&
            !!localStorageData.currentCourseId
          ) {
            setStage(localStorageData.stage);
            let cc: Course = localData.courses.find(
              (cour) => localStorageData.currentCourseId === cour.docId
            );

            localData.currentCourse = cc;
            setCurrentCourse(cc);

          } else {
            setIsLoading(false);
          }
        } else {
          await getCourses();
        }
      } else {
        await getCourses();
      }
    } else {
      await getCourses();
    }
  };



  function addDataToLocalStorage() {
    localStorage.setItem(
      DISPLAY_SUBJECTS_STORE,
      JSON.stringify(localStorageData)
    );
  }

  const getCourses = async (): Promise<Course[]> => {
    setIsLoading(true);
    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent) {
      history.replace(PAGES.SELECT_MODE);
      return [];
    }
    // const currClass = localStorage.getItem(CURRENT_CLASS);
    const currClass = schoolUtil.getCurrentClass();
    const currMode = await schoolUtil.getCurrMode();
    
    const allCourses = await api.getCoursesForParentsStudent(currentStudent);

    const courses = await api.getOptionalCourses(currentStudent.grade?.id, allCourses);
      
    localData.courses = courses;
    localStorageData.courses = courses;
    setCourses(courses);
    addDataToLocalStorage();
    setIsLoading(false);
    return courses;
  };

  const onBackButton = () => {
    switch (stage) {
      case STAGES.SUBJECTS:
        localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        history.replace(PAGES.HOME);
        break;
      default:
        break;
    }
  };

  return (
    <IonPage id="display-subjects-page">
      <Loading isLoading={isLoading} />
      <div className="subjects-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        
        {stage !== STAGES.CHAPTERS && <div className="button-right" />}
      </div>
      <div className="subjects-content">
        {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <AddCourse courses={courses} setReloadSubjects={setReloadSubjects}/>
          )}
      </div>
     
    </IonPage>
  );
};
export default AddSubjects;
