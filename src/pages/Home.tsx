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
  SL_GRADES,
  SELECTED_GRADE,
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
import ChapterBar from "../components/ChapterBar";
import Auth from "../models/auth";

const Home: React.FC = () => {
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
  const [chaptersMap, setChaptersMap] = useState<any>();
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [lessonsScoreMap, setLessonsScoreMap] = useState<any>();
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
  const [levelChapter, setLevelChapter] = useState<Chapter>();
  const [gradeMap, setGradeMap] = useState<any>({});

  const history = useHistory();

  useEffect(() => {
    let selectedCourse = localStorage.getItem(PREVIOUS_SELECTED_COURSE());
    if (!selectedCourse) {
      selectedCourse = HEADERLIST.HOME;
    }

    let selectedGrade = localStorage.getItem(SELECTED_GRADE);
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

    if (selectedCourse === HEADERLIST.ENGLISH) {
      selectedCourse =
        gradeMap[HEADERLIST.ENGLISH] === SL_GRADES.GRADE1
          ? COURSES.ENGLISH_G1
          : COURSES.ENGLISH_G2;
    } else if (selectedCourse === HEADERLIST.MATHS) {
      selectedCourse =
        gradeMap[HEADERLIST.MATHS] === SL_GRADES.GRADE1
          ? COURSES.MATHS_G1
          : COURSES.MATHS_G2;
    }

    console.log("selectedCourse ", selectedCourse);

    // setCurrentHeader(selectedCourse);
    setCourse(selectedCourse);
  }, []);

  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    // const apiInstance = OneRosterApi.getInstance();
    if (subjectCode === HEADERLIST.HOME) {
      let lessonScoreMap = {};
      const lessonMap = {};
      for (const course of ALL_COURSES) {
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
      let _lessons: Lesson[] = [...lessonMap[COURSES.ENGLISH_G1]];
      if (prevPlayedCourse && prevPlayedCourse === COURSES.ENGLISH_G1) {
        _lessons.splice(0, 0, lessonMap[COURSES.MATHS_G1][0]);
        if (lessonMap[COURSES.MATHS_G1].length > 1)
          _lessons.splice(2, 0, lessonMap[COURSES.MATHS_G1][1]);
      } else {
        _lessons.splice(1, 0, lessonMap[COURSES.MATHS_G1][0]);
        if (lessonMap[COURSES.MATHS_G1].length > 1)
          _lessons.push(lessonMap[COURSES.MATHS_G1][1]);
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
      // const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
      //   subjectCode,
      //   preQuiz?.score ?? 0,
      //   chapters
      // );
      // setLevelChapter(tempLevelChapter);
    }
    const tempChapterMap: any = {};
    for (let i = 0; i < chapters.length; i++) {
      tempChapterMap[chapters[i].id] = i;
    }

    const currentLessonIndex =
      (await Util.getLastPlayedLessonIndex(
        subjectCode,
        lessons,
        chapters,
        tempResultLessonMap
      )) + 1;
    const currentLesson = lessons[currentLessonIndex] ?? lessons[0];
    const currentChapter = currentLesson.chapter ?? chapters[0];
    setCurrentChapter(currentChapter);
    const lessonChapterIndex = currentChapter.lessons
      .map((l) => l.id)
      .indexOf(currentLesson.id);
    setCurrentLessonIndex(lessonChapterIndex);

    setLessonsScoreMap(tempResultLessonMap);
    // setCurrentLevel(subjectCode, chapters, lessons);
    setChaptersMap(tempChapterMap);
    setDataCourse({ lessons: lessons, chapters: chapters });
    setIsLoading(false);
  }

  async function getDataForSubject(subjectCode: string) {
    const apiInstance = OneRosterApi.getInstance();
    const tempClass = await apiInstance.getClassForUserForSubject(
      Auth.i.sourcedId,
      subjectCode
    );
    const tempResultLessonMap =
      await apiInstance.getResultsForStudentsForClassInLessonMap(
        tempClass?.sourcedId ?? "",
        Auth.i.sourcedId
      );
    const curInstance = Curriculum.getInstance();
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
  // function onCustomSlideChange(lessonIndex: number) {
  // if (!chaptersMap) return;
  // const chapter = dataCourse.lessons[lessonIndex].chapter;
  // if (chapter.id === currentChapter?.id) return;
  // const chapterIndex = chaptersMap[chapter.id];
  // setCurrentChapter(dataCourse.chapters[chapterIndex]);
  // }

  function onHeaderIconClick(selectedHeader: any) {
    let course;
    switch (selectedHeader) {
      case HEADERLIST.HOME:
        setCurrentHeader(HEADERLIST.HOME);
        setCourse(HEADERLIST.HOME);
<<<<<<< HEAD
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, HEADERLIST.HOME);
        break;

      case HEADERLIST.ENGLISH:
        course =
          gradeMap[HEADERLIST.ENGLISH] === SL_GRADES.GRADE1
            ? COURSES.ENGLISH_G1
            : COURSES.ENGLISH_G2;
        setCurrentHeader(HEADERLIST.ENGLISH);
        setCourse(course);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, HEADERLIST.ENGLISH);
        break;

      case HEADERLIST.MATHS:
        course =
          gradeMap[HEADERLIST.MATHS] === SL_GRADES.GRADE1
            ? HEADERLIST.MATHS_G1
            : HEADERLIST.MATHS_G2;
        setCurrentHeader(HEADERLIST.MATHS);
        setCourse(course);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE, HEADERLIST.MATHS);
=======
        localStorage.setItem(PREVIOUS_SELECTED_COURSE(), HEADERLIST.HOME);
        console.log("Home Icons is selected");
>>>>>>> master
        break;

      case HEADERLIST.ENGLISH_G1:
        setCurrentHeader(HEADERLIST.ENGLISH_G1);
        setCourse(COURSES.ENGLISH_G1);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE(), COURSES.ENGLISH_G1);
        break;

      case HEADERLIST.MATHS_G1:
        setCurrentHeader(HEADERLIST.MATHS_G1);
        setCourse(COURSES.MATHS_G1);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE(), COURSES.MATHS_G1);
        break;

      case HEADERLIST.ENGLISH_G2:
        setCurrentHeader(HEADERLIST.ENGLISH_G2);
        setCourse(COURSES.ENGLISH_G2);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE(), COURSES.ENGLISH_G2);
        break;

      case HEADERLIST.MATHS_G2:
        setCurrentHeader(HEADERLIST.MATHS_G2);
        setCourse(COURSES.MATHS_G2);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE(), COURSES.MATHS_G2);
        break;

      case HEADERLIST.PUZZLE:
        setCurrentHeader(HEADERLIST.PUZZLE);
        setCourse(COURSES.PUZZLE);
        localStorage.setItem(PREVIOUS_SELECTED_COURSE(), COURSES.PUZZLE);
        break;

      case HEADERLIST.PROFILE:
        setCurrentHeader(HEADERLIST.PROFILE);
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
            {currentHeader !== HEADERLIST.HOME ? (
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
                  if (currentHeader === HEADERLIST.ENGLISH) {
                    course =
                      selectedGrade.detail.value === SL_GRADES.GRADE1
                        ? HEADERLIST.ENGLISH_G1
                        : HEADERLIST.ENGLISH_G2;
                    // currentHeader === HEADERLIST.ENGLISH
                  } else if (currentHeader === HEADERLIST.MATHS) {
                    course =
                      selectedGrade.detail.value === SL_GRADES.GRADE1
                        ? HEADERLIST.MATHS_G1
                        : HEADERLIST.MATHS_G2;
                  }
                  setCourse(course);
                  localStorage.setItem(PREVIOUS_SELECTED_COURSE, course);
                  localStorage.setItem(
                    SELECTED_GRADE,
                    JSON.stringify(gradeMap)
                  );
                }}
                currentGrade={gradeMap[currentHeader] || SL_GRADES.GRADE1}
                grades={[SL_GRADES.GRADE1, SL_GRADES.GRADE2]}
                showGrade={
                  currentHeader !== HEADERLIST.HOME &&
                  currentHeader !== HEADERLIST.PUZZLE
                }
              />
            ) : (
              <div style={{ marginTop: "2.6%" }}></div>
            )}
            <LessonSlider
              lessonData={
                currentHeader === HEADERLIST.HOME
                  ? dataCourse.lessons
                  : currentChapter?.lessons!
              }
              onSwiper={setLessonSwiperRef}
              // onSlideChange={onCustomSlideChange}
              lessonsScoreMap={lessonsScoreMap}
              startIndex={
                currentHeader === HEADERLIST.HOME ? 0 : currentLessonIndex - 1
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
