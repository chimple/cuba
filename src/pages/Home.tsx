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
  HEADER_ICON_CONFIGS,
  CURRENT_STUDENT,
  CURRENT_CLASS,
  MODES,
  CURRENT_MODE,
} from "../common/constants";
import CurriculumController from "../models/curriculumController";
import "./Home.css";
import LessonSlider from "../components/LessonSlider";
import Loading from "../components/Loading";
import { Splide } from "@splidejs/react-splide";
import HomeHeader from "../components/HomeHeader";
import { useHistory } from "react-router";
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
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { auto } from "@popperjs/core";
import { margin } from "@mui/system";
import { push } from "ionicons/icons";
import { t } from "i18next";
import { App, URLOpenListenerEvent } from "@capacitor/app";

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

    return lessonResultB.date.toMillis() - lessonResultA.date.toMillis();
  });
};

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
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
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

  const history = useHistory();
  let allPlayedLessonIds: string[] = [];
  let tempPageNumber = 1;

  useEffect(() => {
    setCurrentHeader(HOMEHEADERLIST.HOME);
    setValue(SUBTAB.SUGGESTIONS);
    fetchData();
    urlOpenListenerEvent();
  }, []);

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
        history.push(slug);
      }
    });
  }

  const api = ServiceConfig.getI().apiHandler;

  async function setCourse(subjectCode: string) {
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
    const courses: Course[] = await api.getCoursesForParentsStudent(
      currentStudent
    );
    const allLessonIds: string[] = [];

    // for (const course of courses) {
    //   for (const chapter of course.chapters) {
    //     for (const lesson of chapter.lessons) {
    //       allLessonIds.push(lesson.id);
    //     }
    //   }
    // }
    // console.log("validlessonIds", allLessonIds);
    // // setValidLessonIds(allLessonIds);
    // return allLessonIds;

    const studentResult = await api.getStudentResult(currentStudent.docId);

    if (studentResult?.lessons) {
      const playedLessonIds = Object.keys(studentResult.lessons);
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
    const res = await api
      .getStudentResult(currentStudent.docId)
      .then(async (res) => {
        console.log("tempResultLessonMap = res;", JSON.stringify(res));
        tempResultLessonMap = res?.lessons;
        setLessonResultMap(res?.lessons);
        if (tempResultLessonMap) {
          console.log("tempResultLessonMap", tempResultLessonMap);
          sortLessonResultMap = sortLessonResultByDate(tempResultLessonMap);
          console.log("sortLessonResultMap ", sortLessonResultMap);
        }
      });

    const courses: Course[] = await (currMode === MODES.SCHOOL && !!currClass
      ? api.getCoursesForClassStudent(currClass)
      : api.getCoursesForParentsStudent(currentStudent));
    setCourses(courses);

    for (const tempCourse of courses) {
      setIsLoading(true);
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
              console.log(lessonObj, "lessons pushed");
              reqLes.push(lessonObj as Lesson);
              setDataCourse(reqLes);
            }
          } else {
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
                console.log(lessonObj, "lessons pushed");
                reqLes.push(lessonObj as Lesson);
              }
              // } else {
              //   console.log(lesson, "lessons pushed");
              //   reqLes.push(lesson);
              // }
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
    HEADER_ICON_CONFIGS.forEach((element) => {
      //  console.log("elements", element);
      headerIconList.push(element);
    });
    setCurrentHeader(selectedHeader);
    localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    HEADER_ICON_CONFIGS.get(selectedHeader);
    switch (selectedHeader) {
      case HOMEHEADERLIST.SUBJECTS:
        history.push(PAGES.DISPLAY_SUBJECTS);
        break;
      case HOMEHEADERLIST.HOME:
        handleHomeIconClick();
        // setCourse(HOMEHEADERLIST.RECOMMENDATION);
        if (currentStudent) {
          getRecommendationLessons(currentStudent, currentClass).then(() => {
            console.log("Final RECOMMENDATION List ", reqLes);
            setDataCourse(reqLes);
          });
        }
        break;
      case HOMEHEADERLIST.PROFILE:
        history.push(PAGES.LEADERBOARD);
        break;
      case HOMEHEADERLIST.SEARCH:
        history.push(PAGES.SEARCH);
        break;
      case HOMEHEADERLIST.ASSIGNMENT:
        history.push(PAGES.ASSIGNMENT);
        break;
      case HOMEHEADERLIST.QUIZ:
        history.push(PAGES.HOME);
        break;
      default:
        break;
    }
  }

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

    const validLessonsForFavourite: Lesson[] = lessonsForFavourite
      .filter((lesson): lesson is Lesson => lesson !== undefined)
      .filter((lesson) => {
        const lessonResult = lessonResultMap?.[lesson.docId];
        return lessonResult?.isLoved ?? false;
      });

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
        ></HomeHeader>
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME ? (
              <div>
                <LessonSlider
                  lessonData={dataCourse}
                  isHome={true}
                  course={undefined}
                  lessonsScoreMap={lessonResultMap || {}}
                  startIndex={0}
                  showSubjectName={true}
                />
              </div>
            ) : // <div style={{ marginTop: "2.6%" }}></div>
            null}

            {currentHeader === HOMEHEADERLIST.FAVOURITES && (
              <div>
                <LessonSlider
                  lessonData={favouriteLessons}
                  isHome={true}
                  course={undefined}
                  lessonsScoreMap={lessonResultMap || {}}
                  startIndex={0}
                  showSubjectName={true}
                  onEndReached={handleLoadMoreLessons}
                />
              </div>
            )}

            {currentHeader === HOMEHEADERLIST.HISTORY && (
              <div>
                <LessonSlider
                  lessonData={historyLessons}
                  isHome={true}
                  course={undefined}
                  lessonsScoreMap={lessonResultMap || {}}
                  startIndex={0}
                  showSubjectName={true}
                  onEndReached={handleLoadMoreHistoryLessons}
                />
              </div>
            )}

            {/* To show lesson cards after clicking on header icon  */}

            {/* {currentHeader !== HEADERLIST.RECOMMENDATION ? (
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
            )}
            
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
            {currentHeader !== HOMEHEADERLIST.QUIZ && (
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
                        label={t("Suggestion")}
                        onClick={() => setCurrentHeader(HOMEHEADERLIST.HOME)}
                      />
                      <Tab
                        id="home-page-sub-tab"
                        label={t("Favourite")}
                        onClick={() =>
                          setCurrentHeader(HOMEHEADERLIST.FAVOURITES)
                        }
                      />

                      <Tab
                        id="home-page-sub-tab"
                        label={t("History")}
                        onClick={() => setCurrentHeader(HOMEHEADERLIST.HISTORY)}
                      />
                    </Tabs>
                  </Box>
                </AppBar>
              </div>
            )}
            {/* <div id="home-leaderboard-button">
              <LeaderBoardButton
                iconSrc={"assets/icons/LeaderboardIcon.svg"}
                // name={"Leaderboard"}
                onHeaderIconClick={() => {
                  history.replace(PAGES.LEADERBOARD);
                  // if (currentHeader != element.header) {
                  //   onHeaderIconClick(element.header);
                  // }
                }}
              />
            </div> */}
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </div>
    </IonPage>
  );
};
export default Home;
