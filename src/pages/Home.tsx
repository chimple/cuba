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
} from "../common/constants";
import CurriculumController from "../models/curriculumController";
import "./Home.css";
import LessonSlider from "../components/LessonSlider";
import Loading from "../components/Loading";
import { Chapter, Lesson } from "../interface/curriculumInterfaces";
import { Splide } from "@splidejs/react-splide";
import HomeHeader from "../components/HomeHeader";
import { useHistory } from "react-router";
// Default theme
import "@splidejs/react-splide/css";
// or only core styles
import "@splidejs/react-splide/css/core";
import { Util } from "../utility/util";
import Auth from "../models/auth";
import { OneRosterApi } from "../services/api/OneRosterApi";
import { ServiceConfig } from "../services/ServiceConfig";
import LeaderBoardButton from "./LeaderBoardButton";

const Home: FC = () => {
  const [dataCourse, setDataCourse] = useState<{
    lessons: Lesson[];
    chapters: Chapter[];
  }>({
    lessons: [],
    chapters: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lessonSwiperRef, setLessonSwiperRef] = useState<Splide>();
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [nextChapter, setNextChapter] = useState<Chapter>();
  const [previousChapter, setPreviousChapter] = useState<Chapter>();
  const [chaptersMap, setChaptersMap] = useState<any>();
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [lessonsScoreMap, setLessonsScoreMap] = useState<any>();
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
  const [levelChapter, setLevelChapter] = useState<Chapter>();
  const [gradeMap, setGradeMap] = useState<any>({});

  const history = useHistory();

  useEffect(() => {
    if (!ServiceConfig.getI().apiHandler.currentStudent) {
      history.replace(PAGES.DISPLAY_STUDENT);
    }
    let selectedCourse = localStorage.getItem(PREVIOUS_SELECTED_COURSE());
    if (!selectedCourse || !ALL_COURSES.includes(selectedCourse as COURSES)) {
      selectedCourse = HOMEHEADERLIST.RECOMMENDATION;
    }

    let selectedGrade = localStorage.getItem(SELECTED_GRADE());
    if (!selectedGrade) {
      setGradeMap({ en: SL_GRADES.GRADE1, maths: SL_GRADES.GRADE1 });
      console.log("if (!selectedGrade) {", gradeMap);
    } else {
      setGradeMap(JSON.parse(selectedGrade));
      console.log("else (!selectedGrade) {", gradeMap);
    }
    console.log("selectedCourse ", selectedCourse);

    setCurrentHeader(selectedCourse);

    console.log("selectedCourse ", selectedCourse);

    selectedCourse = Util.getCourseByGrade(selectedCourse);

    console.log("selectedCourse ", selectedCourse);

    // setCurrentHeader(selectedCourse);
    setCourse(selectedCourse);
  }, []);

  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    // const apiInstance = OneRosterApi.getInstance();
    if (subjectCode === HOMEHEADERLIST.RECOMMENDATION) {
      let lessonScoreMap = {};
      const lessonMap = {};
      for (const tempCourse of ALL_COURSES) {
        const course = Util.getCourseByGrade(tempCourse);
        const { chapters, lessons, tempResultLessonMap } =
          await getDataForSubject(course);
        lessonScoreMap = { ...lessonScoreMap, ...tempResultLessonMap };
        const currentLessonIndex = await Util.getLastPlayedLessonIndex(
          course,
          lessons,
          chapters,
          tempResultLessonMap
        );
        lessonMap[course] =
          lessons.length > currentLessonIndex + 1 &&
          lessons[currentLessonIndex + 1].isUnlock
            ? [lessons[currentLessonIndex + 1]]
            : [];
        if (
          currentLessonIndex > 0 &&
          course !== COURSES.PUZZLE &&
          lessons[currentLessonIndex].isUnlock
        ) {
          lessonMap[course].push(lessons[currentLessonIndex]);
        }
      }
      const prevPlayedCourse = localStorage.getItem(PREVIOUS_PLAYED_COURSE());
      console.log("lessonMap", lessonMap);
      // Util.getCourseByGrade(tempCourse);
      let _lessons: Lesson[] = [
        ...lessonMap[Util.getCourseByGrade(COURSES.ENGLISH)],
      ];
      if (
        prevPlayedCourse &&
        prevPlayedCourse === Util.getCourseByGrade(COURSES.ENGLISH)
      ) {
        _lessons.splice(
          0,
          0,
          lessonMap[Util.getCourseByGrade(COURSES.MATHS)][0]
        );
        if (lessonMap[Util.getCourseByGrade(COURSES.MATHS)].length > 1)
          _lessons.splice(
            2,
            0,
            lessonMap[Util.getCourseByGrade(COURSES.MATHS)][1]
          );
      } else {
        _lessons.splice(
          1,
          0,
          lessonMap[Util.getCourseByGrade(COURSES.MATHS)][0]
        );
        if (lessonMap[Util.getCourseByGrade(COURSES.MATHS)].length > 1)
          _lessons.push(lessonMap[Util.getCourseByGrade(COURSES.MATHS)][1]);
      }
      _lessons.push(lessonMap[COURSES.PUZZLE][0]);
      setLessonsScoreMap(lessonScoreMap);
      setDataCourse({ lessons: _lessons, chapters: [] });
      setIsLoading(false);
      return;
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
    // console.log("get chap", currentChapter.id);
    // setCurrentChapter(currentChapter);
    // const lessonChapterIndex = currentChapter.lessons
    //   .map((l) => l.id)
    //   .indexOf(currentLesson.id);
    // setCurrentLessonIndex(lessonChapterIndex);

    // setLessonsScoreMap(tempResultLessonMap);
    // // setCurrentLevel(subjectCode, chapters, lessons);
    // setChaptersMap(tempChapterMap);
    // setDataCourse({ lessons: lessons, chapters: chapters });
    // setIsLoading(false);
  }

  async function getDataForSubject(subjectCode: string) {
    const apiInstance = OneRosterApi.getInstance();
    const tempClass = await apiInstance.getClassForUserForSubject(
      Auth.i.sourcedId,
      subjectCode
    );
    // if (
    //   !tempClass &&
    //   Capacitor.getPlatform() === "android" &&
    //   Auth.i.userAccountName !== DEBUG_15
    // ) {
    //   const isUserLoggedOut = Auth.i.authLogout();
    //   Util.showLog("No classes Found for user");
    //   if (isUserLoggedOut) {
    //     history.replace(PAGES.LOGIN);
    //   }
    // }
    const tempResultLessonMap =
      await apiInstance.getResultsForStudentsForClassInLessonMap(
        tempClass?.docId ?? "",
        Auth.i.sourcedId
      );
    const curInstance = CurriculumController.getInstance();
    const chapters = await curInstance.allChapterForSubject(
      subjectCode,
      tempResultLessonMap
    );
    const lessons = await curInstance.allLessonForSubject(
      subjectCode,
      tempResultLessonMap
    );
    const preQuiz = tempResultLessonMap[subjectCode + "_" + PRE_QUIZ];
    return {
      chapters: chapters,
      lessons: lessons,
      tempResultLessonMap: tempResultLessonMap,
      preQuiz: preQuiz,
    };
  }

  function setCurrentLevel(
    subjectCode: string,
    chapters: Chapter[],
    lessons: Lesson[]
  ) {
    const currentLessonJson = localStorage.getItem(CURRENT_LESSON_LEVEL());
    let currentLessonLevel: any = {};
    if (currentLessonJson) {
      currentLessonLevel = JSON.parse(currentLessonJson);
    }

    const currentLessonId = currentLessonLevel[subjectCode];
    if (currentLessonId != undefined) {
      const lessonIndex: number = lessons.findIndex(
        (lesson: any) => lesson.id === currentLessonId
      );
      setCurrentLessonIndex(lessonIndex <= 0 ? 0 : lessonIndex);
    } else {
      setCurrentChapter(chapters[0]);
    }
  }

  function onChapterClick(e: any) {
    const chapter = dataCourse.chapters[chaptersMap[e.detail.value]];

    const tempCurrentIndex =
      Util.getLastPlayedLessonIndexForLessons(
        chapter.lessons,
        lessonsScoreMap
      ) + 1;
    setCurrentLessonIndex(tempCurrentIndex);
    setCurrentChapter(chapter);
  }

  function onArrowClick(e: any, b: boolean) {
    const chapter = b
      ? dataCourse.chapters[chaptersMap[e] + 1]
      : dataCourse.chapters[chaptersMap[e] - 1];
    const tempCurrentIndex =
      Util.getLastPlayedLessonIndexForLessons(
        chapter.lessons,
        lessonsScoreMap
      ) + 1;
    setCurrentLessonIndex(tempCurrentIndex);
    setCurrentChapter(chapter);
    console.log(currentChapter);
  }
  // function onCustomSlideChange(lessonIndex: number) {
  // if (!chaptersMap) return;
  // const chapter = dataCourse.lessons[lessonIndex].chapter;
  // if (chapter.id === currentChapter?.id) return;
  // const chapterIndex = chaptersMap[chapter.id];
  // setCurrentChapter(dataCourse.chapters[chapterIndex]);
  // }

  function onHeaderIconClick(selectedHeader: any) {
    var headerIconList: HeaderIconConfig[] = [];
    HEADER_ICON_CONFIGS.forEach((element) => {
      // console.log("elements", element);
      headerIconList.push(element);
    });

    setCurrentHeader(selectedHeader);
    localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    HEADER_ICON_CONFIGS.get(selectedHeader);
    console.log(selectedHeader, " Icons is selected");
    switch (selectedHeader) {
      case HOMEHEADERLIST.HOME:
        history.push(PAGES.DISPLAY_SUBJECTS);
        break;
      case HOMEHEADERLIST.RECOMMENDATION:
        setCourse(HOMEHEADERLIST.RECOMMENDATION);
        break;
      case HOMEHEADERLIST.PROFILE:
        history.push(PAGES.PROFILE);
        break;
      case HOMEHEADERLIST.SEARCH:
        history.push(PAGES.SEARCH);
        break;
      case HOMEHEADERLIST.ASSIGNMENT:
        history.push(PAGES.ASSIGNMENT);
        break;
      default:
        break;
    }
  }

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
            {currentHeader === HOMEHEADERLIST.RECOMMENDATION ? (
              <div></div>
            ) : (
              // <LessonSlider
              //   lessonData={
              //     currentHeader === HEADERLIST.RECOMMENDATION
              //       ? dataCourse.lessons
              //       : currentChapter?.lessons!
              //   }
              //   chaptersData={dataCourse.chapters}
              //   currentChapter={currentChapter!}
              //   onChapterChange={onArrowClick}
              //   isHome={
              //     currentHeader === HEADERLIST.RECOMMENDATION ? true : false
              //   }
              //   onSwiper={setLessonSwiperRef}
              //   // onSlideChange={onCustomSlideChange}
              //   lessonsScoreMap={lessonsScoreMap}
              //   startIndex={
              //     currentHeader === HEADERLIST.RECOMMENDATION
              //       ? 0
              //       : currentLessonIndex - 1
              //   }
              //   showSubjectName={currentHeader === HEADERLIST.RECOMMENDATION}
              // />
              <div style={{ marginTop: "2.6%" }}></div>
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
            <div id="home-leaderboard-button">
              <LeaderBoardButton
                iconSrc={"assets/icons/LeaderboardIcon.svg"}
                name={"Leaderboard"}
                isButtonEnable={true}
                onHeaderIconClick={() => {
                  history.replace(PAGES.LEADERBOARD);
                  // if (currentHeader != element.header) {
                  //   onHeaderIconClick(element.header);
                  // }
                }}
              />
            </div>
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </div>
    </IonPage>
  );
};
export default Home;
