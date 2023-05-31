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
import RectangularIconButton from "../components/parent/RectangularIconButton";
import User from "../models/user";
import Course from "../models/course";
import { Chapter, StudentLessonResult } from "../common/courseConstants";
import Lesson from "../models/lesson";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { DocumentReference } from "firebase/firestore";
import LeaderBoardButton from "./LeaderBoardButton";

const Home: FC = () => {
  const [dataCourse, setDataCourse] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentStudent, setCurrentStudent] = useState<User>();
  const [lessonResultMap, setLessonResultMap] =
    useState<Map<string, StudentLessonResult>>();
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

  const history = useHistory();

  useEffect(() => {
    setCurrentHeader(HOMEHEADERLIST.RECOMMENDATION);
    setCourse(HOMEHEADERLIST.RECOMMENDATION);
  }, []);

  const api = ServiceConfig.getI().apiHandler;

  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    const currentStudent = await api.currentStudent;
    if (!currentStudent) {
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    }
    setCurrentStudent(currentStudent);
    // const apiInstance = OneRosterApi.getInstance();
    if (subjectCode === HOMEHEADERLIST.RECOMMENDATION) {
      let tempResultLessonMap: Map<string, StudentLessonResult> | undefined =
        new Map();
      await api
        .getLessonResultsForStudent(currentStudent.docId)
        .then(async (res) => {
          tempResultLessonMap = res;
          setLessonResultMap(res);
        });

      const sortLessonResultByDate = (
        lesMap: Map<string, StudentLessonResult>
      ) => {
        // lesMap.sort((a, b) => a.date.getTime() - b.date.getTime());
        if (!lesMap) {
          return;
        }
        const lesList = Array.from(lesMap)
          .map(([id, value]) => ({ id, ...value }))
          .sort((a, b) => {
            if (a.date === b.date) {
              return 0;
            } else {
              return a.date < b.date ? -1 : 1;
            }
          });

        // Rebuild the map after sorting it.
        const tempLesMap = new Map();
        lesList.forEach((res) => tempLesMap.set(res.id, res));
        return tempLesMap;
      };

      let sortLessonResultMap = sortLessonResultByDate(tempResultLessonMap);

      let lessonScoreMap = {};
      const lessonMap = {};
      const courses: Course[] = await api.getCoursesForParentsStudent(
        currentStudent
      );
      setCourses(courses);
      let reqLes: Lesson[] = [];

      for (const tempCourse of courses) {
        // const course = tempCourse;

        // const res = await FirebaseApi.i.getLessonFromCourse(
        //   tempCourse,
        //   tempCourse.chapters[0].id
        // ); //await getDataForSubject(tempCourse);
        // if (!res) {
        //   setIsLoading(false);
        //   return;
        // }

        let islessonPushed = false;
        if (
          tempResultLessonMap === undefined &&
          tempCourse.chapters[0].id === tempCourse.courseCode + "_quiz"
        ) {
          const tempLes = tempCourse.chapters[0].lessons;
          tempLes.forEach(async (l) => {
            if (l instanceof DocumentReference) {
              const lessonObj = await api.getLessonFromCourse(tempCourse, l.id);
              // await res.lessons[tempCourse.courseCode][l.id];
              if (lessonObj) {
                console.log(lessonObj, "lessons pushed");
                reqLes.push(lessonObj as Lesson);
              }
            } else {
              console.log(l, "lessons pushed");
              reqLes.push(l as Lesson);
            }
          });
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
              if (!tempResultLessonMap || !tempResultLessonMap.get(lesson.id)) {
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
                islessonPushed = true;
                break;
              }
            }
          }
          islessonPushed = false;
        }

        //Last Played Lessons

        for (let c = 0; c < tempCourse.chapters.length; c++) {
          if (islessonPushed) {
            break;
          }
          const chapter = tempCourse.chapters[c];

          for (let l = 0; l < chapter.lessons.length; l++) {
            const lesson = chapter.lessons[l];
            if (sortLessonResultMap && sortLessonResultMap.get(lesson.id)) {
              // if (lesson instanceof DocumentReference) {
              const lessonObj = await api.getLessonFromCourse(
                tempCourse,
                lesson.id
              );
              // await res.lessons[tempCourse.courseCode][
              //   lesson.id
              // ];
              if (!lessonObj) {
                return;
              }
              console.log("last played ", lessonObj, "lessons pushed");
              if (lessonObj.id != tempCourse.courseCode + "_" + PRE_QUIZ) {
                reqLes.push((lessonObj || lesson) as Lesson);
                islessonPushed = true;
                break;
              }
            }
          }
        }

        setDataCourse(reqLes);
      }
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
    // setCurrentChapter(currentChapter);
    // const lessonChapterIndex = currentChapter.lessons
    //   .map((l) => l.id)
    //   .indexOf(currentLesson.id);
    // setCurrentLessonIndex(lessonChapterIndex);

    // setLessonsScoreMap(tempResultLessonMap);
    // setCurrentLevel(subjectCode, chapters, lessons);
    // setChaptersMap(tempChapterMap);
    // setDataCourse({ lessons: lessons, chapters: chapters });
    setIsLoading(false);
  }

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
      // console.log("elements", element);
      headerIconList.push(element);
    });

    setCurrentHeader(selectedHeader);
    localStorage.setItem(PREVIOUS_SELECTED_COURSE(), selectedHeader);
    HEADER_ICON_CONFIGS.get(selectedHeader);
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
              <div>
                <LessonSlider
                  lessonData={dataCourse}
                  isHome={true}
                  course={undefined}
                  lessonsScoreMap={lessonResultMap || new Map()}
                  startIndex={0}
                  showSubjectName={true}
                />
              </div>
            ) : (
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
                // name={"Leaderboard"}
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
