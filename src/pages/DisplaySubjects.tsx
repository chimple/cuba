import { FC, useEffect, useState } from "react";
import Course from "../models/course";
import Lesson from "../models/lesson";

import { Chapter, StudentLessonResult } from "../common/courseConstants";
import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CURRENT_CLASS,
  CURRENT_MODE,
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

const localData: any = {};
const DisplaySubjects: FC<{}> = () => {
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
  /* const [gradesMap, setGradesMap] = useState<{
     grades: Grade[];
     courses: Course[];
   }>();*/
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
    init();
  }, []);
  useEffect(() => {
    console.log("chapters", currentCourse);
    console.log("local grade map", localGradeMap);
    if (!localGradeMap || !localGradeMap.grades) {
      if (currentCourse) {
        setIsLoading(true);
        api.getDifferentGradesForCourse(currentCourse).then(({ grades }) => {
          localData.gradesMap = { grades, courses: [currentCourse] };
          setLocalGradeMap({ grades, courses: [currentCourse] });
          setIsLoading(false);
        });
      }
    }
  }, [localGradeMap, currentCourse]);

  const init = async () => {
    const urlParams = new URLSearchParams(location.search);
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:47 ~ init ~ urlParams:",
      urlParams.get("continue")
    );
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:68 ~ init ~ localData:",
      localData
    );
    if (
      !!urlParams.get("continue") &&
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
      setStage(STAGES.LESSONS);
      setIsLoading(false);
    } else {
      await getCourses();
      console.log("🚀 ~ file: DisplaySubjects.tsx:70 ~ init ~ getCourses:");
    }
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      setLocalGradeMap(JSON.parse(map));
    };
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
    api.getStudentResultInMap(currentStudent.docId).then(async (res) => {
      console.log("tempResultLessonMap = res;", res);
      localData.lessonResultMap = res;
      setLessonResultMap(res);
    });
    const currMode = await schoolUtil.getCurrMode();

    const courses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    localData.courses = courses;
    setCourses(courses);
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
      case STAGES.SUBJECTS:
        history.replace(PAGES.HOME);
        break;
      case STAGES.CHAPTERS:
        setStage(STAGES.SUBJECTS);
        break;
      case STAGES.LESSONS:
        setStage(STAGES.CHAPTERS);
        break;
      default:
        break;
    }
  };
  const onCourseChanges = async (course: Course) => {
    const localGradeMap: { grades: Grade[]; courses: Course[] } =
      await api.getDifferentGradesForCourse(course);
    const currentGrade = localGradeMap.grades.find(
      (grade) => grade.docId === course.grade.id
    );
    localStorage.setItem(GRADE_MAP, JSON.stringify(localGradeMap));
    localData.currentGrade = currentGrade ?? localGradeMap.grades[0];
    localData.localGradeMap = localGradeMap;
    localData.currentCourse = course;
    setCurrentGrade(currentGrade ?? localGradeMap.grades[0]);
    setLocalGradeMap(localGradeMap);
    setCurrentCourse(course);
    setStage(STAGES.CHAPTERS);
  };

  const onGradeChanges = async (grade: Grade) => {
    const currentCourse = localGradeMap?.courses.find(
      (course) => course.grade.id === grade.docId
    );
    localData.currentGrade = grade;
    setCurrentGrade(grade);
    setCurrentCourse(currentCourse);
  };

  const onChapterChange = async (chapter: Chapter) => {
    await getLessonsForChapter(chapter);
    localData.currentChapter = chapter;
    setCurrentChapter(chapter);
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
      })

    return startIndex;
  }

  return (
    <IonPage id="display-subjects-page">
      <Loading isLoading={isLoading} />
      <div className="subjects-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        <div className="subject-name">
          {stage === STAGES.SUBJECTS
            ? t("Subjects")
            : stage === STAGES.CHAPTERS
              ? currentCourse?.title
              : currentChapter?.title}
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
                  (grade) => grade.docId === evt.detail.value
                );
                onGradeChanges(tempGrade ?? currentGrade);
              }
            }}
            width="15vw"
          />
        )}
        {stage !== STAGES.CHAPTERS && <div className="button-right" />}
      </div>
      <div className="subjects-content">
        {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <SelectCourse courses={courses} onCourseChange={onCourseChanges} />
          )}

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
            showChapterName = {true}
          />
        </div>
      )}
    </IonPage>
  );
};
export default DisplaySubjects;
