import { IonPage, IonHeader } from "@ionic/react";
import { useEffect, useState } from "react";
import {
  COURSES,
  HEADERLIST,
  CURRENT_LESSON_LEVEL,
  PAGES,
  PREVIOUS_SELECTED_COURSE,
  PRE_QUIZ,
  ALL_COURSES,
  PREVIOUS_PLAYED_COURSE,
} from "../common/constants";
import Curriculum from "../models/curriculum";
import "./Home.css";
import LessonSlider from "../components/LessonSlider";
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
import { Util } from "../utility/util";

const Home: React.FC = () => {
  const [dataCourse, setDataCourse] = useState<{
    lessons: Lesson[];
    chapters: Chapter[];
  }>({
    lessons: [],
    chapters: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customSwiperRef, setCustomSwiperRef] = useState<Splide>();
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
      selectedCourse = HEADERLIST.HOME;
    }
    setCurrentHeader(selectedCourse);
    setCourse(selectedCourse);
  }, []);

  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    const apiInstance = OneRosterApi.getInstance();
    if (subjectCode === HEADERLIST.HOME) {
      let lessonScoreMap = {};
      const lessonMap = {};
      for (const course of ALL_COURSES) {
        const { chapters, lessons, tempResultLessonMap } =
          await getDataForSubject(course);
        lessonScoreMap = { ...lessonScoreMap, ...tempResultLessonMap };
        const currentLessonIndex = await Util.getCurrentLessonIndex(
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
      const prevPlayedCourse = localStorage.getItem(PREVIOUS_PLAYED_COURSE);
      let _lessons: Lesson[] = [...lessonMap[COURSES.ENGLISH]];
      if (prevPlayedCourse && prevPlayedCourse === COURSES.ENGLISH) {
        _lessons.splice(0, 0, lessonMap[COURSES.MATHS][0]);
        if (lessonMap[COURSES.MATHS].length > 1)
          _lessons.splice(2, 0, lessonMap[COURSES.MATHS][1]);
      } else {
        _lessons.splice(1, 0, lessonMap[COURSES.MATHS][0]);
        if (lessonMap[COURSES.MATHS].length > 1)
          _lessons.push(lessonMap[COURSES.MATHS][1]);
      }
      _lessons.push(lessonMap[COURSES.PUZZLE][0]);
      setLessonsScoreMap(lessonScoreMap);
      setDataCourse({ lessons: _lessons, chapters: [] });
      setIsLoading(false);
      return;
    }
    let { chapters, lessons, tempResultLessonMap, preQuiz } =
      await getDataForSubject(subjectCode);
    const _isPreQuizPlayed = subjectCode !== COURSES.PUZZLE && !!preQuiz;
    if (_isPreQuizPlayed) {
      if (lessons[0].id === subjectCode + "_" + PRE_QUIZ) {
        lessons = lessons.slice(1);
        chapters = chapters.slice(1);
      }
      const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
        subjectCode,
        preQuiz?.score ?? 0,
        chapters
      );
      setLevelChapter(tempLevelChapter);
    }
    const tempChapterMap: any = {};
    for (let i = 0; i < chapters.length; i++) {
      tempChapterMap[chapters[i].id] = i;
    }
    setLessonsScoreMap(tempResultLessonMap);
    setCurrentLevel(subjectCode, chapters, lessons);
    setChaptersMap(tempChapterMap);
    setCurrentChapterId(chapters[0].id);
    setDataCourse({ lessons: lessons, chapters: chapters });
    setIsLoading(false);
  }

  async function getDataForSubject(subjectCode: string) {
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
    const curInstance = Curriculum.getInstance();
    let chapters = await curInstance.allChapterForSubject(
      subjectCode,
      tempResultLessonMap
    );
    let lessons = await curInstance.allLessonForSubject(
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
    if (!chaptersMap) return;
    const chapter = dataCourse.lessons[lessonIndex].chapter;
    if (chapter.id === currentChapterId) return;
    const chapterIndex = chaptersMap[chapter.id];
    setCurrentChapterId(dataCourse.chapters[chapterIndex]?.id);
  }

  function onHeaderIconClick(selectedHeader: any) {
    switch (selectedHeader) {
      case HEADERLIST.HOME:
        setCurrentHeader(HEADERLIST.HOME);
        setCourse(HEADERLIST.HOME);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, HEADERLIST.HOME);
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
            {currentHeader !== HEADERLIST.HOME && (
              <ChapterSlider
                chapterData={dataCourse.chapters}
                onChapterClick={onChapterClick}
                currentChapterId={currentChapterId}
                chaptersIndex={chaptersMap[currentChapterId] ?? 0}
                levelChapter={levelChapter}
              />
            )}
            <LessonSlider
              lessonData={dataCourse.lessons}
              onSwiper={setCustomSwiperRef}
              onSlideChange={onCustomSlideChange}
              lessonsScoreMap={lessonsScoreMap}
              startIndex={
                currentHeader === HEADERLIST.HOME ? 0 : currentLessonIndex
              }
              showSubjectName={currentHeader === HEADERLIST.HOME}
            />
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </div>
    </IonPage>
  );
};
export default Home;
