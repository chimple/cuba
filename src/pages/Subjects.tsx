import { useEffect, useState } from "react";

import { useHistory, useLocation } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  CONTINUE,
  CURRENT_SELECTED_COURSE,
  DISPLAY_SUBJECTS_STORE,
  GRADE_MAP,
  HOMEHEADERLIST,
  MODES,
  PAGES,
  TableTypes,
} from "../common/constants";
import "./Subjects.css";
import SelectCourse from "../components/displaySubjects/SelectCourse";
import { Util } from "../utility/util";
import { schoolUtil } from "../utility/schoolUtil";
import SkeltonLoading from "../components/SkeltonLoading";

const localData: any = {};
let localStorageData: any = {};

const Subjects: React.FC<{}> = ({}) => {
  enum STAGES {
    SUBJECTS,
    // CHAPTERS,
    // LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<TableTypes<"course">[]>();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<"course">>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<"chapter">>();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>();
  const [mode, setMode] = useState<MODES>();
  const [studentLinked, setStudentLinked] = useState<boolean>(false);
  // const [gradesMap, setGradesMap] = useState<{
  //   grades: Grade[];
  //   courses: TableTypes<"course">[];
  // }>();
  const [localGradeMap, setLocalGradeMap] = useState<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }>();
  const [currentGrade, setCurrentGrade] = useState<TableTypes<"grade">>();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const [userMode, setUserMode] = useState<boolean>(false);
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const urlParams = new URLSearchParams(location.search);
  useEffect(() => {
    init();
  }, [studentLinked]);

  const init = async () => {
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
      setCurrentChapter(localData.currentChapter);
      if (localData.lessonResultMap) {
        setLessonResultMap(localData.lessonResultMap);
      } else {
        const currentStudent = await Util.getCurrentStudent();
        if (currentStudent) {
          //loading student result cache (seems like a new user)
          const result = await api.getStudentResultInMap(currentStudent.id);
          const lessons = result;
          localData.lessonResultMap = lessons;
          setLessonResultMap(lessons);
        }
      }

      !!localData.localGradeMap && setLocalGradeMap(localData.localGradeMap);
      localStorageData.lessonResultMap = localData.lessonResultMap;
      //   localStorageData.stage = STAGES.LESSONS;
      // addDataToLocalStorage();
      //   setStage(STAGES.LESSONS);

      setIsLoading(false);
    } else if (!!urlParams.get("isReload")) {
      await getCourses();
      // let strLocalStoreData = localStorage.getItem(DISPLAY_SUBJECTS_STORE);
      // if (!!strLocalStoreData) {
      //   localStorageData = JSON.parse(strLocalStoreData);

      //   if (!!localStorageData.courses) {
      //     // let tmpCourses: TableTypes<"course">[] = Util.convertCourses(
      //     //   localStorageData.courses
      //     // );
      //     let tmpCourses: TableTypes<"course">[] = localStorageData.courses;
      //     localData.courses = tmpCourses;
      //     setCourses(tmpCourses);
      //     if (
      //       !!localStorageData.stage &&
      //       localStorageData.stage !== STAGES.SUBJECTS &&
      //       !!localStorageData.currentCourseId
      //     ) {
      //       setStage(localStorageData.stage);
      //       let cc: TableTypes<"course"> = localData.courses.find(
      //         (cour) => localStorageData.currentCourseId === cour.id
      //       );
      //       localData.currentCourse = cc;
      //       setCurrentCourse(cc);

      //       if (!!localStorageData.localGradeMap) {
      //         localData.localGradeMap = localStorageData.localGradeMap;
      //         setLocalGradeMap(localStorageData.localGradeMap);
      //       }

      //       if (!!localStorageData.currentGrade) {
      //         localData.currentGrade = localStorageData.currentGrade;
      //         setCurrentGrade(localStorageData.currentGrade);
      //       }

      //       if (!!localStorageData.currentChapterId) {
      //         let cChap: TableTypes<"chapter"> =
      //           localData.currentCourse.chapters.find(
      //             (chap) => localStorageData.currentChapterId === chap.id
      //           );
      //         localData.currentChapter = cChap;
      //         setCurrentChapter(cChap);
      //       }

      //       if (!!localStorageData.lessonResultMap) {
      //         let tmpStdMap: { [lessonDocId: string]: TableTypes<"result"> } =
      //           localStorageData.lessonResultMap;
      //         // for (const value of Object.values(tmpStdMap)) {
      //         //   if (!!value.course) value.course = Util.getRef(value.course);
      //         // }
      //         localData.lessonResultMap = tmpStdMap;
      //         setLessonResultMap(tmpStdMap);
      //       }

      //       // if (localStorageData.stage === STAGES.LESSONS) {
      //       //   getLessonsForChapter(localData.currentChapter);
      //       // } else {
      //       //   setIsLoading(false);
      //       // }
      //     } else {
      //       setIsLoading(false);
      //     }
      //   } else {
      //     await getCourses();
      //     console.log(
      //       "🚀 ~ file: Subjects.tsx:156 ~ init ~ getCourses:"
      //     );
      //   }
      // } else {
      //   await getCourses();
      //   console.log("🚀 ~ file: Subjects.tsx:161 ~ init ~ getCourses:");
      // }
    } else {
      let result = await getCourses();
      console.log("🚀 ~ file: Subjects.tsx:165 ~ init ~ getCourses:", result);
    }
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      let _localMap: {
        grades: TableTypes<"grade">[];
        courses: TableTypes<"course">[];
      } = JSON.parse(map);
      // let convertedCourses = Util.convertCourses(_localMap.courses);
      // _localMap.courses = convertedCourses;
      setLocalGradeMap(_localMap);
    }
  };

  const getCourses = async (): Promise<TableTypes<"course">[]> => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      // history.replace(PAGES.DISPLAY_STUDENT);
      history.replace(PAGES.SELECT_MODE);
      return [];
    }

    // const currClass = localStorage.getItem(CURRENT_CLASS);
    let currClass;
    const result = await api.getStudentResult(currentStudent.id, true);
    if (result) {
      currClass = schoolUtil.getCurrentClass();
    } else {
      console.log("No classes found for the student.");
    }
    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.id);
    console.log("tempResultLessonMap = res;", res);
    localData.lessonResultMap = res;
    localStorageData.lessonResultMap = res;
    setLessonResultMap(res);

    const linkedData = await api.isStudentLinked(currentStudent.id);
    if (linkedData) {
      setStudentLinked(true);
    } else setStudentLinked(false);

    const currMode = await schoolUtil.getCurrMode();
    setUserMode(
      ((currMode === MODES.PARENT) == true && !studentLinked) ?? true
    );

    const courses = await (!!currClass
      ? api.getCoursesForClassStudent(currClass.id)
      : api.getCoursesForParentsStudent(currentStudent.id));
    localData.courses = courses;
    // localStorageData.courses = courses;
    setCourses(courses);
    // addDataToLocalStorage();
    setIsLoading(false);
    return courses;
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
    localStorageData.currentGrade = localData.currentGrade;
    localData.gradesMap = gradesMap;
    localStorageData.gradesMap = localData.gradesMap;
    localData.currentCourse = course;
    localStorageData.currentCourseId = course.id;
    setCurrentGrade(currentGrade ?? gradesMap.grades[0]);
    setLocalGradeMap(gradesMap);
    setCurrentCourse(course);
    localStorage.setItem(CURRENT_SELECTED_COURSE, JSON.stringify(course));
    // localStorageData.stage = STAGES.CHAPTERS;
    // addDataToLocalStorage();
    const params = `courseDocId=${course.id}`;
    // history.replace(PAGES.DISPLAY_CHAPTERS + params);
    if (urlParams.get(CONTINUE)) {
      history.replace(
        PAGES.DISPLAY_CHAPTERS + `?${CONTINUE}=true` + "&" + params
      );
    } else {
      history.replace(PAGES.DISPLAY_CHAPTERS + "?" + params);
    }
  };

  // function addDataToLocalStorage() {
  //   localStorage.setItem(
  //     DISPLAY_SUBJECTS_STORE,
  //     JSON.stringify(localStorageData)
  //   );
  // }

  return (
    <div id="display-subjects-page" style={{ height: "100vh" }}>
      <SkeltonLoading isLoading={isLoading} header={HOMEHEADERLIST.SUBJECTS} />
      <div className="subjects-content">
        {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <SelectCourse
              courses={courses}
              modeParent={userMode}
              onCourseChange={onCourseChanges}
            />
          )}
      </div>
    </div>
  );
};
export default Subjects;
