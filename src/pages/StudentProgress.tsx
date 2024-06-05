import React, { useEffect, useState } from "react";
import { IonCol, IonRow } from "@ionic/react";
import "../components/studentProgress/CustomAppBar.css";
import "./StudentProgress.css";
import { PAGES, TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router-dom";
import CustomAppBar from "../components/studentProgress/CustomAppBar";
import { t } from "i18next";
import { Util } from "../utility/util";
import SkeltonLoading from "../components/SkeltonLoading";

const StudentProgress: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [studentProgressHeaderIconList, setStudentProgressHeaderIconList] =
    useState<HeaderIconConfig[]>([]);
  const [headerContent, setHeaderContent] = useState<string[]>([]);
  const [dataContent, setDataContent] = useState<string[][]>([]);
  const [currentStudent, setCurrentStudent] = useState<TableTypes<"user">>();
  const [courses, setCourses] = useState<TableTypes<"course">[]>([]);
  const [lessonsResults, setLessonsResults] = useState<Map<string, string>>();
  const [tabs, setTabs] = useState<{ [key: string]: string }>({});
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  useEffect(() => {
    setIsLoading(true);
    init();
  }, []);

  interface HeaderIconConfig {
    courseId: string;
    displayName: string;
    iconSrc: string;
    header: any;
    course: TableTypes<"course">;
  }
  const handleBackButton = () => {
    Util.setPathToBackButton(PAGES.PARENT, history);
  };

  async function init() {
    const currentStudent = await Util.getCurrentStudent();
    if (currentStudent) {
      setHeaderContent(["Lesson Name", "Chapter Name", "Score", "Time Spent"]);
      setCurrentStudent(currentStudent);
      const courses = await getCourses(currentStudent);
      setCourses(courses);
      if (courses.length > 0) {
        setCurrentHeader(courses[0].code);
        setTabIndex(courses[0].code ?? "");
        setStudentProgressHeaderIconList(
          courses.map((course) => ({
            courseId: course.id,
            displayName: t(course.name),
            iconSrc: course.image ?? "assets/icons/EnglishIcon.svg",
            header: course.code,
            course: course,
          }))
        );
      }

      const res = await api.getStudentProgress(currentStudent.id);

      if (res) {
        setLessonsResults(res);

        await getResultsForStudentForSelectedHeader(courses[0].id, res);
      }

      setIsLoading(false);
    }
  }

  async function getCourses(
    currentStudent: TableTypes<"user">
  ): Promise<TableTypes<"course">[]> {
    const courses = await api.getCoursesForParentsStudent(currentStudent.id);
    return courses;
  }

  function displayProgressUI(selectedHeader: any) {
    return (
      <div id="student-progress-display-progress">
        <div id="student-progress-display-progress-header">
          <IonRow>
            {headerContent.map((h) => (
              <IonCol key={h} size="12" size-sm="3">
                <p id="student-progress-display-progress-header-content">
                  {t(h)}
                </p>
              </IonCol>
            ))}
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
            {dataContent.map((e, rowIndex) => (
              <IonRow key={rowIndex}>
                {e.map((d, cellIndex) => (
                  <IonCol key={cellIndex} size="12" size-sm="3">
                    <p id="student-progress-display-progress-content-text">
                      {d}
                    </p>
                  </IonCol>
                ))}
              </IonRow>
            ))}
          </div>
        )}
      </div>
    );
  }

  async function getResultsForStudentForSelectedHeader(
    selectedCourseId: string,
    lessonsResults: Map<string, string>
  ) {
    setIsLoading(true);
    let isDataAvailable: boolean = false;
    let tempDataContent: string[][] = [];
    if (lessonsResults) {
      const lessonResultsForCourse = lessonsResults[selectedCourseId];
      if (lessonResultsForCourse) {
        isDataAvailable = true;
        lessonResultsForCourse.forEach((result) => {
          const computeMinutes = Math.floor(result.time_spent / 60);
          const computeSeconds = result.time_spent % 60;
          tempDataContent.push([
            result.lesson_name,
            result.chapter_name,
            Math.floor(result.score).toString(),
            `${computeMinutes}:${computeSeconds}`,
          ]);
        });
      }
    }

    setDataContent(isDataAvailable ? tempDataContent : []);
    setIsLoading(false);
  }

  const handleChange = (newValue: string) => {
    setTabIndex(newValue);
    const selectedHeader = studentProgressHeaderIconList.find(
      (iconConfig) => iconConfig.courseId === newValue
    );

    if (selectedHeader && lessonsResults) {
      setCurrentHeader(selectedHeader.header);
      getResultsForStudentForSelectedHeader(
        selectedHeader.courseId,
        lessonsResults
      );
    }
  };
  const [tabIndex, setTabIndex] = useState<string>("");

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
        tabs={tabs}
        value={tabIndex}
        onChange={handleChange}
        handleBackButton={handleBackButton}
      />

      {tabIndex && <div>{displayProgressUI(currentHeader)}</div>}
    </div>
  );
};

export default StudentProgress;
