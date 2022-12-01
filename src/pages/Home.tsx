import { IonPage, IonHeader } from "@ionic/react";
import { useEffect, useState } from "react";
import {
  COURSES,
  HEADERLIST,
  CURRENT_LESSON_LEVEL,
  PAGES,
  PREVIOUS_SELECTED_COURSE,
  PRE_QUIZ,
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
  const [levelChapter, setLevelChapter] = useState<Chapter>();

  const history = useHistory();

  useEffect(() => {
    let selectedCourse = localStorage.getItem(PREVIOUS_SELECTED_COURSE);
    if (!selectedCourse) {
      selectedCourse = COURSES.ENGLISH;
    }
    setCurrentHeader(selectedCourse);
    setCourse(selectedCourse);
  }, []);

  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    const apiInstance = OneRosterApi.getInstance();
    const tempClass = await apiInstance.getClassForUserForSubject(
      "user",
      subjectCode
    );
    console.log("tempClass", tempClass);
    const tempResultLessonMap =
      await apiInstance.getResultsForStudentsForClassInLessonMap(
        tempClass?.sourcedId ?? "",
        "user"
      );
    const preQuiz = tempResultLessonMap[subjectCode + "_" + PRE_QUIZ];
    const curInstance = Curriculum.getInstance();
    let chapters = await curInstance.allChapterForSubject(
      subjectCode,
      tempResultLessonMap
    );
    let lessons = await curInstance.allLessonForSubject(
      subjectCode,
      tempResultLessonMap
    );
    const _isPreQuizPlayed = subjectCode !== COURSES.PUZZLE && !!preQuiz;
    if (_isPreQuizPlayed) {
      const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
        subjectCode,
        preQuiz?.score ?? 0,
        chapters
      );
      setLevelChapter(tempLevelChapter);
    }
    setIsPreQuizPlayed(!!preQuiz);
    setLessonsScoreMap(tempResultLessonMap);
    if (_isPreQuizPlayed) {
      if (lessons[0].id === subjectCode + "_" + PRE_QUIZ) {
        lessons = lessons.slice(1);
        chapters = chapters.slice(1);
      }
    }
    const tempChapterMap: any = {};
    for (let i = 0; i < chapters.length; i++) {
      tempChapterMap[chapters[i].id] = i;
    }
    setCurrentLevel(subjectCode, chapters, lessons);
    setSubject(subjectCode);
    setChaptersMap(tempChapterMap);
    setDataCourse({ lessons: lessons, chapters: chapters });
    setCurrentChapterId(chapters[0].id);
    setIsLoading(false);
  }

  function setCurrentLevel(
    subjectCode: string,
    chapters: Chapter[],
    lessons: Lesson[]
  ) {
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
              levelChapter={levelChapter}
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
