import * as React from "react";
import { FC, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { t } from "i18next";
import {
  ASSIGNMENTTAB_LIST,
  // DISPLAY_SUBJECTS_STORE,
  MODES,
  PAGES,
} from "../../common/constants";
import "../DisplaySubjects.css";
import "../DisplayChapters.css";
import "./Assignment.css";
import "../../components/malta/assignment/DisplayLesson.css";
import { Chapter } from "../../common/courseConstants";
import { schoolUtil } from "../../utility/schoolUtil";
import { Util } from "../../utility/util";
import Course from "../../models/course";
import { ServiceConfig } from "../../services/ServiceConfig";
import Grade from "../../models/grade";
import { StudentLessonResult } from "../../common/courseConstants";
import Class from "../../models/class";
import Lesson from "../../models/lesson";
import AssignmentTab from "../../components/malta/assignment/AssignmentTab";
import RecommendedTab from "../../components/malta/assignment/RecommendedTab";
import QuizTab from "../../components/malta/assignment/QuizTab";
import AssignmentTabList from "../../components/malta/assignment/AssignmentTabList";
import CommonAppBar from "../../components/malta/common/CommonAppBar";

const localData: any = {};
let localStorageData: any = {};

const Assignment: React.FC = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }

  const [activeTab, setActiveTab] = useState(ASSIGNMENTTAB_LIST.RECOMMENDED);
  const [value, setValue] = React.useState(0);
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>();
  const [currentCourse, setCurrentCourse] = useState<Course>();
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessons, setLessons] = useState<Lesson[]>();
  const [liveQuizLessons, setLiveQuizLessons] = useState<Lesson[]>();
  const [mode, setMode] = useState<MODES>();
  const [isNotConnectedToClass, setIsNotConnectedToClass] =
    useState<boolean>(false);
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
  const [userMode, setUserMode] = useState<boolean>(false);
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const urlParams = new URLSearchParams(location.search);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    getCourses();
    console.log("********", courses);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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

    const currMode = await schoolUtil.getCurrMode();

    const courses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    localData.courses = courses;
    localStorageData.courses = courses;
    setCourses(courses);
    // addDataToLocalStorage();
    setIsLoading(false);
    console.log("********", courses);
    getLessonsForChapter(courses![5].chapters[6]);
    getLiveQuizLessons(courses![12].chapters[5]);
    return courses;
  };

  const getLessonsForChapter = async (chapter: Chapter): Promise<Lesson[]> => {
    setIsLoading(true);

    if (!chapter) {
      setIsLoading(false);
      return [];
    }

    try {
      const lessons = await api.getLessonsForChapter(chapter);
      // Retrieve existing data from local storage
      localData.lessons = lessons;
      setLessons(lessons);
      setIsLoading(false);
      return lessons;
    } catch (error) {
      // Handle errors
      console.error("Error fetching lessons:", error);
      setIsLoading(false);
      return [];
    }
  };

  const getLiveQuizLessons = async (chapter: Chapter): Promise<Lesson[]> => {
    setIsLoading(true);

    if (!chapter) {
      setIsLoading(false);
      return [];
    }

    try {
      const lessons = await api.getLessonsForChapter(chapter);
      // Retrieve existing data from local storage
      localData.lessons = lessons;
      setLiveQuizLessons(lessons);
      setIsLoading(false);
      return lessons;
    } catch (error) {
      // Handle errors
      console.error("Error fetching lessons:", error);
      setIsLoading(false);
      return [];
    }
  };

  // function addDataToLocalStorage() {
    // localStorage.setItem(
    //   DISPLAY_SUBJECTS_STORE,
    //   JSON.stringify(localStorageData)
    // );
  // }

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
  const onChapterChange = () => {};
  const onCourseChange = () => {};
  const onLessonSelect = () => {};

  const segmentChanged = (evt) => {
    console.log(evt.detail.value);
    //write logic
    setActiveTab(evt.detail.value);
  };

  return (
    <IonPage style={{ backgroundColor: "white" }}>
      <IonHeader>
        <CommonAppBar title={t("Assignment")} loc="#" showAvatar={false} imgScr="" />
        <AssignmentTabList
          tabHeader={activeTab}
          segmentChanged={segmentChanged}
        ></AssignmentTabList>
      </IonHeader>
      {activeTab == ASSIGNMENTTAB_LIST.RECOMMENDED && (
        <RecommendedTab lessons={lessons!}></RecommendedTab>
      )}

      {activeTab == ASSIGNMENTTAB_LIST.ASSIGNMENT && (
        <AssignmentTab
          courses={courses!}
          lessons={lessons!}
          onChapterChange={onChapterChange}
          onCourseChange={onCourseChange}
          onLessonSelect={onLessonSelect}
        ></AssignmentTab>
      )}

      {activeTab == ASSIGNMENTTAB_LIST.LIVEQUIZ && (
        <QuizTab
          courses={courses!}
          liveQuizLessons={liveQuizLessons!}
          onChapterChange={onChapterChange}
          onCourseChange={onCourseChange}
          onLessonSelect={onLessonSelect}
        ></QuizTab>
      )}
    </IonPage>
  );
};
export default Assignment;
