//@ts-nocheck
import React, { useEffect, useState } from "react";
import { IonCol, IonRow } from "@ionic/react";
import "../components/studentProgress/CustomAppBar.css";
import "./StudentProgress.css";
import { PAGES, TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import Lesson from "../models/lesson";
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
  const [lessonsResults, setLessonsResults] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>({});
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
    course: TableTypes<"course">;
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
        setCurrentHeader(courses[0].code);
        setTabIndex(courses[0].code ?? "");
        setStudentProgressHeaderIconList(
          courses.map((course) => ({
            displayName: t(course.name),
            iconSrc: course.image ?? "assets/icons/EnglishIcon.svg",
            header: course.code,
            course: course,
          }))
        );
        // console.log(courses[0].title);
      }

      const res = await api.getStudentResultInMap(currentStudent.id);
      setLessonsResults(res || {});

      if (res && res.size > 0) {
        console.log("result...");

        await getResultsForStudentForSelectedHeader(courses[0], res);
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
    course: TableTypes<"course">,
    lessonsResults: Map<string, TableTypes<"result">>
  ) {
    setIsLoading(true);
    console.log("Selected header ", course.name, lessonsResults);
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
