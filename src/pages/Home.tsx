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
  CONTINUE,
  LIVE_QUIZ,
  SHOW_DAILY_PROGRESS_FLAG,
  IS_CONECTED,
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
import ChimpleAvatar from "../components/animation/ChimpleAvatar";
import DisplaySubjects from "./DisplaySubjects";
import SearchLesson from "./SearchLesson";
import AssignmentPage from "./Assignment";
import { Console } from "console";
import Subjects from "./Subjects";
import { RemoteConfig, REMOTE_CONFIG_KEYS } from "../services/RemoteConfig";
import LiveQuiz from "./LiveQuiz";
import SkeltonLoading from "../components/SkeltonLoading";
import { AvatarObj } from "../components/animation/Avatar";
import React from "react";
import Dashboard from "./Malta/Dashboard";

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
  // const [currentHeader, setCurrentHeader] = useState<any>(() => {
  //   //Initialize with the value from local storage (if available)
  //   return localStorage.getItem("currentHeader") || HOMEHEADERLIST.HOME;
  // });
  const [lessonsScoreMap, setLessonsScoreMap] = useState<any>();
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
  const [levelChapter, setLevelChapter] = useState<Chapter>();
  const [gradeMap, setGradeMap] = useState<any>({});
  const [pendingAssignmentsCount, setPendingAssignmentsCount] =
    useState<number>(0);
  const [pendingLiveQuizCount, setPendingLiveQuizCount] = useState<number>(0);
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
  let linked: boolean;
  const location = useLocation();
  const getCanShowAvatar = async () => {
    const canShowAvatarValue = await Util.getCanShowAvatar();
    console.log("const canShowAvatarValue in home ", canShowAvatarValue);

    setCanShowAvatar(canShowAvatarValue);
  };
  const urlParams = new URLSearchParams(location.search);
  const [canShowAvatar, setCanShowAvatar] = useState<boolean>();
  const [currentHeader, setCurrentHeader] = useState(() => {
    const currPage = urlParams.get("tab");
    if (
      currPage &&
      Object.values(HOMEHEADERLIST).includes(currPage as HOMEHEADERLIST)
    ) {
      return currPage as HOMEHEADERLIST;
    } else {
      return localStorage.getItem("currentHeader") || HOMEHEADERLIST.HOME;
    }
  });
  useEffect(() => {
    localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "true");
    Util.checkDownloadedLessonsFromLocal();
    initData();
    setCurrentHeader(HOMEHEADERLIST.HOME);
    setValue(SUBTAB.SUGGESTIONS);
    getCanShowAvatar();
    if (!!urlParams.get(CONTINUE)) {
      urlParams.delete(CONTINUE);
      App.addListener("appStateChange", Util.onAppStateChange);
      setCurrentHeader(currentHeader);
    }
  }, []);

  useEffect(() => {
    setCurrentHeader(
      currentHeader === HOMEHEADERLIST.PROFILE
        ? HOMEHEADERLIST.HOME
        : currentHeader
    );
    localStorage.setItem("currentHeader", currentHeader);
    if (currentHeader !== HOMEHEADERLIST.HOME) {
      fetchData();
    }
  }, [currentHeader]);
  const initData = async () => {
    fetchData();
    await isLinked();
    urlOpenListenerEvent();
  };

  function sortPlayedLessonDocByDate(playedLessonData) {
    const lessonArray: { lessonDoc: string; combinedTime: number }[] = [];
    for (const lessonDoc in playedLessonData) {
      if (playedLessonData.hasOwnProperty(lessonDoc)) {
        const lessonDate = playedLessonData[lessonDoc].date;
        const combinedTime =
          lessonDate.seconds * 1000000000 + lessonDate.nanoseconds;
        lessonArray.push({ lessonDoc, combinedTime });
      }
    }
    lessonArray.sort((a, b) => b.combinedTime - a.combinedTime);
    return lessonArray.map((item) => item.lessonDoc);
  }

  const fetchData = async () => {
    setIsLoading(true);

    const lessonResult = await getRecommendeds(HOMEHEADERLIST.HOME);
    console.log("resultTemp", lessonResult);
    const allLessonIds = await getHistory();
    if (allLessonIds) setValidLessonIds(allLessonIds);
    AvatarObj.getInstance().unlockedRewards =
      (await Util.getAllUnlockedRewards()) || [];
    setIsLoading(false);
  };
  async function isLinked() {
    const student = Util.getCurrentStudent();
    const conectedData = localStorage.getItem(IS_CONECTED);

    const parsedConectedData = conectedData ? JSON.parse(conectedData) : {};
    if (student && parsedConectedData[student.docId] != undefined) {
      linked = parsedConectedData[student.docId];
    }
    if (student) {
      if (linked == undefined) {
        linked = await api.isStudentLinked(student.docId);
        parsedConectedData[student.docId] = linked;
      } else {
        api.isStudentLinked(student.docId).then((value) => {
          parsedConectedData[student.docId] = value;
        });
      }

      localStorage.setItem(IS_CONECTED, JSON.stringify(parsedConectedData));
    }
    AvatarObj.getInstance().unlockedRewards =
      (await Util.getAllUnlockedRewards()) || [];
  }

  function urlOpenListenerEvent() {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      const slug = event.url.split(".cc").pop();
      if (slug === PAGES.LIVE_QUIZ && linked) {
        setCurrentHeader(HOMEHEADERLIST.LIVEQUIZ);
      } else {
        setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
      }
      if (slug) {
        history.replace(slug);
      }
    });
  }

  const api = ServiceConfig.getI().apiHandler;

  async function getAssignments(): Promise<Lesson[]> {
    let reqLes: Lesson[] = [];
    // setIsLoading(true);
    const student = await Util.getCurrentStudent();

    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return [];
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
      let liveQuizCount = 0;
      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(
            _assignment.lesson.id,
            undefined,
            true,
            _assignment
          );
          console.log(res);
          if (_assignment.type !== LIVE_QUIZ) {
            count++;
          } else {
            liveQuizCount++;
          }
          if (!!res) {
            res.assignment = _assignment;
            reqLes.push(res);
          }
        })
      );
      setPendingLiveQuizCount(liveQuizCount);
      setPendingAssignmentsCount(count);

      // setDataCourse(reqLes);
      // storeRecommendationsInLocalStorage(reqLes);
      // setIsLoading(true);
      return reqLes;
    } else {
      // setIsLoading(false);
      return [];
    }
  }

  async function getRecommendeds(
    subjectCode: string
  ): Promise<Lesson[] | undefined> {
    let recommendationResult: Lesson[] = [];
    setIsLoading(true);
    const currentStudent = await Util.getCurrentStudent();

    if (!currentStudent) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    setCurrentStudent(currentStudent);
    const currClass = schoolUtil.getCurrentClass();
    if (!!currClass) setCurrentClass(currClass);
    if (
      subjectCode === HOMEHEADERLIST.HOME ||
      subjectCode === HOMEHEADERLIST.SUGGESTIONS
    ) {
      if (!localData.allCourses) {
        let tempAllCourses = await api.getAllCourses();
        localData.allCourses = tempAllCourses;
      }
      try {
        recommendationResult = await getAssignments();
        let tempRecommendations = await getCourseRecommendationLessons(
          currentStudent,
          currClass
        );
        recommendationResult = recommendationResult.concat(tempRecommendations);
        console.log("Final RECOMMENDATION List ", recommendationResult);
        setDataCourse(recommendationResult);
        return recommendationResult;
      } catch (error) {
        console.error("Error fetching recommendation:", error);
      }
    }
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
      setIsLoading(false);
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

  const getHistory = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    const studentResult = await api.getStudentResult(currentStudent.docId);

    if (studentResult?.lessons) {
      const playedLessonData = studentResult.lessons;
      const sortedLessonDocIds = sortPlayedLessonDocByDate(playedLessonData);
      const allValidPlayedLessonDocIds = sortedLessonDocIds.filter(
        (lessonDoc) => lessonDoc !== undefined
      );
      return allValidPlayedLessonDocIds;
    }
  };

  const currentStudentDocId = Util.getCurrentStudent()?.docId;
  // const storeRecommendationsInLocalStorage = (recommendations: any[]) => {
  //   const recommendationsInLocal = localStorage.getItem(
  //     `${currentStudentDocId}-${RECOMMENDATIONS}`
  //   );
  //   let existingRecommendations: any[] = [];

  //   if (recommendationsInLocal !== null) {
  //     existingRecommendations = JSON.parse(recommendationsInLocal);
  //   }

  //   if (!lessonResultMap && existingRecommendations.length === 0) {
  //     let lessonMap = new Map();

  //     for (let i = 0; i < recommendations.length; i++) {
  //       const lesson = recommendations[i];
  //       if (lesson.cocosSubjectCode && lesson.id) {
  //         lessonMap[lesson.cocosSubjectCode] = lesson.id;
  //       }
  //     }

  //     localStorage.setItem(
  //       `${currentStudentDocId}-${RECOMMENDATIONS}`,
  //       JSON.stringify(lessonMap)
  //     );
  //     setDataCourse(existingRecommendations.concat(lessonMap) as Lesson[]);
  //   } else {
  //     setDataCourse(existingRecommendations);
  //   }
  // };

  async function getCourseRecommendationLessons(
    currentStudent: User,
    currClass: Class | undefined
  ): Promise<Lesson[]> {
    //   const recommendationsInLocal = localStorage.getItem(
    //     `${currentStudentDocId}-${RECOMMENDATIONS}`
    //   );
    //   let existingRecommendations: any[] = [];

    //   if (recommendationsInLocal !== null) {
    //     existingRecommendations = JSON.parse(recommendationsInLocal);
    //   }

    //   if (!lessonResultMap && existingRecommendations.length === 0) {
    //     let lessonMap = new Map();

    //     for (let i = 0; i < recommendations.length; i++) {
    //       const lesson = recommendations[i];
    //       if (lesson.cocosSubjectCode && lesson.id) {
    //         lessonMap[lesson.cocosSubjectCode] = lesson.id;
    //       }
    //     }

    //     localStorage.setItem(
    //       `${currentStudentDocId}-${RECOMMENDATIONS}`,
    //       JSON.stringify(lessonMap)
    //     );
    //     setDataCourse(existingRecommendations.concat(lessonMap) as Lesson[]);
    //   } else {
    //     setDataCourse(existingRecommendations);
    //   }

    let reqLes: Lesson[] = [];
    setIsLoading(true);
    let tempResultLessonMap:
      | { [lessonDocId: string]: StudentLessonResult }
      | undefined = {};
    const sortLessonResultByDate = (lesMap: {
      [lessonDocId: string]: StudentLessonResult;
    }) => {
      if (!lesMap) {
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
    // console.log("tempResultLessonMap = res;", JSON.stringify(res));
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
              // setDataCourse(reqLes);
            }
          } else {
            console.log("Wrong place");
            console.log(element, "lessons pushed");
            reqLes.push(element as Lesson);
            // setDataCourse(reqLes);
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
              // setDataCourse(reqLes);
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
        // setDataCourse(reqLes);
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
          // setDataCourse(reqLes);
          // return;
        }
      });
      console.log("reqLes in if.", reqLes);
    }
    console.log("reqLes outside.", reqLes);
    // setDataCourse(reqLes);
    // storeRecommendationsInLocalStorage(reqLes);
    setIsLoading(false);
    // return sortLessonResultMap;
    return reqLes;
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
  async function onHeaderIconClick(selectedHeader: any) {
    let reqLes: Lesson[] = [];
    var headerIconList: HeaderIconConfig[] = [];
    DEFAULT_HEADER_ICON_CONFIGS.forEach((element) => {
      //  console.log("elements", element);
      headerIconList.push(element);
    });
    setCurrentHeader(selectedHeader);
    localStorage.setItem("currentHeader", selectedHeader);
    localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    DEFAULT_HEADER_ICON_CONFIGS.get(selectedHeader);
    switch (selectedHeader) {
      // case HOMEHEADERLIST.SUBJECTS:
      //   history.replace(PAGES.DISPLAY_SUBJECTS);
      //   break;
      case HOMEHEADERLIST.HOME:
        handleHomeIconClick();
        // setCourse(HOMEHEADERLIST.RECOMMENDATION);
        // if (currentStudent) {
        //   reqLes = await getCourseRecommendationLessons(
        //     currentStudent,
        //     currentClass
        //   );
        //   setDataCourse(reqLes);
        // }
        break;
      case HOMEHEADERLIST.PROFILE:
        Util.setPathToBackButton(PAGES.LEADERBOARD, history);
        break;
      // case HOMEHEADERLIST.SEARCH:
      //   history.replace(PAGES.SEARCH);
      //   break;
      // case HOMEHEADERLIST.ASSIGNMENT:
      //   history.replace(PAGES.ASSIGNMENT);
      //   break;
      // case HOMEHEADERLIST.QUIZ:
      //   history.replace(PAGES.HOME);
      // break;
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
    setIsLoading(true);
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
    setIsLoading(false);
  };

  const updateHistoryLessons = async (allLessonIds) => {
    setIsLoading(true);
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
    setIsLoading(false);
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
          pendingLiveQuizCount={pendingLiveQuizCount}
        ></HomeHeader>
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME && !!canShowAvatar ? (
              <ChimpleAvatar
                recommadedSuggestion={dataCourse}
                style={{
                  marginBottom: "2vh",
                  display: "flex",
                  justifyContent: "space-around",
                }}
              ></ChimpleAvatar>
            ) : null}

            {currentHeader === HOMEHEADERLIST.SUBJECTS && <Dashboard />}

            {currentHeader === HOMEHEADERLIST.ASSIGNMENT && <AssignmentPage />}

            {currentHeader === HOMEHEADERLIST.SEARCH && <SearchLesson />}
            {currentHeader === HOMEHEADERLIST.LIVEQUIZ && <LiveQuiz />}

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
                (!canShowAvatar && currentHeader === HOMEHEADERLIST.HOME)) && (
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
                      showDate={true}
                    />
                  )}

                  {value === SUBTAB.FAVOURITES && (
                    <>
                      {!!favouriteLessons && favouriteLessons.length > 0 ? (
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
                      ) : (
                        <p>{t("No liked lessons available.")}</p>
                      )}
                    </>
                  )}

                  {value === SUBTAB.HISTORY && (
                    <>
                      {!!historyLessons && historyLessons.length > 0 ? (
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
                      ) : (
                        <p>{t("No played lessons available.")}</p>
                      )}
                    </>
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
              (!canShowAvatar && currentHeader === HOMEHEADERLIST.HOME)) && (
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
        <SkeltonLoading isLoading={isLoading} header={currentHeader} />
      </div>
    </IonPage>
  );
};
export default Home;
