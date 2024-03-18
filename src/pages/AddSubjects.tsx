import { FC, useEffect, useState } from "react";
import Course from "../models/course";
import Lesson from "../models/lesson";

import { Chapter, StudentLessonResult } from "../common/courseConstants";
import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CONTINUE,
  CURRENT_CLASS,
  CURRENT_MODE,
  DISPLAY_SUBJECTS_STORE,
  GRADE_MAP,
  MODES,
  PAGES,
} from "../common/constants";
import { IonIcon, IonPage } from "@ionic/react";
import { chevronBackCircleSharp } from "ionicons/icons";
import "./DisplaySubjects.css";
import { t } from "i18next";
import SelectCourse from "../components/displaySubjects/SelectCourse";
import Loading from "../components/Loading";
import SelectChapter from "../components/displaySubjects/SelectChapter";
import LessonSlider from "../components/LessonSlider";
import Grade from "../models/grade";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import Class from "../models/class";
import { schoolUtil } from "../utility/schoolUtil";
import DropDown from "../components/DropDown";
import { Timestamp } from "firebase/firestore";
import AddCourse from "../components/displaySubjects/AddCourse";

const localData: any = {};
let localStorageData: any = {};
const AddSubjects: FC<{}> = () => {
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
  const [currentGrade, setCurrentGrade] = useState<Grade>();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: StudentLessonResult;
  }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  useEffect(() => {
    setIsLoading(true);
    init();
    getLocalGradeMap();
    getCourses();
  }, [reloadSubjects]);

  const init = async () => {
    const urlParams = new URLSearchParams(location.search);
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:47 ~ init ~ urlParams:",
      urlParams.get(CONTINUE)
    );
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:68 ~ init ~ localData:",
      localData
    );
    if (
      !!urlParams.get(CONTINUE) &&
      !!localData.currentCourse 
    ) {
      setCourses(localData.courses);
      if (localData.lessonResultMap) {
        setLessonResultMap(localData.lessonResultMap);
      } else {
        const currentStudent = await Util.getCurrentStudent();
        if (currentStudent) {
          //loading student result cache (seems like a new user)
          const result = await api.getStudentResult(currentStudent.docId, true);
          const lessons = result?.lessons;
          localData.lessonResultMap = lessons;
          setLessonResultMap(lessons);
        }
      }

      !!localData.localGradeMap && setLocalGradeMap(localData.localGradeMap);
      localStorageData.lessonResultMap = localData.lessonResultMap;
      localStorageData.stage = STAGES.LESSONS;
      addDataToLocalStorage();
      setStage(STAGES.LESSONS);

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

            let _localMap = getLocalGradeMap();

            if (!!_localMap) {
              if (!!localStorageData.currentGrade) {
                localData.currentGrade = localStorageData.currentGrade;
                setCurrentGrade(localStorageData.currentGrade);
                const tmpCurrentCourse = _localMap?.courses.find(
                  (course) => course.grade.id === localData.currentGrade.docId
                );

                if (!!tmpCurrentCourse) cc = tmpCurrentCourse;
              }
            }

            localData.currentCourse = cc;
            setCurrentCourse(cc);

            if (!!localStorageData.currentChapterId) {
              let cChap: Chapter = localData.currentCourse.chapters.find(
                (chap) => localStorageData.currentChapterId === chap.id
              );
              localData.currentChapter = cChap;
            //   setCurrentChapter(cChap);
            }

            if (!!localStorageData.lessonResultMap) {
              let tmpStdMap: { [lessonDocId: string]: StudentLessonResult } =
                localStorageData.lessonResultMap;
              for (const value of Object.values(tmpStdMap)) {
                if (!!value.course) value.course = Util.getRef(value.course);
              }
              localData.lessonResultMap = tmpStdMap;
              setLessonResultMap(tmpStdMap);
            }

            if (localStorageData.stage === STAGES.LESSONS) {
            //   getLessonsForChapter(localData.currentChapter);
            } else {
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        } else {
          await getCourses();
          console.log(
            "🚀 ~ file: DisplaySubjects.tsx:127 ~ init ~ getCourses:"
          );
        }
      } else {
        await getCourses();
        console.log("🚀 ~ file: DisplaySubjects.tsx:126 ~ init ~ getCourses:");
      }
    } else {
      await getCourses();
      console.log("🚀 ~ file: DisplaySubjects.tsx:131 ~ init ~ getCourses:");
    }
    getLocalGradeMap();
  };

  function getLocalGradeMap():
    | {
        grades: Grade[];
        courses: Course[];
      }
    | undefined {
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      let _localMap: {
        grades: Grade[];
        courses: Course[];
      } = JSON.parse(map);
      let convertedCourses = Util.convertCourses(_localMap.courses);
      _localMap.courses = convertedCourses;
      setLocalGradeMap(_localMap);
      return _localMap;
    }
  }

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
      // history.replace(PAGES.DISPLAY_STUDENT);
      history.replace(PAGES.SELECT_MODE);
      return [];
    }
    // const currClass = localStorage.getItem(CURRENT_CLASS);
    const currClass = schoolUtil.getCurrentClass();
    // if (!!currClass) setCurrentClass(currClass);
    api.getStudentResultInMap(currentStudent.docId).then(async (res) => {
      console.log("tempResultLessonMap = res;", res);
      localData.lessonResultMap = res;
      localStorageData.lessonResultMap = res;
      setLessonResultMap(res);
    });
    const currMode = await schoolUtil.getCurrMode();
    
    const allCourses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));

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
      case STAGES.CHAPTERS:
        delete localData.currentChapter;
        delete localStorageData.currentChapterId;
        // setCurrentChapter(undefined);
        localStorageData.stage = STAGES.SUBJECTS;
        addDataToLocalStorage();
        setStage(STAGES.SUBJECTS);
        break;
      case STAGES.LESSONS:
        delete localData.lessons;
        // setLessons(undefined);
        localStorageData.stage = STAGES.CHAPTERS;
        addDataToLocalStorage();
        setStage(STAGES.CHAPTERS);

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
