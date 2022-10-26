import { IonPage, IonHeader, IonContent, IonCol } from "@ionic/react";
import { useEffect, useState } from "react";
import {
  COURSES,
  HEADERLIST,
  CURRENT_LESSON_LEVEL,
  PAGES,
  PREVIOUS_SELECTED_COURSE,
} from "../common/constants";
import Curriculum from "../models/curriculum";
import "./Home.css";
import CustomSlider from "../components/CustomSlider";
import Loading from "../components/Loading";
import ChapterSlider from "../components/ChapterSlider";
import { Chapter, Lesson } from "../interface/curriculumInterfaces";
import { Splide } from "@splidejs/react-splide";
import { OneRosterApi } from "../services/OneRosterApi";
import HomeHeader from "../components/HomeHeader";
import { useHistory } from "react-router";
// Default theme
import "@splidejs/react-splide/css";
// or only core styles
import "@splidejs/react-splide/css/core";

const Home: React.FC = () => {
  const [dataCourse, setDataCourse] = useState<{
    lessons: Lesson[];
    chapters: Chapter[];
  }>({
    lessons: [],
    chapters: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subject, setSubject] = useState<string>();
  const [customSwiperRef, setCustomSwiperRef] = useState<Splide>();
  const [isPreQuizPlayed, setIsPreQuizPlayed] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState("");
  const [chaptersMap, setChaptersMap] = useState<any>();
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [lessonsScoreMap, setLessonsScoreMap] = useState<any>();
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);

  const history = useHistory();

  useEffect(() => {
    let selectedCourse = localStorage.getItem(PREVIOUS_SELECTED_COURSE);
    if (!selectedCourse) {
      selectedCourse = COURSES.ENGLISH;
    }
    setCurrentHeader(selectedCourse);
    setCourse(selectedCourse);
    // history.listen((location, action) => {
    //   if (
    //     (action === "POP" || action === "REPLACE") &&
    //     location.pathname === PAGES.HOME
    //   ) {
    //     refreshScore(subject ?? COURSES.ENGLISH);
    //     Curriculum.i.clear();
    //   }
    // });
  }, []);

  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    const curInstanse = Curriculum.getInstance();
    const lessons = await curInstanse.allLessonforSubject(subjectCode);
    const chapters = await curInstanse.allChapterforSubject(subjectCode);
    await new Promise((r) => setTimeout(r, 100));
    const apiInstance = OneRosterApi.getInstance();
    const _isPreQuizPlayed = await apiInstance.isPreQuizDone(
      subjectCode,
      "",
      ""
    );
    const tempChapterMap: any = {};
    for (let i = 0; i < chapters.length; i++) {
      tempChapterMap[chapters[i].id] = i;
    }
    // if (!lessonsScoreMap) {
    await setScore(subjectCode);
    // }
    setSubject(subjectCode);
    setChaptersMap(tempChapterMap);
    setDataCourse({ lessons: lessons, chapters: chapters });
    setCurrentChapterId(chapters[0].id);
    setIsPreQuizPlayed(_isPreQuizPlayed);
    setIsLoading(false);
    setCurrentLevel(subjectCode, chapters, lessons);
  }

  function setCurrentLevel(subjectCode, chapters, lessons) {
    const currentLessonJson = localStorage.getItem(CURRENT_LESSON_LEVEL);
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
      setCurrentChapterId(chapters[0].id);
    }
  }

  function onChapterClick(e: any) {
    const firstLessonId = e.lessons[0].id;
    const lessonIndex = dataCourse.lessons.findIndex(
      (lesson: any) => lesson.id === firstLessonId
    );
    customSwiperRef?.go(lessonIndex);
    setCurrentChapterId(e.id);
  }
  function onCustomSlideChange(lessonIndex: number) {
    const chapter = dataCourse.lessons[lessonIndex].chapter;
    if (chapter.id === currentChapterId) return;
    const chapterIndex = chaptersMap[chapter.id];
    setCurrentChapterId(dataCourse.chapters[chapterIndex].id);
  }

  function onHeaderIconClick(selectedHeader: any) {

    switch (selectedHeader) {
      case HEADERLIST.HOME:
        setCurrentHeader(HEADERLIST.HOME);
        console.log("Home Icons is selected");
        break;

      case HEADERLIST.ENGLISH:
        setCurrentHeader(HEADERLIST.ENGLISH);
        setCourse(COURSES.ENGLISH);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, COURSES.ENGLISH);
        break;

      case HEADERLIST.MATHS:
        setCurrentHeader(HEADERLIST.MATHS);
        setCourse(COURSES.MATHS);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, COURSES.MATHS);
        break;

      case HEADERLIST.PUZZLE:
        setCurrentHeader(HEADERLIST.PUZZLE);
        setCourse(COURSES.PUZZLE);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, COURSES.PUZZLE);
        break;

      case HEADERLIST.PROFILE:
        setCurrentHeader(HEADERLIST.PROFILE);
        console.log("Profile Icons is selected");
        history.push(PAGES.PROFILE);
        break;

      default:
        break;
    }
  }
  async function refreshScore(subjectCode: string) {
    setIsLoading(true);
    await setScore(subjectCode);
    setIsLoading(false);
  }

  async function setScore(subjectCode: string) {
    const apiInstance = OneRosterApi.getInstance();
    const tempClass = await apiInstance.getClassForUserForSubject(
      "",
      subjectCode
    );
    const tempLessonMap =
      await apiInstance.getResultsForStudentsForClassInLessonMap(
        tempClass?.sourcedId ?? "",
        ""
      );
    setLessonsScoreMap(tempLessonMap);
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
            <ChapterSlider
              chapterData={dataCourse.chapters}
              onChapterClick={onChapterClick}
              currentChapterId={currentChapterId}
              chaptersIndex={chaptersMap[currentChapterId] ?? 0}
            />
            <CustomSlider
              lessonData={dataCourse.lessons}
              onSwiper={setCustomSwiperRef}
              onSlideChange={onCustomSlideChange}
              subjectCode={subject ?? COURSES.ENGLISH}
              isPreQuizPlayed={isPreQuizPlayed}
              lessonsScoreMap={lessonsScoreMap}
              startIndex={currentLessonIndex}
            />
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </div>
    </IonPage>
  );
};
export default Home;
