import React, { useEffect, useState } from "react";
import { IonCol, IonGrid, IonList, IonPage, IonRow } from "@ionic/react";
import { SyntheticEvent } from "react";
import Loading from "../components/Loading";
import "../components/studentProgress/CustomAppBar.css";
import "./StudentProgress.css";
import { CONTINUE, PAGES } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import StudentProgressHeader from "../components/studentProgress/StudentProgressHeader";
import Course from "../models/course";
import User from "../models/user";
import { StudentLessonResult } from "../common/courseConstants";
import Lesson from "../models/lesson";
import { useHistory } from "react-router-dom";
import { blue, red, green } from "@mui/material/colors";
import { common } from "@mui/material/colors";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import CustomAppBar from "../components/studentProgress/CustomAppBar";
import { t } from "i18next";
import { Util } from "../utility/util";

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
  const handleBackButton = () => {
    Util.setPathToBackButton(PAGES.PARENT, history);
  };

  async function inti() {
    const currentStudent = await Util.getCurrentStudent();
    if (currentStudent) {
      setHeaderContent(["Lesson Name", "Chapter Name", "Score", "Time Spent"]);
      setCurrentStudent(currentStudent);

      const courses = await getCourses(currentStudent);
      setCourses(courses);
      if (courses.length > 0) {
        setCurrentHeader(courses[0].courseCode);
        setTabIndex(courses[0].courseCode);
        setStudentProgressHeaderIconList(
          courses.map((course) => (
            {
            displayName: 
            course.courseCode === 'maths'
              ? t(course.title) 
              : course.title,
            iconSrc: course.thumbnail ?? "assets/icons/EnglishIcon.svg",
            header: course.courseCode,
            course: course,
          }))
        );
        // console.log(courses[0].title);
      }

      const res = await api.getLessonResultsForStudent(currentStudent.docId);
      setLessonsResults(res || new Map());

      if (res && res.size > 0) {
        console.log("result...");

        await getResultsForStudentForSelectedHeader(courses[0], res);
      }

      setIsLoading(false);
    }
  }

  async function getCourses(currentStudent: User): Promise<Course[]> {
    const courses = await api.getCoursesForParentsStudent(currentStudent);
    return courses;
  }

  function displayProgressUI(selectedHeader: any) {
    return (
      <div id="student-progress-display-progress">
        <div id="student-progress-display-progress-header">
          <IonRow>
            {headerContent.map((h) => {
              return (
                <IonCol size="12" size-sm="3">
                  <p id="student-progress-display-progress-header-content">
                    {t(h)}
                  </p>
                </IonCol>
              );
            })}
          </IonRow>
        </div>
        {dataContent.length === 0 ? (
          <p id="student-progress-display-progress-no-data-message">
            {t("No Data ")}
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
        <Loading isLoading={isLoading} />
      </div>
    );
  }

  async function getResultsForStudentForSelectedHeader(
    course: Course,
    lessonsResults: Map<string, StudentLessonResult>
  ) {
    setIsLoading(true);
    console.log("Selected header ", course.title, lessonsResults);
    let isDataAvailable: boolean = false;
    let tempDataContent: string[][] = [];

    await Promise.all(
      course.chapters.map(async (chapter) => {
        await Promise.all(
          chapter.lessons.map(async (lesson) => {
            const lessonDetail = (await api.getLesson(lesson.id)) as Lesson;
            const lessonRes = await lessonsResults.get(lesson.id);

            if (lessonDetail && lessonRes) {
              isDataAvailable = true;
              const computeMinutes = Math.floor(lessonRes.timeSpent / 60);
              const result = lessonRes.timeSpent % 60;
              console.log(
                "Data ",
                lessonDetail.title,

                chapter.title,
                lessonRes.score,
                computeMinutes + ":" + result
              );
              tempDataContent.push([
                lessonDetail.title,
                chapter.title,
                Math.floor(lessonRes.score).toString(),
                computeMinutes + ":" + result,
              ]);
            }
          })
        );
      })
    );

    if (!isDataAvailable) {
      tempDataContent = [];
    }

    setDataContent(tempDataContent);
    setIsLoading(false);
  }

  const handleChange = (newValue: string) => {
    // setValue(newValue);
    setTabIndex(newValue);
    const selectedHeader = studentProgressHeaderIconList.find(
      (iconConfig) => iconConfig.displayName === newValue
    );

    if (selectedHeader) {
      setCurrentHeader(selectedHeader.header);
      getResultsForStudentForSelectedHeader(
        selectedHeader.course,
        lessonsResults
      );
    }
  };
  const [tabIndex, setTabIndex] = useState<string>("");

  useEffect(() => {
    if (studentProgressHeaderIconList.length > 0) {
      setTabIndex(studentProgressHeaderIconList[0].displayName);
    }
  }, [studentProgressHeaderIconList]);

  return (
    <div>
      <CustomAppBar
        tabNames={studentProgressHeaderIconList.map(
          (iconConfig) => iconConfig.displayName
        )}
        value={tabIndex}
        onChange={handleChange}
        handleBackButton={handleBackButton}
      />

      {tabIndex && <div>{displayProgressUI(currentHeader)}</div>}
    </div>
  );
};

export default StudentProgress;
