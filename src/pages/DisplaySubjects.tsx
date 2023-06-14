import { FC, useEffect, useState } from "react";
import Course from "../models/course";
import Lesson from "../models/lesson";

import { Chapter, StudentLessonResult } from "../common/courseConstants";
import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import { PAGES } from "../common/constants";
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
  const [lessons, setLessons] = useState<Lesson[]>();
  const [gradesMap, setGradesMap] = useState<{
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
      setGradesMap(localData.gradesMap);
      setCurrentCourse(localData.currentCourse);
      setCurrentChapter(localData.currentChapter);
      setStage(STAGES.LESSONS);
      setIsLoading(false);
    } else {
      await getCourses();
      console.log("🚀 ~ file: DisplaySubjects.tsx:70 ~ init ~ getCourses:");
    }
  };

  const getCourses = async (): Promise<Course[]> => {
    setIsLoading(true);
    const currentStudent = api.currentStudent;
    if (!currentStudent) {
      history.replace(PAGES.DISPLAY_STUDENT);
      return [];
    }
    api.getStudentResultInMap(currentStudent.docId).then(async (res) => {
      console.log("tempResultLessonMap = res;", res);
      setLessonResultMap(res);
    });
    const courses = await api.getCoursesForParentsStudent(currentStudent);
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
    const gradesMap: { grades: Grade[]; courses: Course[] } =
      await api.getDifferentGradesForCourse(course);
    const currentGrade = gradesMap.grades.find(
      (grade) => grade.docId === course.grade.id
    );
    localData.currentGrade = currentGrade ?? gradesMap.grades[0];
    localData.gradesMap = gradesMap;
    localData.currentCourse = course;
    setCurrentGrade(currentGrade ?? gradesMap.grades[0]);
    setGradesMap(gradesMap);
    setCurrentCourse(course);
    setStage(STAGES.CHAPTERS);
  };

  const onGradeChanges = async (grade: Grade) => {
    const currentCourse = gradesMap?.courses.find(
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

  return (
    <IonPage id="display-subjects-page">
      <Loading isLoading={isLoading} />
      <div className="subjects-header">
        <BackButton onClicked={onBackButton} />
        <div className="subject-name">
          {stage === STAGES.SUBJECTS
            ? t("Subjects")
            : stage === STAGES.CHAPTERS
            ? currentCourse?.title
            : currentChapter?.title}
        </div>
        <div className="button-right" />
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
          currentGrade &&
          gradesMap && (
            <SelectChapter
              chapters={currentCourse.chapters}
              onChapterChange={onChapterChange}
              currentGrade={currentGrade}
              grades={gradesMap.grades}
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
            startIndex={0}
            showSubjectName={false}
          />
        </div>
      )}
    </IonPage>
  );
};
export default DisplaySubjects;
