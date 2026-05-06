import { useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  CONTINUE,
  COURSES,
  CURRENT_SELECTED_COURSE,
  DEFAULT_LANGUAGE_ID_EN,
  GRADE_MAP,
  HOMEHEADERLIST,
  LANGUAGE,
  MODES,
  PAGES,
  TableTypes,
} from '../common/constants';
import './Subjects.css';
import SelectCourse from '../components/displaySubjects/SelectCourse';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import SkeltonLoading from '../components/SkeltonLoading';

const localData: any = {};
let localStorageData: any = {};
const LANGUAGE_VARIANT_PATTERN = /^(.+?)-([a-z]{2,3})$/i;

const normalizeCourseToken = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

const getCourseCodeBase = (course?: TableTypes<'course'>) => {
  const normalizedCode = normalizeCourseToken(course?.code);
  const matches = normalizedCode.match(LANGUAGE_VARIANT_PATTERN);
  return matches?.[1] ?? normalizedCode;
};

const isLanguageMatchedCourse = (
  course: TableTypes<'course'>,
  languageCode: string,
) => {
  const normalizedCode = normalizeCourseToken(course.code);
  const normalizedName = normalizeCourseToken(course.name);
  const normalizedLanguageCode = normalizeCourseToken(languageCode);

  if (!normalizedLanguageCode) return false;

  return (
    normalizedCode === normalizedLanguageCode ||
    normalizedCode.endsWith(`-${normalizedLanguageCode}`) ||
    normalizedName === normalizedLanguageCode ||
    normalizedName.endsWith(`-${normalizedLanguageCode}`)
  );
};

const Subjects: React.FC<{}> = ({}) => {
  enum STAGES {
    SUBJECTS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<TableTypes<'course'>[]>();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<'course'>>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<'chapter'>>();
  const [currentClass, setCurrentClass] = useState<TableTypes<'class'>>();
  const [lessons, setLessons] = useState<TableTypes<'lesson'>[]>();
  const [mode, setMode] = useState<MODES>();
  const [studentLinked, setStudentLinked] = useState<boolean>(false);

  const [localGradeMap, setLocalGradeMap] = useState<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }>();
  const [currentGrade, setCurrentGrade] = useState<TableTypes<'grade'>>();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<'result'>;
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

      setIsLoading(false);
    } else if (!!urlParams.get('isReload')) {
      await getCourses();
    } else {
      let result = await getCourses();
    }
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      let _localMap: {
        grades: TableTypes<'grade'>[];
        courses: TableTypes<'course'>[];
      } = JSON.parse(map);

      setLocalGradeMap(_localMap);
    }
  };

  const getCourses = async (): Promise<TableTypes<'course'>[]> => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      history.replace(PAGES.SELECT_MODE);
      return [];
    }

    let currClass;

    const linkedData = await api.isStudentLinked(currentStudent.id);
    setStudentLinked(!!linkedData);

    if (linkedData) {
      currClass = schoolUtil.getCurrentClass();
    }

    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.id);
    localData.lessonResultMap = res;
    localStorageData.lessonResultMap = res;
    setLessonResultMap(res);

    const currMode = await schoolUtil.getCurrMode();

    setUserMode(((currMode === MODES.PARENT) == true && !linkedData) ?? true);

    const courses = await (!!currClass
      ? api.getCoursesForClassStudent(currClass.id)
      : api.getCoursesForParentsStudent(currentStudent.id));
    localData.courses = courses;

    setCourses(courses);

    setIsLoading(false);
    return courses;
  };

  const getActiveStudentLanguageCode = async (): Promise<string> => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent?.id) {
      return (
        normalizeCourseToken(localStorage.getItem(LANGUAGE)) || COURSES.ENGLISH
      );
    }

    try {
      const activeStudent =
        (await api.getUserByDocId(currentStudent.id)) ?? currentStudent;

      if (
        !activeStudent.language_id ||
        activeStudent.language_id === DEFAULT_LANGUAGE_ID_EN
      ) {
        return (
          normalizeCourseToken(localStorage.getItem(LANGUAGE)) ||
          COURSES.ENGLISH
        );
      }

      const language = await api.getLanguageWithId(activeStudent.language_id);
      return (
        normalizeCourseToken(language?.code) ||
        normalizeCourseToken(localStorage.getItem(LANGUAGE)) ||
        COURSES.ENGLISH
      );
    } catch {
      return (
        normalizeCourseToken(localStorage.getItem(LANGUAGE)) || COURSES.ENGLISH
      );
    }
  };

  const resolvePreferredCourse = async (
    course: TableTypes<'course'>,
    gradesMap: {
      grades: TableTypes<'grade'>[];
      courses: TableTypes<'course'>[];
    },
  ) => {
    const candidates = gradesMap.courses.filter(
      (_course) =>
        _course.grade_id === course.grade_id &&
        _course.subject_id === course.subject_id &&
        _course.curriculum_id === course.curriculum_id &&
        (course.framework_id
          ? _course.framework_id === course.framework_id
          : true) &&
        _course.is_deleted !== true,
    );

    if (candidates.length === 0) return course;

    const currentCourseCodeBase = getCourseCodeBase(course);
    const candidatesWithSameBaseCode = candidates.filter(
      (_course) => getCourseCodeBase(_course) === currentCourseCodeBase,
    );
    const narrowedCandidates =
      candidatesWithSameBaseCode.length > 0
        ? candidatesWithSameBaseCode
        : candidates;

    const studentLanguageCode = await getActiveStudentLanguageCode();
    const languageMatchedCourse = narrowedCandidates.find((_course) =>
      isLanguageMatchedCourse(_course, studentLanguageCode),
    );
    if (languageMatchedCourse) return languageMatchedCourse;

    const englishFallbackCourse = narrowedCandidates.find(
      (_course) =>
        isLanguageMatchedCourse(_course, COURSES.ENGLISH) ||
        normalizeCourseToken(_course.code) === currentCourseCodeBase,
    );
    if (englishFallbackCourse) return englishFallbackCourse;

    return narrowedCandidates[0] ?? course;
  };

  const onCourseChanges = async (course: TableTypes<'course'>) => {
    const gradesMap: {
      grades: TableTypes<'grade'>[];
      courses: TableTypes<'course'>[];
    } = await api.getDifferentGradesForCourse(course);
    const resolvedCourse = await resolvePreferredCourse(course, gradesMap);
    const currentGrade =
      gradesMap.grades.find((grade) => grade.id === resolvedCourse.grade_id) ??
      gradesMap.grades.find((grade) => grade.id === course.grade_id);
    localStorage.setItem(GRADE_MAP, JSON.stringify(gradesMap));
    localData.currentGrade = currentGrade ?? gradesMap.grades[0];
    localStorageData.currentGrade = localData.currentGrade;
    localData.gradesMap = gradesMap;
    localStorageData.gradesMap = localData.gradesMap;
    localData.currentCourse = resolvedCourse;
    localStorageData.currentCourseId = resolvedCourse.id;
    setCurrentGrade(currentGrade ?? gradesMap.grades[0]);
    setLocalGradeMap(gradesMap);
    setCurrentCourse(resolvedCourse);
    localStorage.setItem(
      CURRENT_SELECTED_COURSE,
      JSON.stringify(resolvedCourse),
    );

    const params = `courseDocId=${resolvedCourse.id}`;

    if (urlParams.get(CONTINUE)) {
      history.push(PAGES.DISPLAY_CHAPTERS + `?${CONTINUE}=true` + '&' + params);
    } else {
      history.push(PAGES.DISPLAY_CHAPTERS + '?' + params);
    }
  };

  return (
    <div id="display-subjects-page" style={{ height: '100vh' }}>
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
