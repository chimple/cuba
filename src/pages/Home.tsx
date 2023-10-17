import { IonPage, IonHeader } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import {
  COURSES,
  HOMEHEADERLIST,
  CURRENT_LESSON_LEVEL,
  PAGES,
  PREVIOUS_SELECTED_COURSE,
  PRE_QUIZ,
  ALL_COURSES,
  PREVIOUS_PLAYED_COURSE,
  SL_GRADES,
  SELECTED_GRADE,
  HeaderIconConfig,
  DEFAULT_HEADER_ICON_CONFIGS,
  CURRENT_STUDENT,
  CURRENT_CLASS,
  MODES,
  CURRENT_MODE,
  RECOMMENDATIONS,
} from "../common/constants";
import CurriculumController from "../models/curriculumController";
import "./Home.css";
import LessonSlider from "../components/LessonSlider";
import Loading from "../components/Loading";
import { Splide } from "@splidejs/react-splide";
import HomeHeader from "../components/HomeHeader";
import { useHistory, useLocation } from "react-router";
// Default theme
import "@splidejs/react-splide/css";
// or only core styles
import "@splidejs/react-splide/css/core";
import { Util } from "../utility/util";
import { OneRosterApi } from "../services/api/OneRosterApi";
import { ServiceConfig } from "../services/ServiceConfig";
import RectangularIconButton from "../components/parent/RectangularIconButton";
import User from "../models/user";
import Course from "../models/course";
import { Chapter, StudentLessonResult } from "../common/courseConstants";
import Lesson from "../models/lesson";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { DocumentReference } from "firebase/firestore";
import LeaderBoardButton from "./LeaderBoardButton";
import Class from "../models/class";
import { schoolUtil } from "../utility/schoolUtil";
import Assignment from "../models/assignment";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { auto } from "@popperjs/core";
import { margin } from "@mui/system";
import { push } from "ionicons/icons";
import { t } from "i18next";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import ChimpleAvatarPage from "../components/animation/ChimpleAvatarPage";
import DisplaySubjects from "./DisplaySubjects";
import SearchLesson from "./SearchLesson";
import AssignmentPage from "./Assignment";
import { Console } from "console";
import Subjects from "./Subjects";
import { RemoteConfig, REMOTE_CONFIG_KEYS } from "../services/RemoteConfig";

const sortValidLessonsByDate = (
  lessonIds: string[],
  lessonResultMap: { [lessonDocId: string]: StudentLessonResult }
): string[] => {
  return lessonIds.sort((a, b) => {
    const lessonResultA = lessonResultMap[a];
    const lessonResultB = lessonResultMap[b];

    if (!lessonResultA || !lessonResultB) {
      return 0;
    }

    const dateA = lessonResultA.date?.toMillis() || 0;
    const dateB = lessonResultB.date?.toMillis() || 0;

    return dateB - dateA;
  });
};

const localData: any = {};
const Home: FC = () => {
  const [dataCourse, setDataCourse] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentStudent, setCurrentStudent] = useState<User>();
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: StudentLessonResult;
  }>();
  const [courses, setCourses] = useState<Course[]>();
  const [lessons, setLessons] = useState<Lesson[]>();
  //const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [currentHeader, setCurrentHeader] = useState<any>(() => {
    //Initialize with the value from local storage (if available)
    return localStorage.getItem('currentHeader') || HOMEHEADERLIST.HOME;
  });
  const [lessonsScoreMap, setLessonsScoreMap] = useState<any>();
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
  const [levelChapter, setLevelChapter] = useState<Chapter>();
  const [gradeMap, setGradeMap] = useState<any>({});
  const [pendingAssignmentsCount, setPendingAssignmentsCount] =
    useState<number>(0);
  const history = useHistory();
  const [PlayedLessonsList, setPlayedLessonsList] = useState<Lesson[]>([]);
  const [favouriteLessons, setFavouriteLessons] = useState<Lesson[]>([]);
  const [favouritesPageSize, setFavouritesPageSize] = useState<number>(10);

  const [initialFavoriteLessons, setInitialFavoriteLessons] = useState<
    Lesson[]
  >([]);
  const [initialHistoryLessons, setInitialHistoryLessons] = useState<Lesson[]>(
    []
  );
  const [historyLessons, setHistoryLessons] = useState<Lesson[]>([]);
  const [validLessonIds, setValidLessonIds] = useState<string[]>([]);

  let allPlayedLessonIds: string[] = [];
  let tempPageNumber = 1;
  const location = useLocation();
  const getCanShowAvatar = async () => {
    const canShowAvatarValue = await RemoteConfig.getBoolean(
      REMOTE_CONFIG_KEYS.CAN_SHOW_AVATAR
     );
    setCanShowAvatar(canShowAvatarValue);
  };
  const [canShowAvatar, setCanShowAvatar] = useState<boolean>();

  useEffect(() => {
    urlOpenListenerEvent();
    setCurrentHeader(HOMEHEADERLIST.HOME);
    setValue(SUBTAB.SUGGESTIONS);
    fetchData();
    getCanShowAvatar();
    const urlParams = new URLSearchParams(location.search);
    
    if (!!urlParams.get("continue")) {
      setCurrentHeader(currentHeader);
    }
  }, []);

  useEffect(() => {
    setCurrentHeader(currentHeader === HOMEHEADERLIST.PROFILE?HOMEHEADERLIST.HOME:currentHeader);
    localStorage.setItem('currentHeader', currentHeader);
  }, [currentHeader]);
  
  
  const fetchData = async () => {
    setIsLoading(true);
    const lessonResult = await setCourse(HOMEHEADERLIST.HOME);
    console.log("resultTemp", lessonResult);
    const allLessonIds = await getHistory(lessonResult);
    if (allLessonIds) setValidLessonIds(allLessonIds);
    setIsLoading(false);
  };
  
  function urlOpenListenerEvent() {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      const slug = event.url.split(".cc").pop();
      if (slug) {
        setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
        history.replace(slug);
      }
    });
  }

  const api = ServiceConfig.getI().apiHandler;
  const getAssignments = async () => {
    setIsLoading(true);
    const student = await Util.getCurrentStudent();

    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    const studentResult = await api.getStudentResult(student.docId);
    if (
      !!studentResult &&
      !!studentResult.classes &&
      studentResult.classes.length > 0
    ) {
      const allAssignments: Assignment[] = [];

      await Promise.all(
        studentResult.classes.map(async (_class) => {
          const res = await api.getPendingAssignments(_class, student.docId);
          allAssignments.push(...res);
        })
      );
      let count = 0;
      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(
            _assignment.lesson.id,
            undefined,
            true
          );
          console.log(res);
          if (!!res) {
            count++;
            res.assignment = _assignment;
            reqLes.push(res);
          }
        })
      );
      setPendingAssignmentsCount(count);

      setDataCourse(reqLes);
      storeRecommendationsInLocalStorage(reqLes);
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  };

  async function setCourse(subjectCode: string) {
    let avatarInfo = await ServiceConfig.getI().apiHandler.getAvatarInfo();

    console.log("avatarInfo ", avatarInfo);

    setIsLoading(true);
    const currentStudent = await Util.getCurrentStudent();

    if (!currentStudent) {
      // history.replace(PAGES.DISPLAY_STUDENT);
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    setCurrentStudent(currentStudent);
    // const currClass = localStorage.getItem(CURRENT_CLASS);
    const currClass = schoolUtil.getCurrentClass();
    // if (!!currClass) setCurrentClass(JSON.parse(currClass));
    if (!!currClass) setCurrentClass(currClass);
    // const apiInstance = OneRosterApi.getInstance();
    if (subjectCode === HOMEHEADERLIST.HOME) {
      // let r = api.getStudentResultInMap(currentStudent.docId);
      // console.log("r = api.getStudentResultInMap(currentStudent.docId);", r);
      if (!localData.allCourses) {
        let tempAllCourses = await api.getAllCourses();
        localData.allCourses = tempAllCourses;
      }
      await getAssignments();
      // getRecommendationLessons(currentStudent, currClass).then(() => {
      try {
        const recommendationResult = await getRecommendationLessons(
          currentStudent,
          currClass
        );
        console.log("Final RECOMMENDATION List ", reqLes);
        setDataCourse(reqLes);
        console.log("recommendationResult", recommendationResult);
        return recommendationResult;
      } catch (error) {
        console.error("Error fetching recommendation:", error);
      }
    }

    /// Below code to show lessons card and chapters bar

    // let { chapters, lessons, tempResultLessonMap, preQuiz } =
    //   await getDataForSubject(subjectCode);
    // const _isPreQuizPlayed = subjectCode !== COURSES.PUZZLE && !!preQuiz;
    // if (_isPreQuizPlayed) {
    //   if (lessons[0].id === subjectCode + "_" + PRE_QUIZ) {
    //     lessons = lessons.slice(1);
    //     chapters = chapters.slice(1);
    //   }
    //   // const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
    //   //   subjectCode,
    //   //   preQuiz?.score ?? 0,
    //   //   chapters
    //   // );
    //   // setLevelChapter(tempLevelChapter);
    // }
    // const tempChapterMap: any = {};
    // for (let i = 0; i < chapters.length; i++) {
    //   tempChapterMap[chapters[i].id] = i;
    // }

    // const currentLessonIndex =
    //   (await Util.getLastPlayedLessonIndex(
    //     subjectCode,
    //     lessons,
    //     chapters,
    //     tempResultLessonMap
    //   )) + 1;
    // const currentLesson = lessons[currentLessonIndex] ?? lessons[0];
    // const currentChapter = currentLesson.chapter ?? chapters[0];
    // setCurrentChapter(currentChapter);
    // const lessonChapterIndex = currentChapter.lessons
    //   .map((l) => l.id)
    //   .indexOf(currentLesson.id);
    // setCurrentLessonIndex(lessonChapterIndex);

    // setLessonsScoreMap(tempResultLessonMap);
    // setCurrentLevel(subjectCode, chapters, lessons);
    // setChaptersMap(tempChapterMap);
    // setDataCourse({ lessons: lessons, chapters: chapters });
    // setIsLoading(false);
  }
  enum SUBTAB {
    SUGGESTIONS,
    FAVOURITES,
    HISTORY,
  }
  const [value, setValue] = useState(SUBTAB.SUGGESTIONS);

  const handleChange = async (
    event: React.SyntheticEvent,
    newValue: SUBTAB
  ) => {
    setValue(newValue);
    if (newValue === SUBTAB.HISTORY) {
      // setIsLoading(true);
      if (lessonResultMap) {
        // const startIndex = (tempPageNumber - 1) * favouritesPageSize;
        // const endIndex = startIndex + favouritesPageSize;

        // const initialHistoryLessonsSlice = initialHistoryLessons.slice(
        //   startIndex,
        //   endIndex
        // );
        // setHistoryLessons(initialHistoryLessonsSlice);
        setFavouriteLessons([]);
      }
      tempPageNumber = 1;
      await updateHistoryLessons(validLessonIds);
      // setIsLoading(false);
    } else if (newValue === SUBTAB.FAVOURITES) {
      setHistoryLessons([]);
      if (lessonResultMap) {
        // const startIndex = (tempPageNumber - 1) * favouritesPageSize;
        // const endIndex = startIndex + favouritesPageSize;
        // console.log("initial history lessons", initialHistoryLessons);
        // const initialFavouriteLessonsSlice = initialFavoriteLessons.slice(
        //   startIndex,
        //   endIndex
        // );
        await updateFavouriteLessons(validLessonIds);
      }
      tempPageNumber = 1;
    } else {
      setHistoryLessons([]);
      setFavouriteLessons([]);
    }
    console.log("Changing...", newValue);
  };
  const handleHomeIconClick = () => {
    setValue(SUBTAB.SUGGESTIONS);
  };

  const getLessonsForChapter = async (chapter: Chapter): Promise<Lesson[]> => {
    setIsLoading(true);
    if (!chapter) {
      setIsLoading(false);
      return [];
    }
    const lessons = await api.getLessonsForChapter(chapter);
    setLessons(lessons);
    setIsLoading(false);
    return lessons;
  };

  const getHistory = async (lessonResult) => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    const studentResult = await api.getStudentResult(currentStudent.docId);

    if (studentResult?.lessons) {
      const playedLessonIds = Object.keys(studentResult.lessons);
      // const lessonPromises = playedLessonIds.map((lessonId) =>
      //   api.getLesson(lessonId, undefined, true)
      const validLessonIds = playedLessonIds.filter(
        (lessonId) => lessonId !== undefined
      );
      allPlayedLessonIds = sortValidLessonsByDate(
        validLessonIds,
        lessonResult || {}
      );
      return allPlayedLessonIds;
    }
  };

  const currentStudentDocId = Util.getCurrentStudent()?.docId;
  const storeRecommendationsInLocalStorage = (recommendations: any[]) => {
    const recommendationsInLocal = localStorage.getItem(`${currentStudentDocId}-${RECOMMENDATIONS}`);
    let existingRecommendations: any[] = [];

    if (recommendationsInLocal !== null) {
      existingRecommendations = JSON.parse(recommendationsInLocal);
    }

    if (!lessonResultMap && existingRecommendations.length === 0) {
      let lessonMap = new Map();

      for (let i = 0; i < recommendations.length; i++) {
        const lesson = recommendations[i];
        if (lesson.cocosSubjectCode && lesson.id) {
          lessonMap[lesson.cocosSubjectCode] = lesson.id;
        }
      }

      localStorage.setItem(`${currentStudentDocId}-${RECOMMENDATIONS}`, JSON.stringify(lessonMap));
      setDataCourse(existingRecommendations.concat(lessonMap) as Lesson[]);

    } else {
      setDataCourse(existingRecommendations);
    }
  };





  let reqLes: Lesson[] = [];
  async function getRecommendationLessons(
    currentStudent: User,
    currClass: Class | undefined
  ) {
    setIsLoading(true);
    let tempResultLessonMap:
      | { [lessonDocId: string]: StudentLessonResult }
      | undefined = {};
    // await api
    //   .getLessonResultsForStudent(currentStudent.docId)
    const sortLessonResultByDate = (lesMap: {
      [lessonDocId: string]: StudentLessonResult;
    }) => {
      // lesMap.sort((a, b) => a.date.getTime() - b.date.getTime());
      if (!lesMap) {
        // setIsLoading(false);
        return;
      }
      console.log("Object.entries(lesMap)", lesMap, Object.entries(lesMap));
      const lesList = Object.entries(lesMap).sort((a, b) => {
        if (a[1].date === b[1].date) {
          return 0;
        } else {
          return a[1].date > b[1].date ? -1 : 1;
        }
      });

      // Rebuild the map after sorting it.
      let tempLesMap: {
        [lessonDocId: string]: StudentLessonResult;
      } = {};
      lesList.forEach((res) => (tempLesMap[res[0]] = res[1]));
      return tempLesMap;
    };
    const currMode = await schoolUtil.getCurrMode();
    console.log(currMode);
    let sortLessonResultMap:
      | {
        [lessonDocId: string]: StudentLessonResult;
      }
      | undefined;
    const res = await api.getStudentResult(currentStudent.docId);
    console.log("tempResultLessonMap = res;", JSON.stringify(res));
    tempResultLessonMap = res?.lessons;
    setLessonResultMap(res?.lessons);
    if (tempResultLessonMap) {
      console.log("tempResultLessonMap", tempResultLessonMap);
      sortLessonResultMap = sortLessonResultByDate(tempResultLessonMap);
      console.log("sortLessonResultMap ", sortLessonResultMap);
    }

    const courses: Course[] = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    setCourses(courses);
    for (const tempCourse of courses) {
      setIsLoading(true);
      if (tempCourse.chapters.length <= 0) {
        console.log("Chapters are empty", tempCourse);
        continue;
      }
      let islessonPushed = false;
      if (tempCourse.chapters.length <= 0) {
        console.log("Chapter are empty", tempCourse);
        continue;
      }
      if (
        tempResultLessonMap === undefined &&
        tempCourse.chapters[0].id === tempCourse.courseCode + "_quiz"
      ) {
        const tempLes = tempCourse.chapters[0].lessons;
        for (let i = 0; i < tempLes.length; i++) {
          const element = tempLes[i];
          if (element instanceof DocumentReference) {
            const lessonObj = await api.getLessonFromCourse(
              tempCourse,
              element.id
            );
            // await res.lessons[tempCourse.courseCode][l.id];
            if (lessonObj) {
              let chapterTitle = tempCourse.chapters[0].title;
              lessonObj.chapterTitle = chapterTitle;
              console.log(lessonObj, "lessons pushed");
              reqLes.push(lessonObj as Lesson);
              setDataCourse(reqLes);
            }
          } else {
            console.log("Wrong place");
            console.log(element, "lessons pushed");
            reqLes.push(element as Lesson);
            setDataCourse(reqLes);
          }
        }
        console.log("pushed lessons", reqLes);
      } else {
        for (let c = 0; c < tempCourse.chapters.length; c++) {
          if (islessonPushed) {
            break;
          }
          const chapter = tempCourse.chapters[c];
          // console.log("chapter in for ", chapter);
          for (let l = 0; l < chapter.lessons.length; l++) {
            const lesson = chapter.lessons[l];
            // console.log("lesson id", lesson.id);
            if (!tempResultLessonMap || !tempResultLessonMap[lesson.id]) {
              // if (lesson instanceof DocumentReference) {
              const lessonObj = await api.getLessonFromCourse(
                tempCourse,
                lesson.id
              );
              // await res.lessons[tempCourse.courseCode][
              //   lesson.id
              // ];
              // console.log(
              //   "await FirebaseApi.i.getLessonFromCourse(tempCourse, lesson.id)",
              //   await FirebaseApi.i.getLessonFromCourse(tempCourse, lesson.id)
              // );

              if (lessonObj) {
                let chapterTitle = chapter.title;
                lessonObj.chapterTitle = chapterTitle;
                console.log(lessonObj, "lessons pushed");
                reqLes.push(lessonObj as Lesson);
              }
              // } else {
              //   console.log(lesson, "lessons pushed");
              //   reqLes.push(lesson);
              // }
              console.log("DWSGSGSG");
              setDataCourse(reqLes);
              islessonPushed = true;
              break;
            }
          }
        }
        islessonPushed = false;
      }

      //Last Played Lessons
      islessonPushed = false;
      if (!sortLessonResultMap) {
        console.log("ERERERER");
        setDataCourse(reqLes);
        setIsLoading(false);
        continue;
      }
      Object.entries(sortLessonResultMap).forEach(async (v, k) => {
        const lessonObj = await api.getLessonFromCourse(tempCourse, v[0]);
        if (
          lessonObj?.subject.id === tempCourse.subject.id &&
          !islessonPushed
        ) {
          console.log("last played ", lessonObj, "lessons pushed");
          reqLes.push(lessonObj as Lesson);
          islessonPushed = true;
          // break;
          console.log("reqLes.", reqLes);
          setDataCourse(reqLes);
          // return;
        }
      });
      console.log("reqLes in if.", reqLes);
    }
    console.log("reqLes outside.", reqLes);
    setDataCourse(reqLes);
    storeRecommendationsInLocalStorage(reqLes);
    setIsLoading(false);
    return sortLessonResultMap;
  }

  async function getDataForSubject(course: Course): Promise<{
    chapters: Chapter[];
    lessons: {
      [key: string]: {
        [key: string]: Lesson;
      };
    };
  }> {
    const chapters = course.chapters;
    const lessons = await api.getAllLessonsForCourse(course);
    // setLessons(lessons);
    // console.log("lessons ", lessons);

    if (!currentStudent) {
      // console.log("return in getdataForSubject");

      return {
        chapters: chapters,
        lessons: lessons,
      };
    }

    return {
      chapters: chapters,
      lessons: lessons,
    };
  }
  function onHeaderIconClick(selectedHeader: any) {
    var headerIconList: HeaderIconConfig[] = [];
    DEFAULT_HEADER_ICON_CONFIGS.forEach((element) => {
      //  console.log("elements", element);
      headerIconList.push(element);
    });
    setCurrentHeader(selectedHeader);
    localStorage.setItem('currentHeader', selectedHeader);
    localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    DEFAULT_HEADER_ICON_CONFIGS.get(selectedHeader);
    switch (selectedHeader) {
      // case HOMEHEADERLIST.SUBJECTS:
      //   history.replace(PAGES.DISPLAY_SUBJECTS);
      //   break;
      case HOMEHEADERLIST.HOME:
        handleHomeIconClick();
        // setCourse(HOMEHEADERLIST.RECOMMENDATION);
        if (currentStudent) {
          getRecommendationLessons(currentStudent, currentClass).then(() => {
            console.log("Final RECOMMENDATION List ", reqLes);
            setDataCourse(reqLes);
            //storeRecommendationsInLocalStorage(reqLes);
          });
        }
        break;
      case HOMEHEADERLIST.PROFILE:
        history.replace(PAGES.LEADERBOARD);
        break;
        // case HOMEHEADERLIST.SEARCH:
        //   history.replace(PAGES.SEARCH);
        //   break;
        // case HOMEHEADERLIST.ASSIGNMENT:
        //   history.replace(PAGES.ASSIGNMENT);
        //   break;
        // case HOMEHEADERLIST.QUIZ:
        //   history.replace(PAGES.HOME);
        break;
      default:
        break;
    }
  }
  // const sortedPlayedLessonsList = PlayedLessonsList.sort((a, b) => {
  //   const lessonResultA = lessonResultMap?.[a.docId];
  //   const lessonResultB = lessonResultMap?.[b.docId];

  //   if (!lessonResultA || !lessonResultB) {
  //     return 0;
  //   }

  //   return lessonResultB.date.toMillis() - lessonResultA.date.toMillis();
  // });
  // setPlayedLessonsList(sortedPlayedLessonsList);
  // function sortPlayedLessonsByDate(lessons: Lesson[], lessonResultMap: any): Lesson[] {
  //   const sortedLessons = lessons.slice().sort((a, b) => {
  //     const lessonResultA = lessonResultMap?.[a.docId];
  //     const lessonResultB = lessonResultMap?.[b.docId];

  //     if (!lessonResultA || !lessonResultB) {
  //       return 0;
  //     }

  //     return lessonResultB.date.toMillis() - lessonResultA.date.toMillis();
  //   });

  //   return sortedLessons;
  // }

  const getLovedLessons = () => {
    return PlayedLessonsList.filter((lesson) => {
      const lessonResult = lessonResultMap?.[lesson.docId];
      return lessonResult?.isLoved ?? false;
    }).sort((a, b) => {
      const lessonResultA = lessonResultMap?.[a.docId];
      const lessonResultB = lessonResultMap?.[b.docId];
      if (!lessonResultA || !lessonResultB) return 0;
      return lessonResultB.date.toMillis() - lessonResultA.date.toMillis();
    });
  };

  const handleLoadMoreHistoryLessons = async () => {
    tempPageNumber = tempPageNumber + 1;
    await updateHistoryLessons(validLessonIds);
  };

  const handleLoadMoreLessons = async () => {
    if (currentHeader === HOMEHEADERLIST.FAVOURITES) {
      tempPageNumber = tempPageNumber + 1;
      await updateFavouriteLessons(validLessonIds);
    }
  };

  const updateFavouriteLessons = async (allLessonIds) => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent || !lessonResultMap) {
      return;
    }

    const favouritesStartIndex = (tempPageNumber - 1) * favouritesPageSize;
    const favouritesEndIndex = favouritesStartIndex + favouritesPageSize;

    const slicedLessonIdsForFavourite = validLessonIds.slice(
      favouritesStartIndex,
      favouritesEndIndex
    );

    const lessonPromisesForFavourite = slicedLessonIdsForFavourite.map(
      (lessonId) => api.getLesson(lessonId)
    );

    const lessonsForFavourite: (Lesson | undefined)[] = await Promise.all(
      lessonPromisesForFavourite
    );

    const validLessonsForFavourite: Lesson[] = lessonsForFavourite.filter(
      (lesson): lesson is Lesson => {
        if (lesson === undefined) {
          return false;
        }
        const lessonResult = lessonResultMap?.[lesson.docId];
        return lessonResult?.isLoved ?? false;
      }
    );

    const latestTenFavouriteLessons = favouriteLessons.slice(0, 10);
    setValidLessonIds(allLessonIds);
    favouriteLessons.push(...validLessonsForFavourite);
    setInitialFavoriteLessons(latestTenFavouriteLessons);
  };

  const updateHistoryLessons = async (allLessonIds) => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent || !lessonResultMap) {
      return;
    }

    const historyStartIndex = (tempPageNumber - 1) * favouritesPageSize;
    const historyEndIndex = historyStartIndex + favouritesPageSize;

    const slicedLessonIdsForHistory = validLessonIds.slice(
      historyStartIndex,
      historyEndIndex
    );

    const lessonPromisesForHistory = slicedLessonIdsForHistory.map((lessonId) =>
      api.getLesson(lessonId)
    );

    const lessonsForHistory: (Lesson | undefined)[] = await Promise.all(
      lessonPromisesForHistory
    );
    const validLessonsForHIstory: Lesson[] = lessonsForHistory.filter(
      (lesson): lesson is Lesson => lesson !== undefined
    );

    const latestTenPlayedLessons = historyLessons.slice(0, 10);
    setValidLessonIds(allLessonIds);
    historyLessons.push(...validLessonsForHIstory);
    setInitialHistoryLessons(latestTenPlayedLessons);
  };

  console.log("lesson slider favourite", favouriteLessons);
  console.log("lesson slider history", historyLessons);

  return (
    <IonPage id="home-page">
      <IonHeader id="home-header">
        <HomeHeader
          currentHeader={currentHeader}
          onHeaderIconClick={onHeaderIconClick}
          pendingAssignmentCount={pendingAssignmentsCount}
        ></HomeHeader>
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME && !!canShowAvatar &&  (
              <ChimpleAvatarPage
              style={{
                marginBottom: "15vh",
                display: "flex",
                justifyContent: "space-around",
              }}
            ></ChimpleAvatarPage>
            )}
  
            {currentHeader === HOMEHEADERLIST.SUBJECTS && <Subjects />}
  
            {currentHeader === HOMEHEADERLIST.ASSIGNMENT && <AssignmentPage />}
  
            {currentHeader === HOMEHEADERLIST.SEARCH && <SearchLesson />}
  
            {/* 
            {value === SUBTAB.SUGGESTIONS &&
            currentHeader === HOMEHEADERLIST.SUGGESTIONS ? (
              <div>
                <LessonSlider
                  lessonData={dataCourse}
                  isHome={true}
                  course={undefined}
                  lessonsScoreMap={lessonResultMap || {}}
                  startIndex={0}
                  showSubjectName={true}
                  showChapterName={true}
                />
              </div>
            ) : null
            }
  
            {value === SUBTAB.FAVOURITES &&
              currentHeader === HOMEHEADERLIST.SUGGESTIONS && (
                <div>
                  <LessonSlider
                    lessonData={favouriteLessons}
                    isHome={true}
                    course={undefined}
                    lessonsScoreMap={lessonResultMap || {}}
                    startIndex={0}
                    showSubjectName={true}
                    showChapterName={true}
                    onEndReached={handleLoadMoreLessons}
                  />
                </div>
              )
  
            {value === SUBTAB.HISTORY &&
              currentHeader === HOMEHEADERLIST.SUGGESTIONS && (
                <div>
                  <LessonSlider
                    lessonData={historyLessons}
                    isHome={true}
                    course={undefined}
                    lessonsScoreMap={lessonResultMap || {}}
                    startIndex={0}
                    showSubjectName={true}
                    showChapterName={true}
                    onEndReached={handleLoadMoreHistoryLessons}
                  />
                </div>
              )
            }
            */}
  
            {(value === SUBTAB.SUGGESTIONS ||
              value === SUBTAB.FAVOURITES ||
              value === SUBTAB.HISTORY) &&
              ((canShowAvatar &&
                currentHeader === HOMEHEADERLIST.SUGGESTIONS) ||
                (!canShowAvatar &&
                  currentHeader === HOMEHEADERLIST.HOME)) && (
                <div>
                  {value === SUBTAB.SUGGESTIONS && (
                    <LessonSlider
                      lessonData={dataCourse}
                      isHome={true}
                      course={undefined}
                      lessonsScoreMap={lessonResultMap || {}}
                      startIndex={0}
                      showSubjectName={true}
                      showChapterName={true}
                    />
                  )}
  
                  {value === SUBTAB.FAVOURITES && (
                    <LessonSlider
                      lessonData={favouriteLessons}
                      isHome={true}
                      course={undefined}
                      lessonsScoreMap={lessonResultMap || {}}
                      startIndex={0}
                      showSubjectName={true}
                      showChapterName={true}
                      onEndReached={handleLoadMoreLessons}
                    />
                  )}
  
                  {value === SUBTAB.HISTORY && (
                    <LessonSlider
                      lessonData={historyLessons}
                      isHome={true}
                      course={undefined}
                      lessonsScoreMap={lessonResultMap || {}}
                      startIndex={0}
                      showSubjectName={true}
                      showChapterName={true}
                      onEndReached={handleLoadMoreHistoryLessons}
                    />
                  )}
                </div>
              )}
  
            {/* To show lesson cards after clicking on the header icon  */}
  
            {/* 
            {currentHeader !== HEADERLIST.RECOMMENDATION ? (
              // <ChapterSlider
              //   chapterData={dataCourse.chapters}
              //   onChapterClick={onChapterClick}
              //   currentChapterId={currentChapterId}
              //   chaptersIndex={chaptersMap[currentChapterId] ?? 0}
              //   levelChapter={levelChapter}
              // />
              <ChapterBar
                onChapterChange={onChapterClick}
                currentChapter={currentChapter!}
                chapters={dataCourse.chapters}
                onGradeChange={(selectedGrade) => {
                  gradeMap[currentHeader] = selectedGrade.detail.value;
                  setGradeMap(gradeMap);
                  let course;
                  // if (currentHeader === HEADERLIST.ENGLISH) {
                  //   course = HEADERLIST.ENGLISH;
                  //   // currentHeader === HEADERLIST.ENGLISH
                  // } else if (currentHeader === HEADERLIST.MATHS) {
                  //   course = HEADERLIST.MATHS;
                  // }
                  setCourse(course);
                  localStorage.setItem(
                    PREVIOUS_SELECTED_COURSE(),
                    currentHeader
                  );
                  localStorage.setItem(
                    SELECTED_GRADE(),
                    JSON.stringify(gradeMap)
                  );
                }}
                currentGrade={gradeMap[currentHeader] || SL_GRADES.GRADE1}
                grades={[SL_GRADES.GRADE1, SL_GRADES.GRADE2]}
                showGrade={currentHeader !== HEADERLIST.RECOMMENDATION}
              />
            ) : (
              <div style={{ marginTop: "2.6%" }}></div>
            )
            }
  
            <LessonSlider
                lessonData={
                  currentHeader === HEADERLIST.RECOMMENDATION
                    ? dataCourse.lessons
                    : currentChapter?.lessons!
                }
                chaptersData={dataCourse.chapters}
                currentChapter={currentChapter!}
                onChapterChange={onArrowClick}
                isHome={
                  currentHeader === HEADERLIST.RECOMMENDATION ? true : false
                }
                onSwiper={setLessonSwiperRef}
                // onSlideChange={onCustomSlideChange}
                lessonsScoreMap={lessonsScoreMap}
                startIndex={
                  currentHeader === HEADERLIST.RECOMMENDATION
                    ? 0
                    : currentLessonIndex - 1
                }
                showSubjectName={currentHeader === HEADERLIST.RECOMMENDATION}
              />
            */}
            {(currentHeader === HOMEHEADERLIST.SUGGESTIONS ||
              currentHeader === HOMEHEADERLIST.FAVOURITES ||
              currentHeader === HOMEHEADERLIST.HISTORY ||
              (!canShowAvatar &&
                currentHeader === HOMEHEADERLIST.HOME)) && (
              <div id="home-page-bottom">
                <AppBar className="home-page-app-bar">
                  <Box>
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      TabIndicatorProps={{ style: { display: "none" } }}
                      sx={{
                        "& .MuiTab-root": {
                          color: "black",
                          borderRadius: "5vh",
                          padding: "0 3vw",
                          margin: "1vh 1vh",
                          minHeight: "37px",
                        },
                        "& .Mui-selected": {
                          backgroundColor: "#FF7925",
                          borderRadius: "8vh",
                          color: "#FFFFFF !important",
                          minHeight: "37px",
                        },
                      }}
                    >
                      <Tab
                        id="home-page-sub-tab"
                        label={t("For You")}
                        onClick={() => {
                          setCurrentHeader(
                            canShowAvatar
                              ? HOMEHEADERLIST.SUGGESTIONS
                              : HOMEHEADERLIST.HOME
                          );
                          setValue(SUBTAB.SUGGESTIONS);
                        }}
                      />
                      <Tab
                        id="home-page-sub-tab"
                        label={t("Favourite")}
                        onClick={() => {
                          setCurrentHeader(
                            canShowAvatar
                              ? HOMEHEADERLIST.SUGGESTIONS
                              : HOMEHEADERLIST.HOME
                          );
                          setValue(SUBTAB.FAVOURITES);
                        }}
                      />
                      <Tab
                        id="home-page-sub-tab"
                        label={t("History")}
                        onClick={() => {
                          setCurrentHeader(
                            canShowAvatar
                              ? HOMEHEADERLIST.SUGGESTIONS
                              : HOMEHEADERLIST.HOME
                          );
                          setValue(SUBTAB.HISTORY);
                        }}
                      />
                    </Tabs>
                  </Box>
                </AppBar>
              </div>
            )}
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </div>
    </IonPage>
  );  
};
export default Home;