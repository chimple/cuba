import { FC, useEffect, useState } from "react";
import Course from "../models/course";
import Lesson from "../models/lesson";

import { Chapter } from "../common/courseConstants";
import { useHistory } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import { FirebaseApi } from "../services/api/FirebaseApi";
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

  const history = useHistory();
  //   const api = ServiceConfig.getI().apiHandler
  const api = FirebaseApi.i;
  useEffect(() => {
    getCourses();
  }, []);

  const getCourses = async (): Promise<Course[]> => {
    setIsLoading(true);
    const currentStudent = api.currentStudent;
    if (!currentStudent) {
      history.replace(PAGES.DISPLAY_STUDENT);
      return [];
    }
    const courses = await api.getCoursesForParentsStudent(currentStudent);
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
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:88 ~ onCourseChanges ~ gradesMap:",
      gradesMap
    );
    const currentGrade = gradesMap.grades.find(
      (grade) => grade.docId === course.grade.id
    );
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:92 ~ onCourseChanges ~ currentGrade:",
      currentGrade
    );
    setCurrentGrade(currentGrade ?? gradesMap.grades[0]);
    setGradesMap(gradesMap);
    setStage(STAGES.CHAPTERS);
    setCurrentCourse(course);
  };

  const onGradeChanges = async (grade: Grade) => {
    const currentCourse = gradesMap?.courses.find(
      (course) => course.grade.id === grade.docId
    );
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:110 ~ onGradeChanges ~ currentCourse:",
      currentCourse
    );
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:114 ~ onGradeChanges ~ grade:",
      grade
    );

    setCurrentGrade(grade);
    setCurrentCourse(currentCourse);
  };

  const onChapterChange = async (chapter: Chapter) => {
    await getLessonsForChapter(chapter);
    setCurrentChapter(chapter);
    setStage(STAGES.LESSONS);
  };

  return (
    <IonPage id="display-subjects-page">
      <Loading isLoading={isLoading} />
      <div className="subjects-header">
        <IonIcon
          className="back-button"
          slot="end"
          icon={chevronBackCircleSharp}
          onClick={onBackButton}
        />
        <div className="subject-name">
          {stage === STAGES.SUBJECTS
            ? t("Subjects")
            : stage === STAGES.CHAPTERS
            ? t("Chapters")
            : ""}
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
            />
          )}
      </div>
      {!isLoading && stage === STAGES.LESSONS && lessons && (
        <div className="slider-container">
          <LessonSlider
            lessonData={lessons}
            isHome={true}
            lessonsScoreMap={{}}
            startIndex={0}
            showSubjectName={false}
          />
        </div>
      )}
    </IonPage>
  );
};
export default DisplaySubjects;
