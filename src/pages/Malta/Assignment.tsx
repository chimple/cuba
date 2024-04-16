import * as React from "react";
import { FC, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { IonPage } from "@ionic/react";
import Loading from "../../components/Loading";
import BackButton from "../../components/common/BackButton";
import { t } from "i18next";
import NextButton from "../../components/common/NextButton";
import { DISPLAY_SUBJECTS_STORE, MODES, PAGES } from "../../common/constants";
import "../DisplaySubjects.css";
import "../DisplayChapters.css";
import "./Assignment.css";
import "../../components/Malta/DisplayLesson.css";
import ChapterBar from "../../components/ChapterBar";
import ChapterDropDown from "../../components/ChapterDropDown";
import { Chapter } from "../../common/courseConstants";
import CourseChapterDropDown from "../../components/Malta/CourseChapterDropDown";
import { schoolUtil } from "../../utility/schoolUtil";
import { Util } from "../../utility/util";
import Course from "../../models/course";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import { ServiceConfig } from "../../services/ServiceConfig";
import Grade from "../../models/grade";
import { StudentLessonResult } from "../../common/courseConstants";
import Class from "../../models/class";
import Lesson from "../../models/lesson";
import DisplayLesson from "../../components/Malta/DisplayLesson";
import { AppBar, Button, IconButton, Toolbar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RecommendedAssignment from "../../components/Malta/RecommendedAssignment";
import AssignButton from "../../components/Malta/AssignButton";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const localData: any = {};
let localStorageData: any = {};

const Assignment: React.FC = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }

  const [value, setValue] = React.useState(0);
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>();
  const [currentCourse, setCurrentCourse] = useState<Course>();
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessons, setLessons] = useState<Lesson[]>();
  const [liveQuizLessons, setLiveQuizLessons] = useState<Lesson[]>();
  const [mode, setMode] = useState<MODES>();
  const [isNotConnectedToClass, setIsNotConnectedToClass] =
    useState<boolean>(false);
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
  const [userMode, setUserMode] = useState<boolean>(false);
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const urlParams = new URLSearchParams(location.search);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    getCourses();
    console.log("********", courses);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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

    const currMode = await schoolUtil.getCurrMode();

    const courses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    localData.courses = courses;
    localStorageData.courses = courses;
    setCourses(courses);
    addDataToLocalStorage();
    setIsLoading(false);
    console.log("********", courses);
    getLessonsForChapter(courses![5].chapters[6]);
    getLiveQuizLessons(courses![12].chapters[5]);
    return courses;
  };

  const getLessonsForChapter = async (chapter: Chapter): Promise<Lesson[]> => {
    setIsLoading(true);

    if (!chapter) {
      setIsLoading(false);
      return [];
    }

    try {
      const lessons = await api.getLessonsForChapter(chapter);
      // Retrieve existing data from local storage
      localData.lessons = lessons;
      setLessons(lessons);
      setIsLoading(false);
      return lessons;
    } catch (error) {
      // Handle errors
      console.error("Error fetching lessons:", error);
      setIsLoading(false);
      return [];
    }
  };

  const getLiveQuizLessons = async (chapter: Chapter): Promise<Lesson[]> => {
    setIsLoading(true);

    if (!chapter) {
      setIsLoading(false);
      return [];
    }

    try {
      const lessons = await api.getLessonsForChapter(chapter);
      // Retrieve existing data from local storage
      localData.lessons = lessons;
      setLiveQuizLessons(lessons);
      setIsLoading(false);
      return lessons;
    } catch (error) {
      // Handle errors
      console.error("Error fetching lessons:", error);
      setIsLoading(false);
      return [];
    }
  };

  function addDataToLocalStorage() {
    localStorage.setItem(
      DISPLAY_SUBJECTS_STORE,
      JSON.stringify(localStorageData)
    );
  }

  const onBackButton = () => {
    switch (stage) {
      case STAGES.SUBJECTS:
        localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        history.replace(PAGES.HOME);
        break;
      default:
        break;
    }
  };
  const chaptersArray = [];
  const onChapterChange = () => {};
  const onCourseChange = () => {};
  const onLessonSelect = () => {};
  return (
    <IonPage id="display-subjects-page">
      <Box>
        <AppBar position="static">
          <Toolbar>
            <IconButton aria-label="close" onClick={onBackButton}>
              <CloseIcon />
            </IconButton>
            <div>Assignment</div>
          </Toolbar>
        </AppBar>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            style={{ height: "8vh" }}
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              "& .MuiTab-root": {
                color: "black",
                borderRadius: "5vh",
                padding: "0 3vw",
                margin: "0.5vh 0.5vh",
                minHeight: "37px",
                textTransform: "none",
              },
              "& .Mui-selected": {
                backgroundColor: "white",
                borderRadius: "2vh",
                color: "black",
                minHeight: "37px",
                textTransform: "none",
              },
            }}
          >
            <Tab label={t("Recommended")} {...a11yProps(0)} />
            <Tab label={t("Assignment")} {...a11yProps(1)} />
            <Tab label={t("Live Quiz")} {...a11yProps(2)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={value} index={0}>
          <div className="lessons-content">
            {stage === STAGES.SUBJECTS && lessons && (
              <div>
                <RecommendedAssignment />
              </div>
            )}
          </div>
          <div id="assign-button">
            <AssignButton disabled={false} onClicked={() => {}} />
          </div>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={1}>
          {!isLoading &&
            stage === STAGES.SUBJECTS &&
            courses &&
            courses.length > 0 && (
              <CourseChapterDropDown
                courses={courses!}
                currentCourse={courses![5]}
                onCourseChange={onCourseChange}
                chapters={courses![5].chapters}
                currentChapter={courses![5].chapters[6]}
                onChapterChange={onChapterChange}
              />
            )}
          <div className="lessons-content">
            {stage === STAGES.SUBJECTS && lessons && (
              <div>
                <DisplayLesson
                  lessons={lessons!}
                  onLessonSelect={onLessonSelect}
                  currentChapterId={courses![0].chapters[0].id}
                />
              </div>
            )}
          </div>
          <div id="assign-button">
            <AssignButton disabled={false} onClicked={() => {}} />
          </div>
        </CustomTabPanel>

        <CustomTabPanel value={value} index={2}>
          {!isLoading &&
            stage === STAGES.SUBJECTS &&
            courses &&
            courses.length > 0 && (
              <CourseChapterDropDown
                courses={courses!}
                currentCourse={courses![12]}
                onCourseChange={onCourseChange}
                chapters={courses![12].chapters}
                currentChapter={courses![12].chapters[5]}
                onChapterChange={onChapterChange}
              />
            )}
          <div className="lessons-content">
            {stage === STAGES.SUBJECTS && lessons && (
              <div>
                <DisplayLesson
                  lessons={liveQuizLessons!}
                  onLessonSelect={onLessonSelect}
                  currentChapterId={courses![12].chapters[5].id}
                />
              </div>
            )}
          </div>
          <div id="assign-button">
            <AssignButton disabled={false} onClicked={() => {}} />
          </div>
        </CustomTabPanel>
      </Box>
    </IonPage>
  );
};
export default Assignment;
