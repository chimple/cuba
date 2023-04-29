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
      console.log("User ", currentStudent);
      setCurrentStudent(currentStudent);

      const courses = await getCourses();
      setCourses(courses);
      console.log("courses ", courses);

      let tempStudentProgressHeaderIconList: HeaderIconConfig[] = [];

      for (let i = 0; i < courses.length; i++) {
        tempStudentProgressHeaderIconList.push({
          displayName: courses[i].title,
          iconSrc: courses[i].thumbnail ?? "assets/icons/EnglishIcon.svg",
          header: courses[i].courseCode,
          course: courses[i],
        });

        setCurrentHeader(courses[0].courseCode);
        getResultsForStudentForSelectedHeader(
          courses[0].courseCode,
          currentStudent.docId,
          courses[0]
        );
      }
      setStudentProgressHeaderIconList(tempStudentProgressHeaderIconList);

      setLessonsResults(
        (await api.getLessonResultsForStudent(currentStudent.docId)) ||
          new Map()
      );
      setHeaderContent(["Lesson Name", "Chapter Name", "Score", "Time Spent"]);

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
            currentStudent.docId,
            selectedHeader,
            studentProgressHeaderIconList[i].course
          );
          console.log("setIsLoading(false);", isLoading);
          return;
        }
      }
    }
  }

  async function getResultsForStudentForSelectedHeader(
    studentId: string,
    selectedHeader: any,
    course: Course
  ) {
    setIsLoading(true);
    console.log("Selected header ", course.title, lessonsResults);
    let isDataAvailable: boolean = false;
    let tempDataContent: string[][] = [];
    await course.chapters.forEach(async (chapter) => {
      await chapter.lessons.forEach(async (lesson) => {
        if (lessonsResults) {
          const lessonRes = lessonsResults?.get(lesson.id);
          const lessonDetail = (await api.getLesson(lesson.id)) as Lesson;

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
        }
      });
    });

    // return isDataAvailable ? tempDataContent : [];

    if (isDataAvailable) {
      setDataContent([]);
      setIsLoading(false);
    }
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
    console.log("dataContent ", dataContent);
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
