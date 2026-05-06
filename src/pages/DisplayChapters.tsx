import { FC, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  CONTINUE,
  COURSES,
  CURRENT_SELECTED_CHAPTER,
  CURRENT_SELECTED_COURSE,
  CURRENT_SELECTED_GRADE,
  CURRENT_STAGE,
  DEFAULT_LANGUAGE_ID_EN,
  GRADE_MAP,
  LANGUAGE,
  MODES,
  PAGES,
  TableTypes,
} from '../common/constants';
import { IonItem, IonPage } from '@ionic/react';
import './DisplayChapters.css';
import { t } from 'i18next';
import SelectChapter from '../components/displaySubjects/SelectChapter';
import LessonSlider from '../components/LessonSlider';
import BackButton from '../components/common/BackButton';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import DropDown from '../components/DropDown';
import SkeltonLoading from '../components/SkeltonLoading';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { registerBackButtonHandler } from '../common/backButtonRegistry';
import logger from '../utility/logger';

const localData: any = {};
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

// let localStorageData: any = {};
const DisplayChapters: FC<{}> = () => {
  enum STAGES {
    SUBJECTS,
    CHAPTERS,
    LESSONS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<TableTypes<'course'>[]>();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<'course'>>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<'chapter'>>();
  const [currentClass, setCurrentClass] = useState<TableTypes<'class'>>();
  const [lessons, setLessons] = useState<TableTypes<'lesson'>[]>();
  const [chapters, setChapters] = useState<TableTypes<'chapter'>[]>([]);

  const [localGradeMap, setLocalGradeMap] = useState<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }>();
  const [currentGrade, setCurrentGrade] = useState<TableTypes<'grade'>>();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<'result'>;
  }>({});
  const history = useHistory();
  const location = useLocation();
  const lastBackPressAtRef = useRef<number>(0);
  const blockIonRouterBackUntilRef = useRef<number>(0);

  const stageRef = useRef<STAGES>(stage);
  stageRef.current = stage;
  const api = ServiceConfig.getI().apiHandler;

  const searchParams = new URLSearchParams(location.search);
  const courseDocId = searchParams.get('courseDocId');
  const getCourseByUrl = useMemo(
    () =>
      localGradeMap?.courses.find((course) => courseDocId === course.id) ??
      courses?.find((course) => courseDocId === course.id),
    [localGradeMap, courses, courseDocId],
  );
  useEffect(() => {
    Util.loadBackgroundImage();
    init();
    ScreenOrientation.lock({ orientation: 'landscape' });
  }, []);
  useEffect(() => {
    const storedCourseByUrl = (() => {
      if (getCourseByUrl || !courseDocId) return;

      const selectedCourse = localStorage.getItem(CURRENT_SELECTED_COURSE);
      if (!selectedCourse) return;

      try {
        const parsedCourse = JSON.parse(selectedCourse) as TableTypes<'course'>;
        return parsedCourse?.id === courseDocId ? parsedCourse : undefined;
      } catch (error) {
        logger.error('Failed to parse stored course from localStorage', error);
        return;
      }
    })();
    const resolvedCourseByUrl = getCourseByUrl ?? storedCourseByUrl;

    if (resolvedCourseByUrl && !currentCourse) {
      //as url params change(course.id) and currentCourse empty they we are using this
      onCourseChanges(resolvedCourseByUrl);
    }

    if (!localGradeMap || !localGradeMap.grades) {
      if (currentCourse) {
        setIsLoading(true);
        const getLocalGradeMap = async () => {
          const { grades, courses } =
            await api.getDifferentGradesForCourse(currentCourse);
          const nextGradeMap = {
            grades,
            courses: courses && courses.length > 0 ? courses : [currentCourse],
          };
          localData.gradesMap = nextGradeMap;
          localStorage.setItem(GRADE_MAP, JSON.stringify(nextGradeMap));

          setLocalGradeMap(nextGradeMap);
          setIsLoading(false);
        };
        getLocalGradeMap();
      }
    }
  }, [courseDocId, getCourseByUrl, localGradeMap, currentCourse]);

  const init = async () => {
    const urlParams = new URLSearchParams(location.search);
    await getCourses();
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
        localData.currentCourse.id,
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

      addStateTolocalStorage(STAGES.LESSONS);
      setIsLoading(false);
    } else if (!!urlParams.get('isReload')) {
      await getCourses();
      setIsLoading(true);
      const currentSelectedCourse = localStorage.getItem(
        CURRENT_SELECTED_COURSE,
      );

      if (currentSelectedCourse) {
        const currentCourse = JSON.parse(currentSelectedCourse);
        setCurrentCourse(currentCourse);
        const chapters = await api.getChaptersForCourse(currentCourse.id);
        setChapters(chapters);
        const currentSelectedChapter = localStorage.getItem(
          CURRENT_SELECTED_CHAPTER,
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
      logger.warn('Course not found in local data.');
    }
    setIsLoading(false);
    getLocalGradeMap();
  };

  function getLocalGradeMap():
    | {
        grades: TableTypes<'grade'>[];
        courses: TableTypes<'course'>[];
      }
    | undefined {
    let map = localStorage.getItem(GRADE_MAP);
    if (!!map) {
      let _localMap: {
        grades: TableTypes<'grade'>[];
        courses: TableTypes<'course'>[];
      } = JSON.parse(map);
      let convertedCourses = _localMap.courses;
      _localMap.courses = convertedCourses;
      setLocalGradeMap(_localMap);
      return _localMap;
    }
  }

  const getCourses = async (): Promise<TableTypes<'course'>[]> => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      history.replace(PAGES.SELECT_MODE);
      return [];
    }

    const currClass = schoolUtil.getCurrentClass();
    if (!!currClass) setCurrentClass(currClass);

    const res = await api.getStudentResultInMap(currentStudent.id);
    localData.lessonResultMap = res;

    setLessonResultMap(res);

    const currMode = await schoolUtil.getCurrMode();

    const courses = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass.id)
      : api.getCoursesForParentsStudent(currentStudent.id));
    localData.courses = courses;

    setCourses(courses);

    setIsLoading(false);
    return courses;
  };

  const getLessonsForChapter = async (
    chapter: TableTypes<'chapter'>,
  ): Promise<TableTypes<'lesson'>[]> => {
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
      logger.error('Error fetching lessons:', error);
      setIsLoading(false);
      return [];
    }
  };

  const onBackButton = useCallback((): boolean => {
    const now = Date.now();
    if (now - lastBackPressAtRef.current < 150) return true;
    lastBackPressAtRef.current = now;
    switch (stage) {
      case STAGES.CHAPTERS:
        delete localData.currentChapter;

        setCurrentChapter(undefined);

        localStorage.removeItem(CURRENT_SELECTED_COURSE);
        localStorage.removeItem(CURRENT_SELECTED_GRADE);
        addStateTolocalStorage(STAGES.SUBJECTS);
        Util.setPathToBackButton(PAGES.HOME, history);
        return true;
      case STAGES.LESSONS:
        blockIonRouterBackUntilRef.current = Date.now() + 800;
        delete localData.lessons;
        setLessons(undefined);
        setStage(STAGES.CHAPTERS);
        addStateTolocalStorage(STAGES.CHAPTERS);
        localStorage.removeItem(CURRENT_SELECTED_CHAPTER);

        return true;
      default:
        return false;
    }
  }, [stage, history]);

  useEffect(() => {
    const handler = (ev: any) => {
      if (location.pathname !== PAGES.DISPLAY_CHAPTERS) return;
      const shouldBlockIonRouter =
        stageRef.current === STAGES.LESSONS ||
        Date.now() < blockIonRouterBackUntilRef.current;
      if (!shouldBlockIonRouter) return;
      ev?.detail?.register?.(1000, () => {
        if (stageRef.current === STAGES.LESSONS) {
          onBackButton();
        }
        blockIonRouterBackUntilRef.current = 0;
      });
    };

    document.addEventListener('ionBackButton', handler as any);
    return () => document.removeEventListener('ionBackButton', handler as any);
  }, [location.pathname, onBackButton]);

  useEffect(() => {
    const unregister = registerBackButtonHandler(
      () => {
        if (location.pathname !== PAGES.DISPLAY_CHAPTERS) return false;
        return onBackButton();
      },
      { path: PAGES.DISPLAY_CHAPTERS },
    );
    return unregister;
  }, [location.pathname, onBackButton]);

  useEffect(() => {
    const unblock = history.block((_nextLocation, action) => {
      if (action !== 'POP') return;
      if (location.pathname !== PAGES.DISPLAY_CHAPTERS) return;
      const handled = onBackButton();
      if (handled) return false;
    });

    return () => {
      unblock();
    };
  }, [history, location.pathname, onBackButton]);

  const onCourseChanges = async (course: TableTypes<'course'>) => {
    const gradesMap: {
      grades: TableTypes<'grade'>[];
      courses: TableTypes<'course'>[];
    } = await api.getDifferentGradesForCourse(course);
    let currentGrade = gradesMap.grades.find(
      (grade) => grade.id === course.grade_id,
    );

    if (!gradesMap.courses.some((_course) => _course.id === course.id)) {
      gradesMap.courses.unshift(course);
    }

    if (!currentGrade && course.grade_id) {
      const courseGrade = await api.getGradeById(course.grade_id);
      if (courseGrade) {
        currentGrade = courseGrade;

        if (!gradesMap.grades.some((grade) => grade.id === courseGrade.id)) {
          gradesMap.grades.unshift(courseGrade);
        }
      }
    }

    const selectedGrade = currentGrade ?? gradesMap.grades[0];
    localStorage.setItem(GRADE_MAP, JSON.stringify(gradesMap));
    localData.currentGrade = selectedGrade;

    localData.gradesMap = gradesMap;

    localData.currentCourse = course;

    setCurrentGrade(selectedGrade);
    selectedGrade && addGradeToLocalStorage(selectedGrade);
    setLocalGradeMap(gradesMap);
    const chapters = await api.getChaptersForCourse(course.id);
    setChapters(chapters);
    setCurrentCourse(course);
    localStorage.setItem(CURRENT_SELECTED_COURSE, JSON.stringify(course));
    addStateTolocalStorage(STAGES.CHAPTERS);
    setStage(STAGES.CHAPTERS);
  };

  const getActiveStudentProfile = async () => {
    const currentStudent = Util.getCurrentStudent();

    if (!currentStudent?.id) return currentStudent;

    try {
      return (await api.getUserByDocId(currentStudent.id)) ?? currentStudent;
    } catch (error) {
      logger.error('Failed to refresh student profile for grade change', error);
      return currentStudent;
    }
  };

  const getActiveStudentLanguageCode = async (
    student?: TableTypes<'user'>,
  ): Promise<string> => {
    if (
      !student?.language_id ||
      student.language_id === DEFAULT_LANGUAGE_ID_EN
    ) {
      const storedLanguageCode = normalizeCourseToken(
        localStorage.getItem(LANGUAGE),
      );
      return storedLanguageCode || COURSES.ENGLISH;
    }

    try {
      const language = await api.getLanguageWithId(student.language_id);
      return (
        normalizeCourseToken(language?.code) ||
        normalizeCourseToken(localStorage.getItem(LANGUAGE)) ||
        COURSES.ENGLISH
      );
    } catch (error) {
      logger.error(
        'Failed to resolve student language for grade change',
        error,
      );
      return (
        normalizeCourseToken(localStorage.getItem(LANGUAGE)) || COURSES.ENGLISH
      );
    }
  };

  const resolveCourseForGrade = async (
    grade: TableTypes<'grade'>,
  ): Promise<TableTypes<'course'> | undefined> => {
    if (!currentCourse) return;

    const availableCourses = [
      ...(courses ?? []),
      ...(localData.courses ?? []),
      ...(localGradeMap?.courses ?? []),
    ];
    const uniqueCourses = Array.from(
      new Map(availableCourses.map((course) => [course.id, course])).values(),
    );

    let candidates = uniqueCourses.filter(
      (course) =>
        course.grade_id === grade.id &&
        course.subject_id === currentCourse.subject_id &&
        course.curriculum_id === currentCourse.curriculum_id &&
        (currentCourse.framework_id
          ? course.framework_id === currentCourse.framework_id
          : true) &&
        course.is_deleted !== true,
    );

    if (candidates.length === 0) {
      return localGradeMap?.courses.find(
        (course) => course.grade_id === grade.id,
      );
    }

    const currentCourseCodeBase = getCourseCodeBase(currentCourse);
    const candidatesWithSameBaseCode = candidates.filter(
      (course) => getCourseCodeBase(course) === currentCourseCodeBase,
    );
    if (candidatesWithSameBaseCode.length > 0) {
      candidates = candidatesWithSameBaseCode;
    }

    const activeStudent = await getActiveStudentProfile();
    const studentLanguageCode =
      await getActiveStudentLanguageCode(activeStudent);

    const languageMatchedCourse = candidates.find((course) =>
      isLanguageMatchedCourse(course, studentLanguageCode),
    );
    if (languageMatchedCourse) return languageMatchedCourse;

    const englishFallbackCourse = candidates.find(
      (course) =>
        isLanguageMatchedCourse(course, COURSES.ENGLISH) ||
        normalizeCourseToken(course.code) === currentCourseCodeBase,
    );
    if (englishFallbackCourse) return englishFallbackCourse;

    return candidates[0];
  };

  const onGradeChanges = async (grade: TableTypes<'grade'>) => {
    const resolvedCourse = await resolveCourseForGrade(grade);
    localData.currentGrade = grade;
    setCurrentGrade(grade);
    addGradeToLocalStorage(grade);
    const chapters = await api.getChaptersForCourse(resolvedCourse?.id ?? '');
    setChapters(chapters);
    setCurrentCourse(resolvedCourse);
    localStorage.setItem(
      CURRENT_SELECTED_COURSE,
      JSON.stringify(resolvedCourse),
    );
    localData.currentCourse = resolvedCourse;
  };

  const onChapterChange = async (chapter: TableTypes<'chapter'>) => {
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
      lessons?.forEach((less: TableTypes<'lesson'>, i: number) => {
        const studentResultOfLess = lessonResultMap[less.id];
        if (!!studentResultOfLess) {
          if (!lastPlayedLessonDate) {
            lastPlayedLessonDate = lessonResultMap[less.id].updated_at
              ? new Date(lessonResultMap[less.id].updated_at ?? '')
              : new Date();
            startIndex = i;
          } else {
            if (
              new Date(lessonResultMap[less.id].updated_at ?? '') >
              lastPlayedLessonDate
            ) {
              lastPlayedLessonDate = new Date(
                studentResultOfLess.updated_at ?? '',
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
  function addGradeToLocalStorage(grade: TableTypes<'grade'>) {
    localStorage.setItem(CURRENT_SELECTED_GRADE, JSON.stringify(grade));
  }

  return !isLoading ? (
    <IonPage id="display-chapters-page">
      <div className="chapters-header">
        <div id="back-button-container">
          <BackButton aria-label={t('Back')} onClicked={onBackButton} />
        </div>
        <div className="chapter-header">
          <IonItem lines="none">
            <div className="chapter-name">
              {stage === STAGES.CHAPTERS
                ? currentCourse
                  ? t(currentCourse?.name)
                  : ''
                : currentChapter
                  ? t(currentChapter.name ?? '')
                  : ''}
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
                  (grade) => grade.id === evt,
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
