import { FC, useEffect, useState } from "react";
import Course from "../models/course";
import Lesson from "../models/lesson";

import { Chapter, StudentLessonResult } from "../common/courseConstants";
import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  LESSON_DOC_LESSON_ID_MAP,
  CONTINUE,
  CURRENT_CLASS,
  CURRENT_MODE,
  GRADE_MAP,
  MODES,
  PAGES,
  CURRENT_SELECTED_COURSE,
  CURRENT_SELECTED_GRADE,
  CURRENT_STAGE,
  CURRENT_SELECTED_CHAPTER,
  COURSES,
} from "../common/constants";
import { IonIcon, IonItem, IonList, IonPage } from "@ionic/react";
import { chevronBackCircleSharp } from "ionicons/icons";
import "./DisplayChapters.css";
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
import SkeltonLoading from "../components/SkeltonLoading";

const localData: any = {};
let localStorageData: any = {};
const DisplayChapters: FC<{}> = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>();
  const [currentCourse, setCurrentCourse] = useState<Course>();
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessons, setLessons] = useState<Lesson[]>();
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

  const searchParams = new URLSearchParams(location.search);
  const courseDocId = searchParams.get("courseDocId");
  const getCourseByUrl = localGradeMap?.courses.find(
    (course) => courseDocId == course.docId
  );
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (getCourseByUrl && !currentCourse) {
      //as url params change(course.docId) and currentCourse empty they we are using this
      onCourseChanges(getCourseByUrl);
    }

    if (!localGradeMap || !localGradeMap.grades) {
      if (currentCourse) {
        setIsLoading(true);
        const getLocalGradeMap = async () => {
          const { grades } =
            await api.getDifferentGradesForCourse(currentCourse);
          localData.gradesMap = { grades, courses: [currentCourse] };
          localStorageData.gradesMap = localData.gradesMap;
          // addDataToLocalStorage();
          setLocalGradeMap({ grades, courses: [currentCourse] });
          setIsLoading(false);
        };
        getLocalGradeMap();
      }
    }

    console.log("chapters", currentCourse);
    console.log("local grade map", localGradeMap);
  }, [getCourseByUrl, localGradeMap, currentCourse]);

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
      localStorageData.stage = STAGES.LESSONS;
      // addDataToLocalStorage();
      setStage(STAGES.LESSONS);
      addStateTolocalStorage(STAGES.LESSONS);

      setIsLoading(false);
    } else if (!!urlParams.get("isReload")) {
      await getCourses();
      setIsLoading(true);
      const strCourse = localStorage.getItem(CURRENT_SELECTED_COURSE);
      if (!!strCourse) {
        const currentCourse = JSON.parse(strCourse);
        Util.convertCourses([currentCourse]);
        setCurrentCourse(currentCourse);
        const currentGrade = localStorage.getItem(CURRENT_SELECTED_GRADE);
        if (currentGrade) setCurrentGrade(JSON.parse(currentGrade));
        const currentStage = localStorage.getItem(CURRENT_STAGE);
        if (currentStage) {
          setStage(JSON.parse(currentStage));
        }
        const strChapter = localStorage.getItem(CURRENT_SELECTED_CHAPTER);
        if (strChapter) {
          const currentChapter = JSON.parse(strChapter);
          currentChapter.lessons = Util.convertDoc(currentChapter.lessons);
          setCurrentChapter(currentChapter);
          const lessons = await getLessonsForChapter(currentChapter);
          setLessons(lessons);
        } else setCurrentChapter(undefined);
        setIsLoading(false);
      } else setCurrentCourse(undefined);
      setIsLoading(false);
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

  // function addDataToLocalStorage() {
  // localStorage.setItem(
  //   DISPLAY_SUBJECTS_STORE,
  //   JSON.stringify(localStorageData)
  // );
  // }

  const getCourses = async (): Promise<Course[]> => {
    setIsLoading(true);
    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent) {
      // history.replace(PAGES.DISPLAY_STUDENT);
      history.replace(PAGES.SELECT_MODE);
      return [];
    }

    // const currClass = localStorage.getItem(CURRENT_CLASS);
    let currClass;
    const result = await api.getStudentResult(currentStudent.docId, true);
    if (result?.classes && result.classes.length > 0) {
      const classId = result.classes[0];
      currClass = await api.getClassById(classId);
    } else {
      console.log("No classes found for the student.");
    }
    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.docId);
    console.log("tempResultLessonMap = res;", res);
    localData.lessonResultMap = res;
    localStorageData.lessonResultMap = res;
    setLessonResultMap(res);

    const currMode = await schoolUtil.getCurrMode();

    const courses = await (!!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    localData.courses = courses;
    localStorageData.courses = courses;
    setCourses(courses);
    // addDataToLocalStorage();
    setIsLoading(false);
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

  const onBackButton = () => {
    switch (stage) {
      // case STAGES.SUBJECTS:
      //   localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
      //   history.replace(PAGES.HOME);
      //   break;
      case STAGES.CHAPTERS:
        delete localData.currentChapter;
        delete localStorageData.currentChapterId;
        setCurrentChapter(undefined);
        localStorageData.stage = STAGES.SUBJECTS;
        // addDataToLocalStorage();
        // localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        localStorage.removeItem(CURRENT_SELECTED_COURSE);
        localStorage.removeItem(CURRENT_SELECTED_GRADE);
        Util.setPathToBackButton(PAGES.HOME, history);
        break;
      case STAGES.LESSONS:
        delete localData.lessons;
        setLessons(undefined);
        localStorageData.stage = STAGES.CHAPTERS;
        // addDataToLocalStorage();
        setStage(STAGES.CHAPTERS);
        localStorage.removeItem(CURRENT_SELECTED_CHAPTER);
        addStateTolocalStorage(STAGES.CHAPTERS);
        break;
      default:
        break;
    }
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
    addGradeToLocalStorage(currentGrade ?? gradesMap.grades[0]);
    setLocalGradeMap(gradesMap);
    Util.setCurrentCourseToLocalStorage(course);
    setCurrentCourse(course);
    localStorageData.stage = STAGES.CHAPTERS;
    setStage(STAGES.CHAPTERS);
    addStateTolocalStorage(STAGES.CHAPTERS);
  };

  const onGradeChanges = async (grade: Grade) => {
    const currentCourse = localGradeMap?.courses.find(
      (course) => course.grade.id === grade.docId
    );
    localData.currentGrade = grade;
    localStorageData.currentGrade = grade;
    setCurrentGrade(grade);
    addGradeToLocalStorage(grade);
    if (currentCourse) {
      setCurrentCourse(currentCourse);
      Util.setCurrentCourseToLocalStorage(currentCourse);
      localData.currentCourse = currentCourse;
      localStorageData.currentCourse = currentCourse;
    }
  };

  const onChapterChange = async (chapter: Chapter) => {
    await getLessonsForChapter(chapter);
    localData.currentChapter = chapter;
    localStorageData.currentChapterId = chapter.id;
    setCurrentChapter(chapter);
    localStorage.setItem(CURRENT_SELECTED_CHAPTER, JSON.stringify(chapter));
    localStorageData.stage = STAGES.LESSONS;
    // addDataToLocalStorage();
    setStage(STAGES.LESSONS);
    addStateTolocalStorage(STAGES.LESSONS);
  };

  function getLastPlayedLessonIndex() {
    let lastPlayedLessonDate: Timestamp;
    let startIndex = 0;
    if (!!lessonResultMap)
      lessons?.forEach((less: Lesson, i: number) => {
        const studentResultOfLess = lessonResultMap[less.docId];
        if (!!studentResultOfLess) {
          if (!lastPlayedLessonDate) {
            lastPlayedLessonDate = lessonResultMap[less.docId].date;
            startIndex = i;
          } else {
            if (lessonResultMap[less.docId].date > lastPlayedLessonDate) {
              lastPlayedLessonDate = studentResultOfLess.date;
              startIndex = i;
            }
          }
        }
      });

    return startIndex;
  }
  function addStateTolocalStorage(stage: STAGES) {
    localStorage.setItem(CURRENT_STAGE, JSON.stringify(stage));
  }
  function addGradeToLocalStorage(grade: Grade) {
    localStorage.setItem(CURRENT_SELECTED_GRADE, JSON.stringify(grade));
  }
  return !isLoading ? (
    <IonPage id="display-chapters-page">
      <div className="chapters-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        <div className="chapter-header">
          <IonItem lines="none">
            <div className="chapter-name">
              {stage === STAGES.CHAPTERS
                ? currentCourse
                  ? t(currentCourse?.title)
                  : ""
                : currentChapter
                  ? t(currentChapter?.title)
                  : ""}
            </div>
          </IonItem>
        </div>

        {localGradeMap && currentGrade && stage === STAGES.CHAPTERS && (
          <DropDown
            currentValue={currentGrade?.docId}
            optionList={localGradeMap.grades.map((grade) => ({
              displayName: grade.title,
              id: grade.docId,
            }))}
            placeholder=""
            onValueChange={(evt) => {
              {
                const tempGrade = localGradeMap.grades.find(
                  (grade) => grade.docId === evt
                );
                onGradeChanges(tempGrade ?? currentGrade);
              }
            }}
            width="15vw"
          />
        )}
        {stage !== STAGES.CHAPTERS && <div className="button-right" />}
      </div>
      <div className="chapters-content">
        {/* {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <SelectCourse courses={courses} onCourseChange={onCourseChanges} />
          )} */}

        {stage === STAGES.CHAPTERS &&
          currentCourse &&
          localGradeMap &&
          currentGrade && (
            <div>
              <SelectChapter
                chapters={currentCourse.chapters}
                onChapterChange={onChapterChange}
                currentGrade={currentGrade}
                grades={!!localGradeMap ? localGradeMap.grades : localGradeMap}
                onGradeChange={onGradeChanges}
                course={currentCourse}
                currentChapterId={currentChapter?.id}
              />
            </div>
          )}
      </div>

      {stage === STAGES.LESSONS && lessons && (
        <div className="slider-container">
          <LessonSlider
            lessonData={lessons}
            isHome={true}
            course={currentCourse!}
            lessonsScoreMap={lessonResultMap || {}}
            startIndex={getLastPlayedLessonIndex()}
            showSubjectName={false}
            showChapterName={false}
          />
        </div>
      )}
    </IonPage>
  ) : (
    <SkeltonLoading
      isLoading={isLoading}
      header={PAGES.DISPLAY_CHAPTERS}
      isChapter={stage == STAGES.CHAPTERS ? false : true}
    />
  );
};
export default DisplayChapters;
