import { IonPage, IonHeader } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import {
  HOMEHEADERLIST,
  PAGES,
  PREVIOUS_SELECTED_COURSE,
  HeaderIconConfig,
  DEFAULT_HEADER_ICON_CONFIGS,
  MODES,
  CONTINUE,
  LIVE_QUIZ,
  SHOW_DAILY_PROGRESS_FLAG,
  IS_CONECTED,
  TableTypes,
  RECOMMENDATIONS,
} from "../common/constants";
import "./Home.css";
import LessonSlider from "../components/LessonSlider";
import HomeHeader from "../components/HomeHeader";
import { useHistory, useLocation } from "react-router";
// Default theme
import "@splidejs/react-splide/css";
// or only core styles
import "@splidejs/react-splide/css/core";
import { Util } from "../utility/util";
import { ServiceConfig } from "../services/ServiceConfig";
import { Timestamp } from "firebase/firestore";
import { schoolUtil } from "../utility/schoolUtil";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { t } from "i18next";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import ChimpleAvatar from "../components/animation/ChimpleAvatar";
import SearchLesson from "./SearchLesson";
import AssignmentPage from "./Assignment";
import Subjects from "./Subjects";
import LiveQuiz from "./LiveQuiz";
import SkeltonLoading from "../components/SkeltonLoading";
import { AvatarObj } from "../components/animation/Avatar";

const localData: any = {};
const Home: FC = () => {
  const [dataCourse, setDataCourse] = useState<TableTypes<"lesson">[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const [pendingAssignments, setPendingAssignments] = useState<
    TableTypes<"assignment">[]
  >([]);
  const [pendingLiveQuizCount, setPendingLiveQuizCount] = useState<number>(0);
  const history = useHistory();
  const [favouriteLessons, setFavouriteLessons] = useState<
    TableTypes<"lesson">[]
  >([]);
  const [favouritesPageSize, setFavouritesPageSize] = useState<number>(10);
  const [historyLessons, setHistoryLessons] = useState<TableTypes<"lesson">[]>(
    []
  );
  const [validLessonIds, setValidLessonIds] = useState<string[]>([]);
  const [allFavLessons, setAllFavLessons] = useState<TableTypes<"lesson">[]>(
    []
  );
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
  const appStateChange = (isActive) => {
    urlOpenListenerEvent();
    Util.onAppStateChange({ isActive });
  };
  useEffect(() => {
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "true");
    Util.checkDownloadedLessonsFromLocal();
    initData();
    setCurrentHeader(HOMEHEADERLIST.HOME);
    setSubTab(SUBTAB.SUGGESTIONS);
    getCanShowAvatar();
    if (!!urlParams.get(CONTINUE)) {
      setCurrentHeader(currentHeader);
    }
    App.addListener("appStateChange", ({ isActive }) =>
      appStateChange(isActive)
    );
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
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    const studentResult = await api.getStudentResultInMap(student.id);
    if (!!studentResult) {
      setLessonResultMap(studentResult);
    }
    fetchData();
    await isLinked();
    urlOpenListenerEvent();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("page") === PAGES.JOIN_CLASS) {
      setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
    } else if (urlParams.get("page") === PAGES.LIVE_QUIZ) {
      if (linked) setCurrentHeader(HOMEHEADERLIST.LIVEQUIZ);
      else setCurrentHeader(HOMEHEADERLIST.ASSIGNMENT);
    }
  };

  function sortPlayedLessonDocByDate(playedLessonData: TableTypes<"result">[]) {
    const lessonArray: { lessonDoc: string; combinedTime: number }[] = [];
    for (const lessonDoc of playedLessonData) {
      const lessonDate = Timestamp.fromDate(
        new Date(lessonDoc?.updated_at ?? "")
      );
      const combinedTime =
        lessonDate.seconds * 1000000000 + lessonDate.nanoseconds;
      lessonArray.push({ lessonDoc: lessonDoc.lesson_id ?? "", combinedTime });
    }
    lessonArray.sort((a, b) => b.combinedTime - a.combinedTime);
    return lessonArray.map((item) => item.lessonDoc);
  }

  const fetchData = async () => {
    setIsLoading(true);

    const lessonResult = await getRecommendeds(HOMEHEADERLIST.HOME);
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
    if (student && parsedConectedData[student.id] != undefined) {
      linked = parsedConectedData[student.id];
    }
    if (student) {
      if (linked == undefined) {
        linked = await api.isStudentLinked(student.id);
        parsedConectedData[student.id] = linked;
      } else {
        api.isStudentLinked(student.id).then((value) => {
          parsedConectedData[student.id] = value;
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

  async function getAssignments(): Promise<TableTypes<"lesson">[]> {
    let reqLes: TableTypes<"lesson">[] = [];
    // setIsLoading(true);
    const student = Util.getCurrentStudent();

    // const studentResult = await api.getStudentResult(student.id, false);
    const linkedData =
      student != null
        ? await api.getStudentClassesAndSchools(student.id)
        : null;

    if (
      student != null &&
      !!linkedData &&
      !!linkedData.classes &&
      linkedData.classes.length > 0
    ) {
      const allAssignments: TableTypes<"assignment">[] = [];

      await Promise.all(
        linkedData.classes.map(async (_class) => {
          const res = await api.getPendingAssignments(_class.id, student.id);
          allAssignments.push(...res);
        })
      );
      let count = 0;
      let liveQuizCount = 0;
      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(_assignment.lesson_id);
          console.log(res);
          if (_assignment.type !== LIVE_QUIZ) {
            count++;
          } else {
            liveQuizCount++;
          }
          if (!!res) {
            // res.assignment = _assignment;
            reqLes.push(res);
          }
        })
      );
      setPendingLiveQuizCount(liveQuizCount);
      setPendingAssignments(allAssignments);

      setDataCourse(reqLes);
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
  ): Promise<TableTypes<"lesson">[] | undefined> {
    let recommendationResult: TableTypes<"lesson">[] = [];
    setIsLoading(true);
    const currentStudent = await Util.getCurrentStudent();

    if (!currentStudent) {
      // history.replace(PAGES.SELECT_MODE);
      return;
    }
    const currClass = schoolUtil.getCurrentClass();
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
        let tempRecommendations =
          await getCourseRecommendationLessons(currentStudent);
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
  const [subTab, setSubTab] = useState(SUBTAB.SUGGESTIONS);

  const handleChange = async (event: any, newValue: SUBTAB) => {
    setSubTab(newValue);
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
    setSubTab(SUBTAB.SUGGESTIONS);
  };

  const getLessonsForChapter = async (
    chapter: TableTypes<"chapter">
  ): Promise<TableTypes<"lesson">[]> => {
    setIsLoading(true);
    if (!chapter || !chapter.id) {
      setIsLoading(false);
      return [];
    }
    const lessons = await api.getLessonsForChapter(chapter.id ?? "");
    setIsLoading(false);
    return lessons;
  };

  const getHistory = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    const studentResult = await api.getStudentResult(currentStudent.id, false);

    if (studentResult) {
      const playedLessonData = studentResult;
      console.log("🚀 ~ getHistory ~ playedLessonData:", playedLessonData);
      const sortedLessonDocIds = sortPlayedLessonDocByDate(playedLessonData);
      const allValidPlayedLessonDocIds = sortedLessonDocIds.filter(
        (lessonDoc) => lessonDoc !== undefined
      );
      return allValidPlayedLessonDocIds;
    }
  };

  const sortLessonResultByDate = (lesMap: {
    [lessonDocId: string]: TableTypes<"result">;
  }) => {
    if (!lesMap) {
      return;
    }
    console.log("Object.entries(lesMap)", lesMap, Object.entries(lesMap));
    const lesList = Object.entries(lesMap).sort((a, b) => {
      if (new Date(a[1].updated_at ?? "") === new Date(b[1].updated_at ?? "")) {
        return 0;
      } else {
        return new Date(a[1].updated_at ?? "") > new Date(b[1].updated_at ?? "")
          ? -1
          : 1;
      }
    });

    // Rebuild the map after sorting it.
    let tempLesMap: {
      [lessonDocId: string]: TableTypes<"result">;
    } = {};
    lesList.forEach((res) => (tempLesMap[res[0]] = res[1]));
    return tempLesMap;
  };

  async function getCourseRecommendationLessons(
    currentStudent: TableTypes<"user">
  ): Promise<TableTypes<"lesson">[]> {
    // const allCourses: TableTypes<"course">[] =
    //   await api.getCoursesForParentsStudent(currentStudent.id);
    // console.log("allCourses ", allCourses);
    // const lessons = await api.getAllLessonsForCourse(allCourses[0].id);
    // console.log("const lessons ", lessons);
    let tempRecommendedLesson = await api.getRecommendedLessons(
      currentStudent.id
    );
    return tempRecommendedLesson;
  }

  async function onHeaderIconClick(selectedHeader: any) {
    let reqLes: TableTypes<"lesson">[] = [];
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

  const updateFavouriteLessons = async (allLessonIds: string[]) => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    let favLessons = allFavLessons;
    if (!favLessons || favLessons.length < 1) {
      favLessons = await api.getFavouriteLessons(currentStudent.id);
    }

    setFavouriteLessons(favLessons);
    // const favouritesStartIndex = (tempPageNumber - 1) * favouritesPageSize;
    // const favouritesEndIndex = favouritesStartIndex + favouritesPageSize;

    // const lessonsForFavourite = favLessons.slice(
    //   favouritesStartIndex,
    //   favouritesEndIndex
    // );
    // favouriteLessons.push(...lessonsForFavourite);
    // setFavouriteLessons((_favouriteLessons) => {
    //   _favouriteLessons.push(...lessonsForFavourite);
    //   return _favouriteLessons;
    // });
    setIsLoading(false);
  };

  const updateHistoryLessons = async (allLessonIds: string[]) => {
    console.log("🚀 ~ updateHistoryLessons ~ allLessonIds:", allLessonIds);
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

    const lessonsForHistory: (TableTypes<"lesson"> | undefined)[] =
      await Promise.all(lessonPromisesForHistory);
    const validLessonsForHIstory: TableTypes<"lesson">[] =
      lessonsForHistory.filter(
        (lesson): lesson is TableTypes<"lesson"> => lesson !== undefined
      );

    const latestTenPlayedLessons = historyLessons.slice(0, 10);
    setValidLessonIds(allLessonIds);
    setHistoryLessons((_historyLessons) => {
      _historyLessons.push(...validLessonsForHIstory);
      return _historyLessons;
    });
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
          pendingAssignmentCount={pendingAssignments.length}
          pendingLiveQuizCount={pendingLiveQuizCount}
        ></HomeHeader>
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME && !!canShowAvatar ? (
              <ChimpleAvatar
                recommadedSuggestion={dataCourse}
                assignments={pendingAssignments}
                style={{
                  marginBottom: "2vh",
                  display: "flex",
                  justifyContent: "space-around",
                }}
              ></ChimpleAvatar>
            ) : null}

            {currentHeader === HOMEHEADERLIST.SUBJECTS && <Subjects />}

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

            {(subTab === SUBTAB.SUGGESTIONS ||
              subTab === SUBTAB.FAVOURITES ||
              subTab === SUBTAB.HISTORY) &&
              ((canShowAvatar &&
                currentHeader === HOMEHEADERLIST.SUGGESTIONS) ||
                (!canShowAvatar && currentHeader === HOMEHEADERLIST.HOME)) && (
                <div>
                  {subTab === SUBTAB.SUGGESTIONS && (
                    <LessonSlider
                      lessonData={dataCourse}
                      isHome={true}
                      course={undefined}
                      lessonsScoreMap={lessonResultMap || {}}
                      assignments={pendingAssignments}
                      startIndex={0}
                      showSubjectName={true}
                      showChapterName={true}
                      showDate={true}
                    />
                  )}

                  {subTab === SUBTAB.FAVOURITES && (
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

                  {subTab === SUBTAB.HISTORY && (
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
                      value={subTab}
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
                          setSubTab(SUBTAB.SUGGESTIONS);
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
                          setSubTab(SUBTAB.FAVOURITES);
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
                          setSubTab(SUBTAB.HISTORY);
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
