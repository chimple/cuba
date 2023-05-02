import { IonCol, IonGrid, IonList, IonPage, IonRow } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import Loading from "../components/Loading";
import "./StudentProgress.css";
import { PAGES } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import StudentProgressHeader from "../components/studentProgress/StudentProgressHeader";
import Course from "../models/course";
import React from "react";
import User from "../models/user";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { StudentLessonResult } from "../common/courseConstants";
import Lesson from "../models/lesson";
import { useHistory } from "react-router-dom";

const StudentProgress: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [studentProgressHeaderIconList, setStudentProgressHeaderIconList] =
    useState<HeaderIconConfig[]>([]);
  const [headerContent, setHeaderContent] = useState<string[]>([]);
  const [dataContent, setDataContent] = useState<string[][]>([]);
  const [currentStudent, setCurrentStudent] = useState<User>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonsResults, setLessonsResults] = useState<
    Map<string, StudentLessonResult>
  >(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  useEffect(() => {
    setIsLoading(true);
    inti();
  }, []);

  interface HeaderIconConfig {
    displayName: string;
    iconSrc: string;
    header: any;
    course: Course;
  }

  async function inti() {
    const currentStudent = await api.currentStudent;
    if (currentStudent) {
      // console.log("User ", currentStudent);
      setHeaderContent(["Lesson Name", "Chapter Name", "Score", "Time Spent"]);
      setCurrentStudent(currentStudent);

      const courses = await getCourses();
      // console.log("courses ", courses);
      setCourses(courses);
      setCurrentHeader(courses[0].courseCode);

      let tempStudentProgressHeaderIconList: HeaderIconConfig[] = [];

      for (let i = 0; i < courses.length; i++) {
        tempStudentProgressHeaderIconList.push({
          displayName: courses[i].title,
          iconSrc: courses[i].thumbnail ?? "assets/icons/EnglishIcon.svg",
          header: courses[i].courseCode,
          course: courses[i],
        });
      }

      setStudentProgressHeaderIconList(tempStudentProgressHeaderIconList);

      api.getLessonResultsForStudent(currentStudent.docId).then((res) => {
        console.log("lesson res", res);
        setLessonsResults(res || new Map());
        getResultsForStudentForSelectedHeader(courses[0], res || new Map());
      });

      setIsLoading(false);
    }
  }

  async function onHeaderIconClick(selectedHeader: any) {
    console.log("setIsLoading(true);", isLoading);
    setCurrentHeader(selectedHeader);
    const currentStudent = await api.currentStudent;
    if (currentStudent) {
      for (let i = 0; i < studentProgressHeaderIconList.length; i++) {
        if (studentProgressHeaderIconList[i].header === selectedHeader) {
          getResultsForStudentForSelectedHeader(
            studentProgressHeaderIconList[i].course,
            lessonsResults
          );
          console.log("setIsLoading(false);", isLoading);
          return;
        }
      }
    }
  }

  async function getResultsForStudentForSelectedHeader(
    course: Course,
    lessonsResults: Map<string, StudentLessonResult>
  ) {
    setIsLoading(true);
    console.log("Selected header ", course.title, lessonsResults);
    let isDataAvailable: boolean = false;
    let tempDataContent: string[][] = [];
    if (lessonsResults) {
      // for (let i = 0; i < course.chapters.length; i++) {
      //   const chapter = course.chapters[i];
      //   for (let j = 0; j < chapter.lessons.length; j++) {
      //     const lesson = chapter.lessons[j];
      //     const lessonDetail = (await api.getLesson(lesson.id)) as Lesson;
      //     const lessonRes = await lessonsResults.get(lesson.id);
      //     // console.log("const lessonRes ", lessonRes, lessonDetail);

      //     if (lessonDetail && lessonRes) {
      //       isDataAvailable = true;
      //       console.log(
      //         "Data ",
      //         lessonDetail.title,
      //         chapter.title,
      //         lessonRes.score,
      //         lessonRes.timeSpent
      //       );
      //       tempDataContent.push([
      //         lessonDetail.title,
      //         chapter.title,
      //         lessonRes.score.toString(),
      //         lessonRes.timeSpent.toString(),
      //       ]);
      //       console.log("tempDataContent ", tempDataContent);
      //       setDataContent(tempDataContent);
      //       // setIsLoading(false);
      //     }
      //   }
      // }

      await course.chapters.forEach(async (chapter) => {
        await chapter.lessons.forEach(async (lesson) => {
          const lessonDetail = (await api.getLesson(lesson.id)) as Lesson;
          const lessonRes = await lessonsResults.get(lesson.id);
          // console.log("const lessonRes ", lessonRes, lessonDetail);

          if (lessonDetail && lessonRes) {
            isDataAvailable = true;
            console.log(
              "Data ",
              lessonDetail.title,
              chapter.title,
              lessonRes.score,
              lessonRes.timeSpent
            );
            tempDataContent.push([
              lessonDetail.title,
              chapter.title,
              lessonRes.score.toString(),
              lessonRes.timeSpent.toString(),
            ]);
            console.log("tempDataContent ", tempDataContent);
            setDataContent(tempDataContent);
            setIsLoading(false);
          }
        });
      });
    }

    // return isDataAvailable ? tempDataContent : [];

    console.log(
      "if (!isDataAvailable && !lessonsResults) {",
      isDataAvailable,
      lessonsResults,
      tempDataContent,
      tempDataContent.length,
      !isDataAvailable && tempDataContent
    );

    if (!isDataAvailable) {
      setDataContent([]);
      // setIsLoading(false);
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  const getCourses = async (): Promise<Course[]> => {
    const currentStudent = api.currentStudent;
    if (!currentStudent) {
      history.replace(PAGES.STUDENT_PROGRESS);
      return [];
    }
    const courses = await api.getCoursesForParentsStudent(currentStudent);
    return courses;
  };

  function displayProgressUI(selectedHeader: any) {
    return (
      <div id="student-progress-display-progress">
        <div id="student-progress-display-progress-header">
          <IonRow>
            {headerContent.map((h) => {
              return (
                <IonCol size="12" size-sm="3">
                  <p id="student-progress-display-progress-header-content">
                    {h}
                  </p>
                </IonCol>
              );
            })}
          </IonRow>
        </div>
        {dataContent.length === 0 ? (
          <p id="student-progress-display-progress-no-data-message">
            {"No Data "}
          </p>
        ) : null}
        <div id="student-progress-display-progress-content">
          {dataContent.map((e) => {
            return (
              <IonRow>
                {e.map((d) => {
                  return (
                    <IonCol size="12" size-sm="3">
                      <p id="student-progress-display-progress-content-text">
                        {d}
                      </p>
                    </IonCol>
                  );
                })}
              </IonRow>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {!isLoading ? (
        <div id="student-progress">
          <StudentProgressHeader
            currentHeader={currentHeader}
            headerIconList={studentProgressHeaderIconList}
            onHeaderIconClick={onHeaderIconClick}
          ></StudentProgressHeader>

          <div>{displayProgressUI(currentHeader)}</div>
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </div>
  );
};

export default StudentProgress;
