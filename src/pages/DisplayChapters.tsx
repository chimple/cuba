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
          const { grades } = await api.getDifferentGradesForCourse(currentCourse);
          localData.gradesMap = { grades, courses: [currentCourse] };
          localStorageData.gradesMap = localData.gradesMap;
          addDataToLocalStorage();
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
      addDataToLocalStorage();
      setStage(STAGES.LESSONS);

      setIsLoading(false);
    } else if (!!urlParams.get("isReload")) {

      let strLocalStoreData = localStorage.getItem(DISPLAY_SUBJECTS_STORE);
      if (!!strLocalStoreData) {
        localStorageData = JSON.parse(strLocalStoreData);

        if (!!localStorageData.courses) {
          let tmpCourses: Course[] = Util.convertCourses(localStorageData.courses);
          localData.courses = tmpCourses;
          setCourses(tmpCourses);
          if (!!localStorageData.stage && localStorageData.stage !== STAGES.SUBJECTS && !!localStorageData.currentCourseId) {
            setStage(localStorageData.stage);
            let cc: Course = localData.courses.find(cour => localStorageData.currentCourseId === cour.docId)

            let _localMap = getLocalGradeMap();

            if (!!_localMap) {
              if (!!localStorageData.currentGrade) {
                localData.currentGrade = localStorageData.currentGrade;
                setCurrentGrade(localStorageData.currentGrade);
                const tmpCurrentCourse = _localMap?.courses.find(
                  (course) => course.grade.id === localData.currentGrade.docId
                );

                if (!!tmpCurrentCourse)
                  cc = tmpCurrentCourse;
              }
            };

            localData.currentCourse = cc;
            setCurrentCourse(cc);

            if (!!localStorageData.currentChapterId) {
              let cChap: Chapter = localData.currentCourse.chapters.find(chap => localStorageData.currentChapterId === chap.id)
              localData.currentChapter = cChap;
              setCurrentChapter(cChap);
            }

            if (!!localStorageData.lessonResultMap) {
              let tmpStdMap: { [lessonDocId: string]: StudentLessonResult } = localStorageData.lessonResultMap;
              for (const value of Object.values(tmpStdMap)) {
                if (!!value.course)
                  value.course = Util.getRef(value.course);
              }
              localData.lessonResultMap = tmpStdMap;
              setLessonResultMap(tmpStdMap);
            }

            if (localStorageData.stage === STAGES.LESSONS) {
              getLessonsForChapter(localData.currentChapter);
            } else {
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        } else {
          await getCourses();
          console.log("🚀 ~ file: DisplaySubjects.tsx:127 ~ init ~ getCourses:");
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

  function getLocalGradeMap(): {
    grades: Grade[];
    courses: Course[];
  } | undefined {
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
    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.docId);
    console.log("tempResultLessonMap = res;", res);
    localData.lessonResultMap = res;
    localStorageData.lessonResultMap = res;
    setLessonResultMap(res);

    const currMode = await schoolUtil.getCurrMode();

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

  const getLessonsForChapter = async (chapter: Chapter): Promise<Lesson[]> => {
    setIsLoading(true);
    if (!chapter) {
      setIsLoading(false);
      return [];
    }
    const lessons = await api.getLessonsForChapter(chapter);
    localData.lessons = lessons;
    setLessons(lessons);
    setIsLoading(false);
    return lessons;
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
        addDataToLocalStorage();
        localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get(CONTINUE)){
          history.replace(PAGES.HOME+"?continue=true");
        }else {
        history.replace(PAGES.HOME);
        }
        break;
      case STAGES.LESSONS:
        delete localData.lessons;
        setLessons(undefined);
        localStorageData.stage = STAGES.CHAPTERS;
        addDataToLocalStorage();
        setStage(STAGES.CHAPTERS);

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
    setLocalGradeMap(gradesMap);
    setCurrentCourse(course);
    localStorageData.stage = STAGES.CHAPTERS;
    addDataToLocalStorage();
    setStage(STAGES.CHAPTERS);
  };

  const onGradeChanges = async (grade: Grade) => {
    const currentCourse = localGradeMap?.courses.find(
      (course) => course.grade.id === grade.docId
    );
    localData.currentGrade = grade;
    localStorageData.currentGrade = grade;
    addDataToLocalStorage();
    setCurrentGrade(grade);
    setCurrentCourse(currentCourse);
  };

  const onChapterChange = async (chapter: Chapter) => {
    await getLessonsForChapter(chapter);
    localData.currentChapter = chapter;
    localStorageData.currentChapterId = chapter.id;
    setCurrentChapter(chapter);
    localStorageData.stage = STAGES.LESSONS;
    addDataToLocalStorage();
    setStage(STAGES.LESSONS);
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

  return (
    <IonPage id="display-chapters-page">
      <Loading isLoading={isLoading} />
      <div className="chapters-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        <IonList
          mode="ios"
          style={{ width: "20%", display: "flex", justifyContent: "center" }}
        >
          <IonItem lines="none">
            <div className="chapter-name">
              {stage === STAGES.CHAPTERS
                ? currentCourse?.title
                : currentChapter?.title}
            </div>
          </IonItem>
        </IonList>

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

        {!isLoading &&
          stage === STAGES.CHAPTERS &&
          currentCourse &&
          localGradeMap &&
          currentGrade && (
            <SelectChapter
              chapters={currentCourse.chapters}
              onChapterChange={onChapterChange}
              currentGrade={currentGrade}
              grades={!!localGradeMap ? localGradeMap.grades : localGradeMap}
              onGradeChange={onGradeChanges}
              course={currentCourse}
              currentChapterId={currentChapter?.id}
            />
          )}
      </div>
      {!isLoading && stage === STAGES.LESSONS && lessons && (
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
  );
};
export default DisplayChapters;
