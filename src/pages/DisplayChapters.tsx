import { FC, useEffect, useState } from "react";
import { Chapter, StudentLessonResult } from "../common/courseConstants";
import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CONTINUE,
  CURRENT_CLASS,
  CURRENT_MODE,
  CURRENT_SELECTED_CHAPTER,
  CURRENT_SELECTED_COURSE,
  CURRENT_SELECTED_GRADE,
  CURRENT_STAGE,
  DISPLAY_SUBJECTS_STORE,
  GRADE_MAP,
  MODES,
  PAGES,
  TableTypes,
} from "../common/constants";
import { IonIcon, IonItem, IonList, IonPage } from "@ionic/react";
import { chevronBackCircleSharp } from "ionicons/icons";
import "./DisplayChapters.css";
import { t } from "i18next";
import SelectCourse from "../components/displaySubjects/SelectCourse";
import Loading from "../components/Loading";
import SelectChapter from "../components/displaySubjects/SelectChapter";
import LessonSlider from "../components/LessonSlider";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import DropDown from "../components/DropDown";
import { Timestamp } from "firebase/firestore";
import SkeltonLoading from "../components/SkeltonLoading";

const localData: any = {};
// let localStorageData: any = {};
const DisplayChapters: FC<{}> = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<TableTypes<"course">[]>();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<"course">>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<"chapter">>();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>();
  const [chapters, setChapters] = useState<TableTypes<"chapter">[]>([]);

  // const [gradesMap, setGradesMap] = useState<{
  //   grades: TableTypes<"grade">[];
  //   courses: Course[];
  // }>();
  const [localGradeMap, setLocalGradeMap] = useState<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }>();
  const [currentGrade, setCurrentGrade] = useState<TableTypes<"grade">>();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

  const searchParams = new URLSearchParams(location.search);
  const courseDocId = searchParams.get("courseDocId");
  const getCourseByUrl = localGradeMap?.courses.find(
    (course) => courseDocId == course.id
  );
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (getCourseByUrl && !currentCourse) {
      //as url params change(course.id) and currentCourse empty they we are using this
      onCourseChanges(getCourseByUrl);
    }

    if (!localGradeMap || !localGradeMap.grades) {
      if (currentCourse) {
        setIsLoading(true);
        const getLocalGradeMap = async () => {
          const { grades } =
            await api.getDifferentGradesForCourse(currentCourse);
          localData.gradesMap = { grades, courses: [currentCourse] };
          // addDataToLocalStorage();
          setLocalGradeMap({ grades, courses: [currentCourse] });
          setIsLoading(false);
        };
        getLocalGradeMap();
      }
    }

    console.log("chapters", currentCourse);
    console.log("local grade map", localGradeMap);
  }, [getCourseByUrl, localGradeMap, currentCourse]);

  const init = async () => {
    const urlParams = new URLSearchParams(location.search);
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:47 ~ init ~ urlParams:",
      urlParams.get(CONTINUE)
    );
    console.log(
      "🚀 ~ file: DisplaySubjects.tsx:68 ~ init ~ localData:",
      localData
    );
    if (
      !!urlParams.get(CONTINUE) &&
      !!localData.currentCourse &&
      !!localData.currentGrade &&
      !!localData.currentChapter
    ) {
      setCourses(localData.courses);
      setLessons(localData.lessons);
      setCurrentGrade(localData.currentGrade);
      setCurrentCourse(localData.currentCourse);
      const chapters = await api.getChaptersForCourse(
        localData.currentCourse.id
      );
      setChapters(chapters);
      setCurrentChapter(localData.currentChapter);
      if (localData.lessonResultMap) {
        setLessonResultMap(localData.lessonResultMap);
      } else {
        const currentStudent = Util.getCurrentStudent();
        if (currentStudent) {
          //loading student result cache (seems like a new user)
          const result = await api.getStudentResultInMap(currentStudent.id);
          const lessons = result;
          localData.lessonResultMap = lessons;
          setLessonResultMap(lessons);
        }
      }

      !!localData.localGradeMap && setLocalGradeMap(localData.localGradeMap);
      setStage(STAGES.LESSONS);
      // localStorage.setItem("stage", JSON.stringify(STAGES.LESSONS));
      addStateTolocalStorage(STAGES.LESSONS);
      setIsLoading(false);
    } else if (!!urlParams.get("isReload")) {
      await getCourses();
      setIsLoading(true);
      const currentSelectedCourse = localStorage.getItem(
        CURRENT_SELECTED_COURSE
      );

      if (currentSelectedCourse) {
        const currentCourse = JSON.parse(currentSelectedCourse);
        setCurrentCourse(currentCourse);
        const chapters = await api.getChaptersForCourse(currentCourse.id);
        setChapters(chapters);
        const currentSelectedChapter = localStorage.getItem(
          CURRENT_SELECTED_CHAPTER
        );
        if (currentSelectedChapter) {
          let currentChapter = JSON.parse(currentSelectedChapter);
          setCurrentChapter(currentChapter);
          const lesson = await getLessonsForChapter(currentChapter);
          setLessons(lesson);
        } else setCurrentChapter(undefined);

        const stage = localStorage.getItem(CURRENT_STAGE);
        if (stage) {
          setStage(JSON.parse(stage));
        }
        const grade = localStorage.getItem(CURRENT_SELECTED_GRADE);
        if (grade) {
          setCurrentGrade(JSON.parse(grade));
        }
      } else {
        setCourses(undefined);
      }
    } else {
      console.warn("Course not found in local data.");
    }
    setIsLoading(false);
    getLocalGradeMap();
  };

  function getLocalGradeMap():
    | {
        grades: TableTypes<"grade">[];
        courses: TableTypes<"course">[];
      }
    | undefined {
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      let _localMap: {
        grades: TableTypes<"grade">[];
        courses: TableTypes<"course">[];
      } = JSON.parse(map);
      let convertedCourses = _localMap.courses;
      _localMap.courses = convertedCourses;
      setLocalGradeMap(_localMap);
      return _localMap;
    }
  }

  // function addDataToLocalStorage() {
  //   localStorage.setItem(
  //     DISPLAY_SUBJECTS_STORE,
  //     JSON.stringify(localStorageData)
  //   );
  // }

  const getCourses = async (): Promise<TableTypes<"course">[]> => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      // history.replace(PAGES.DISPLAY_STUDENT);
      history.replace(PAGES.SELECT_MODE);
      return [];
    }

    // const currClass = localStorage.getItem(CURRENT_CLASS);
    const currClass = schoolUtil.getCurrentClass();
    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.id);
    console.log("tempResultLessonMap = res;", res);
    localData.lessonResultMap = res;

    setLessonResultMap(res);

    const currMode = await schoolUtil.getCurrMode();

    const courses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass.id)
      : api.getCoursesForParentsStudent(currentStudent.id));
    localData.courses = courses;

    setCourses(courses);
    // addDataToLocalStorage();
    setIsLoading(false);
    return courses;
  };

  const getLessonsForChapter = async (
    chapter: TableTypes<"chapter">
  ): Promise<TableTypes<"lesson">[]> => {
    setIsLoading(true);

    if (!chapter) {
      setIsLoading(false);
      return [];
    }

    try {
      const lessons = await api.getLessonsForChapter(chapter.id);
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

  const onBackButton = () => {
    switch (stage) {
      // case STAGES.SUBJECTS:
      //   localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
      //   history.replace(PAGES.HOME);
      //   break;
      case STAGES.CHAPTERS:
        delete localData.currentChapter;
        // delete localStorageData.currentChapterId;
        setCurrentChapter(undefined);
        // addDataToLocalStorage();
        localStorage.removeItem(CURRENT_SELECTED_COURSE);
        localStorage.removeItem(DISPLAY_SUBJECTS_STORE);
        Util.setPathToBackButton(PAGES.HOME, history);
        break;
      case STAGES.LESSONS:
        delete localData.lessons;
        setLessons(undefined);
        setStage(STAGES.CHAPTERS);
        addStateTolocalStorage(STAGES.CHAPTERS);
        localStorage.removeItem(CURRENT_SELECTED_CHAPTER);

        break;
      default:
        break;
    }
  };

  const onCourseChanges = async (course: TableTypes<"course">) => {
    const gradesMap: {
      grades: TableTypes<"grade">[];
      courses: TableTypes<"course">[];
    } = await api.getDifferentGradesForCourse(course);
    const currentGrade = gradesMap.grades.find(
      (grade) => grade.id === course.grade_id
    );
    localStorage.setItem(GRADE_MAP, JSON.stringify(gradesMap));
    localData.currentGrade = currentGrade ?? gradesMap.grades[0];

    localData.gradesMap = gradesMap;

    localData.currentCourse = course;

    setCurrentGrade(currentGrade ?? gradesMap.grades[0]);
    addGradeToLocalStorage(currentGrade ?? gradesMap.grades[0]);
    setLocalGradeMap(gradesMap);
    const chapters = await api.getChaptersForCourse(course.id);
    setChapters(chapters);
    setCurrentCourse(course);
    localStorage.setItem(CURRENT_SELECTED_COURSE, JSON.stringify(course));
    addStateTolocalStorage(STAGES.CHAPTERS);
    setStage(STAGES.CHAPTERS);
  };

  const onGradeChanges = async (grade: TableTypes<"grade">) => {
    let _localMap = getLocalGradeMap();
    const currentCourse = _localMap?.courses.find(
      (course) => course.grade_id === grade.id
    );
    localData.currentGrade = grade;
    setCurrentGrade(grade);
    addGradeToLocalStorage(grade);
    const chapters = await api.getChaptersForCourse(currentCourse?.id ?? "");
    setChapters(chapters);
    setCurrentCourse(currentCourse);
    localStorage.setItem(
      CURRENT_SELECTED_COURSE,
      JSON.stringify(currentCourse)
    );
    localData.currentCourse = currentCourse;
  };

  const onChapterChange = async (chapter: TableTypes<"chapter">) => {
    await getLessonsForChapter(chapter);
    localData.currentChapter = chapter;

    setCurrentChapter(chapter);
    localStorage.setItem(CURRENT_SELECTED_CHAPTER, JSON.stringify(chapter));

    setStage(STAGES.LESSONS);
    addStateTolocalStorage(STAGES.LESSONS);
  };

  function getLastPlayedLessonIndex() {
    let lastPlayedLessonDate: Date;
    let startIndex = 0;
    if (!!lessonResultMap)
      lessons?.forEach((less: TableTypes<"lesson">, i: number) => {
        const studentResultOfLess = lessonResultMap[less.id];
        if (!!studentResultOfLess) {
          if (!lastPlayedLessonDate) {
            lastPlayedLessonDate = lessonResultMap[less.id].updated_at
              ? new Date(lessonResultMap[less.id].updated_at ?? "")
              : new Date();
            startIndex = i;
          } else {
            if (
              new Date(lessonResultMap[less.id].updated_at ?? "") >
              lastPlayedLessonDate
            ) {
              lastPlayedLessonDate = new Date(
                studentResultOfLess.updated_at ?? ""
              );
              startIndex = i;
            }
          }
        }
      });

    return startIndex;
  }
  function addStateTolocalStorage(stage: STAGES) {
    localStorage.setItem(CURRENT_STAGE, JSON.stringify(stage));
  }
  function addGradeToLocalStorage(grade: TableTypes<"grade">) {
    localStorage.setItem(CURRENT_SELECTED_GRADE, JSON.stringify(grade));
  }

  return !isLoading ? (
    <IonPage id="display-chapters-page">
      <div className="chapters-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        <div className="chapter-header">
          <IonItem lines="none">
            <div className="chapter-name">
              {stage === STAGES.CHAPTERS
                ? currentCourse
                  ? t(currentCourse?.name)
                  : ""
                : currentChapter
                  ? t(currentChapter.name ?? "")
                  : ""}
            </div>
          </IonItem>
        </div>

        {localGradeMap && currentGrade && stage === STAGES.CHAPTERS && (
          <DropDown
            currentValue={currentGrade?.id}
            optionList={localGradeMap.grades.map((grade) => ({
              displayName: grade.name,
              id: grade.id,
            }))}
            placeholder=""
            onValueChange={(evt) => {
              {
                const tempGrade = localGradeMap.grades.find(
                  (grade) => grade.id === evt
                );
                onGradeChanges(tempGrade ?? currentGrade);
              }
            }}
            width="15vw"
          />
        )}
        {stage !== STAGES.CHAPTERS && <div className="button-right" />}
      </div>
      <div className="chapters-content">
        {/* {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <SelectCourse courses={courses} onCourseChange={onCourseChanges} />
          )} */}

        {stage === STAGES.CHAPTERS &&
          currentCourse &&
          localGradeMap &&
          currentGrade && (
            <div>
              <SelectChapter
                chapters={chapters}
                onChapterChange={onChapterChange}
                currentGrade={currentGrade}
                grades={!!localGradeMap ? localGradeMap.grades : localGradeMap}
                onGradeChange={onGradeChanges}
                course={currentCourse}
                currentChapterId={currentChapter?.id}
              />
            </div>
          )}
      </div>
      {stage === STAGES.LESSONS && lessons && (
        <div className="slider-container">
          <LessonSlider
            lessonData={lessons}
            isHome={true}
            course={currentCourse!}
            lessonsScoreMap={lessonResultMap || {}}
            startIndex={getLastPlayedLessonIndex()}
            showSubjectName={false}
            showChapterName={false}
            chapter={currentChapter}
          />
        </div>
      )}
    </IonPage>
  ) : (
    <SkeltonLoading
      isLoading={isLoading}
      header={PAGES.DISPLAY_CHAPTERS}
      isChapter={stage == STAGES.CHAPTERS ? false : true}
    />
  );
};
export default DisplayChapters;
