import React, { useEffect, useState } from "react";
import { IonCol, IonRow } from "@ionic/react";
import "../components/studentProgress/CustomAppBar.css";
import "./StudentProgress.css";
import { PAGES } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router-dom";
import CustomAppBar from "../components/studentProgress/CustomAppBar";
import { t } from "i18next";
import { Util } from "../utility/util";
import SkeltonLoading from "../components/SkeltonLoading";
import { DocumentData, DocumentReference, getDoc } from "firebase/firestore";
import { StudentLessonResult } from "../common/courseConstants";
import Lesson from "../models/lesson";
import User from "../models/user";
import Course from "../models/course";

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
  const [tabs, setTabs] = useState<{ [key: string]: React.ReactNode }>({});
  const [tabIndex, setTabIndex] = useState<string>("");

  useEffect(() => {
    setIsLoading(true);
    inti();
  }, []);

  interface HeaderIconConfig {
    courseId: string;
    displayName: React.ReactNode;
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
        const updatedHeaderIconList = await Promise.all(
          courses.map(async (course) => {
            const gradeDoc = (await getDoc(course.grade)).data();
            const curriculumDoc = (await getDoc(course.curriculum)).data();
            return {
              courseId: course.docId,
              displayName: (
                <div className="course-detail-div">
                  <div className="course-text">{t(course.title)}</div>
                  {gradeDoc && (
                    <div className="grade-text">{t(gradeDoc.title)}</div>
                  )}
                  {curriculumDoc && (
                    <div className="curriculum-text">
                      {t(curriculumDoc.title)}
                    </div>
                  )}
                </div>
              ),
              iconSrc: course.thumbnail ?? "assets/icons/EnglishIcon.svg",
              header: course.courseCode,
              course: course,
            };
          })
        );

        setStudentProgressHeaderIconList(updatedHeaderIconList);
        setCurrentHeader(updatedHeaderIconList[0].header);
        setTabIndex(updatedHeaderIconList[0].courseId);
      }

      const res = await api.getLessonResultsForStudent(currentStudent.docId);
      setLessonsResults(res || new Map());

      if (res && res.size > 0) {
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
        {!!isLoading && (
          <SkeltonLoading
            isLoading={isLoading}
            header={PAGES.STUDENT_PROGRESS}
          />
        )}
        {!isLoading && dataContent.length === 0 ? (
          <p id="student-progress-display-progress-no-data-message">
            {t("No Data ")}
          </p>
        ) : null}
        {!isLoading && dataContent.length > 0 && (
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
        )}
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
    setTabIndex(newValue);
    const selectedHeader = studentProgressHeaderIconList.find(
      (iconConfig) => iconConfig.courseId === newValue
    );

    if (selectedHeader) {
      setCurrentHeader(selectedHeader.header);
      getResultsForStudentForSelectedHeader(
        selectedHeader.course,
        lessonsResults
      );
    }
  };

  useEffect(() => {
    if (studentProgressHeaderIconList.length > 0) {
      setTabIndex(studentProgressHeaderIconList[0].courseId);
    }
    const newTabs = {};
    studentProgressHeaderIconList.forEach((iconConfig) => {
      newTabs[iconConfig.courseId] = iconConfig.displayName;
    });
    setTabs(newTabs);
  }, [studentProgressHeaderIconList]);

  return (
    <div>
      <CustomAppBar
        tabNames={tabs}
        value={tabIndex}
        onChange={handleChange}
        handleBackButton={handleBackButton}
      />

      {tabIndex && <div>{displayProgressUI(currentHeader)}</div>}
    </div>
  );
};

export default StudentProgress;
