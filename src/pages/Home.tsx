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
  const [nextChapter, setNextChapter] = useState<Chapter>();
  const [previousChapter, setPreviousChapter] = useState<Chapter>();
  const [chaptersMap, setChaptersMap] = useState<any>();
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [lessonsScoreMap, setLessonsScoreMap] = useState<any>();
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
  const [levelChapter, setLevelChapter] = useState<Chapter>();
  const [gradeMap, setGradeMap] = useState<any>({});
  const [favouriteLessons, setFavouriteLessons] = useState<Lesson[]>([]);
  const [favouritesPageSize, setFavouritesPageSize] = useState<number>(10); 
  const [favouritesPageNumber, setFavouritesPageNumber] = useState<number>(1);
  const [historyPageNumber, setHistoryPageNumber] = useState<number>(1);
  const [initialFavoriteLessons, setInitialFavoriteLessons] = useState<
    Lesson[]
  >([]);
  const [initialHistoryLessons, setInitialHistoryLessons] = useState<Lesson[]>(
    []
  );
  const [historyLessons, setHistoryLessons] = useState<Lesson[]>([]);
  const [validLessonIds, setValidLessonIds] = useState<string[]>([]);

  const history = useHistory();

  const handleLoadMoreHistoryLessons = () => {
    setHistoryPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  useEffect(() => {
    const updateHistoryLessons = async () => {
      const currentStudent = await Util.getCurrentStudent();
      if (!currentStudent || !lessonResultMap) {
        return;
      }
  
      const lessonPromises = validLessonIds.map((lessonId) =>
        api.getLesson(lessonId)
      );
      const lessons: (Lesson | undefined)[] = await Promise.all(lessonPromises);
      const validLessons: Lesson[] = lessons.filter(
        (lesson): lesson is Lesson => lesson !== undefined
      );
  
      const sortedValidLessons = validLessons
        .sort((a, b) => {
          const lessonResultA = lessonResultMap[a.docId];
          const lessonResultB = lessonResultMap[b.docId];
  
          if (!lessonResultA || !lessonResultB) {
            return 0;
          }
  
          return lessonResultB.date.toMillis() - lessonResultA.date.toMillis();
        });
  
      const startIndex = (historyPageNumber - 1) * favouritesPageSize;
      const endIndex = startIndex + favouritesPageSize;
  
      const newHistoryLessonsForPage = sortedValidLessons
        .slice(startIndex, endIndex);
  
      const updatedHistoryLessons = [
        ...historyLessons,
        ...newHistoryLessonsForPage,
       
      ];
      const latestTenPlayedLessons = updatedHistoryLessons.slice(0,10);
      setHistoryLessons(updatedHistoryLessons);
      setInitialHistoryLessons([...latestTenPlayedLessons]);
    };
    updateHistoryLessons();
  }, [historyPageNumber, lessonResultMap]);
 
  const handleLoadMoreLessons = () => {
    if (currentHeader === HOMEHEADERLIST.FAVOURITES) {
      setFavouritesPageNumber((prevPageNumber) => prevPageNumber + 1);
    }
  };

  useEffect(() => {
    const updateLessonResultMap = async () => {
      if (currentHeader === HOMEHEADERLIST.FAVOURITES) {
        if (currentStudent) {
          const updatedLessonResultMap = await api.getStudentResult(
            currentStudent.docId
          );
          setLessonResultMap(updatedLessonResultMap?.lessons);
        }
      }
    };
    updateLessonResultMap();
  }, [currentHeader, currentStudent]);

  useEffect(() => {
    setCurrentHeader(HOMEHEADERLIST.HOME);
    setCourse(HOMEHEADERLIST.HOME);
    setValue(SUBTAB.SUGGESTIONS);
    getHistory();
    urlOpenListenerEvent();
  }, []);

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
      getRecommendationLessons(currentStudent, currClass).then(() => {
        console.log("Final RECOMMENDATION List ", reqLes);
        setDataCourse(reqLes);
      });
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

  const handleChange = (event: React.SyntheticEvent, newValue: SUBTAB) => {
    setValue(newValue);
    if (newValue === SUBTAB.HISTORY) {
      if (lessonResultMap) {
       
        const startIndex = (historyPageNumber - 1) * favouritesPageSize;
        const endIndex = startIndex + favouritesPageSize;
        

        const initialHistoryLessonsSlice = initialHistoryLessons
          .slice(startIndex, endIndex);
        setHistoryLessons([...initialHistoryLessonsSlice]);
      }
      setHistoryPageNumber(1);
    } else if (newValue === SUBTAB.FAVOURITES) {
      console.log("handlechange favourite");
      if (lessonResultMap) {
        const startIndex = (favouritesPageNumber - 1) * favouritesPageSize;
        const endIndex = startIndex + favouritesPageSize;

        const initialFavouriteLessonsSlice = initialFavoriteLessons
          .slice(startIndex, endIndex);
        setFavouriteLessons([...initialFavouriteLessonsSlice]);
      }
      setFavouritesPageNumber(1);
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
    setIsLoading(true);

    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }

    const studentResult = await api.getStudentResult(currentStudent.docId);

    if (studentResult?.lessons) {
      const playedLessonIds = Object.keys(studentResult.lessons);
      const validLessonIds = playedLessonIds.filter(
        (lessonId) => lessonId !== undefined
      );

      const sortedPlayedLessonsList = sortValidLessonsByDate(
        validLessonIds,
        lessonResultMap || {}
      );
      setValidLessonIds(sortedPlayedLessonsList);
    }
    setIsLoading(false);
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
    api.getStudentResult(currentStudent.docId).then(async (res) => {
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

useEffect(() => {
  // Function to update the favouriteLessons state
  const updateFavouriteLessons = async () => {
    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent || !lessonResultMap) {
      return;
    }
  
    const lessonPromises = validLessonIds.map((lessonId) =>
      api.getLesson(lessonId)
    );
    const lessons: (Lesson | undefined)[] = await Promise.all(lessonPromises);
    const validLessons: Lesson[] = lessons.filter(
      (lesson): lesson is Lesson => lesson !== undefined
    );
  
    const sortedValidLessons = validLessons
      .sort((a, b) => {
        const lessonResultA = lessonResultMap[a.docId];
        const lessonResultB = lessonResultMap[b.docId];
  
        if (!lessonResultA || !lessonResultB) {
          return 0;
        }
  
        return lessonResultB.date.toMillis() - lessonResultA.date.toMillis();
      });
  
    const startIndex = (favouritesPageNumber - 1) * favouritesPageSize;
    const endIndex = startIndex + favouritesPageSize;
  
    const newLovedLessonsForPage = sortedValidLessons
      .filter((lesson) => {
        const lessonResult = lessonResultMap?.[lesson.docId];
        return lessonResult?.isLoved ?? false;
      })
      .slice(startIndex, endIndex);
  
    const updatedFavouriteLessons = [
      ...favouriteLessons,
      ...newLovedLessonsForPage,
      
    ];
    const latestTenFavouriteLessons = updatedFavouriteLessons.slice(0, 10);
    console.log("updatedFavouriteLessons", updatedFavouriteLessons);
    setFavouriteLessons(updatedFavouriteLessons);
    setInitialFavoriteLessons([...latestTenFavouriteLessons]);
  };
  updateFavouriteLessons();
}, [favouritesPageNumber, lessonResultMap]);

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
