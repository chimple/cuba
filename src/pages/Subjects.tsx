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
  HOMEHEADERLIST,
  MODES,
  PAGES,
} from "../common/constants";
import { IonIcon, IonPage } from "@ionic/react";
import { chevronBackCircleSharp } from "ionicons/icons";
import "./Subjects.css";
import { t } from "i18next";
import SelectCourse from "../components/displaySubjects/SelectCourse";
import SelectChapter from "../components/displaySubjects/SelectChapter";
import LessonSlider from "../components/LessonSlider";
import Grade from "../models/grade";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import Class from "../models/class";
import { schoolUtil } from "../utility/schoolUtil";
import DropDown from "../components/DropDown";
import { Timestamp } from "firebase/firestore";
import Chapters from "./DisplayChapters";
import SkeltonLoading from "../components/SkeltonLoading";

const localData: any = {};
let localStorageData: any = {};

const Subjects: React.FC<{}> = ({}) => {
  enum STAGES {
    SUBJECTS,
    // CHAPTERS,
    // LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>();
  const [currentCourse, setCurrentCourse] = useState<Course>();
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessons, setLessons] = useState<Lesson[]>();
  const [mode, setMode] = useState<MODES>();
  // const [gradesMap, setGradesMap] = useState<{
  //   grades: Grade[];
  //   courses: Course[];
  // }>();
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
  const urlParams = new URLSearchParams(location.search);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
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
      !!localData.currentCourse &&
      !!localData.currentGrade &&
      !!localData.currentChapter
    ) {
      setCourses(localData.courses);
      setLessons(localData.lessons);
      setCurrentGrade(localData.currentGrade);
      setCurrentCourse(localData.currentCourse);
      setCurrentChapter(localData.currentChapter);
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
      //   localStorageData.stage = STAGES.LESSONS;
      addDataToLocalStorage();
      //   setStage(STAGES.LESSONS);

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

            if (!!localStorageData.localGradeMap) {
              localData.localGradeMap = localStorageData.localGradeMap;
              setLocalGradeMap(localStorageData.localGradeMap);
            }

            if (!!localStorageData.currentGrade) {
              localData.currentGrade = localStorageData.currentGrade;
              setCurrentGrade(localStorageData.currentGrade);
            }

            if (!!localStorageData.currentChapterId) {
              let cChap: Chapter = localData.currentCourse.chapters.find(
                (chap) => localStorageData.currentChapterId === chap.id
              );
              localData.currentChapter = cChap;
              setCurrentChapter(cChap);
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

            // if (localStorageData.stage === STAGES.LESSONS) {
            //   getLessonsForChapter(localData.currentChapter);
            // } else {
            //   setIsLoading(false);
            // }
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
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      let _localMap: {
        grades: Grade[];
        courses: Course[];
      } = JSON.parse(map);
      let convertedCourses = Util.convertCourses(_localMap.courses);
      _localMap.courses = convertedCourses;
      setLocalGradeMap(_localMap);
    }
  };

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
    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.docId);
    console.log("tempResultLessonMap = res;", res);
    localData.lessonResultMap = res;
    localStorageData.lessonResultMap = res;
    setLessonResultMap(res);

    const currMode = await schoolUtil.getCurrMode();
    setMode(currMode);

    const courses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    localData.courses = courses;
    localStorageData.courses = courses;
    setCourses(courses);
    addDataToLocalStorage();
    setIsLoading(false);
    return courses;
  };

  const onCourseChanges = async (course: Course) => {
    const gradesMap: { grades: Grade[]; courses: Course[] } =
      await api.getDifferentGradesForCourse(course);
    const currentGrade = gradesMap.grades.find(
      (grade) => grade.docId === course.grade.id
    );
    localStorage.setItem(GRADE_MAP, JSON.stringify(gradesMap));
    localData.currentGrade = currentGrade ?? gradesMap.grades[0];
    localStorageData.currentGrade = localData.currentGrade;
    localData.gradesMap = gradesMap;
    localStorageData.gradesMap = localData.gradesMap;
    localData.currentCourse = course;
    localStorageData.currentCourseId = course.docId;
    setCurrentGrade(currentGrade ?? gradesMap.grades[0]);
    setLocalGradeMap(gradesMap);
    setCurrentCourse(course);
    // localStorageData.stage = STAGES.CHAPTERS;
    addDataToLocalStorage();
    const params = `courseDocId=${course.docId}`;
    // history.replace(PAGES.DISPLAY_CHAPTERS + params);
    if (urlParams.get(CONTINUE)) {
      history.replace(PAGES.DISPLAY_CHAPTERS + `?${CONTINUE}=true` +"&"+ params );
    } else {
      history.replace(PAGES.DISPLAY_CHAPTERS + "?" + params);
    }
  };

  function addDataToLocalStorage() {
    localStorage.setItem(
      DISPLAY_SUBJECTS_STORE,
      JSON.stringify(localStorageData)
    );
  }

  return (
    <div id="display-subjects-page" style={{ height: "100vh" }}>
      <SkeltonLoading isLoading={isLoading} header={HOMEHEADERLIST.SUBJECTS} />
      <div className="subjects-content">
        {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <SelectCourse courses={courses} modeParent={mode == MODES.PARENT?? true} onCourseChange={onCourseChanges} />
          )}
      </div>
    </div>
  );
};
export default Subjects;
