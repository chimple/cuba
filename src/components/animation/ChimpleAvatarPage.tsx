import { FC, useEffect, useState } from "react";
import { HiSpeakerWave } from "react-icons/hi2";
import ChimpleAvatarCharacterComponent from "./ChimpleAvatarCharacterComponent";
import AudioComponent from "./AudioButtonComponent";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";
import RectangularTextButton from "./RectangularTextButton";
import AvatarImageOption from "./AvatarImageOption";
import { ServiceConfig } from "../../services/ServiceConfig";
import lesson from "../../models/lesson";
import { Util } from "../../utility/util";
// import Course from "../../models/course";
import { CONTINUE, COURSES, PAGES, RECOMMENDATIONS } from "../../common/constants";
import { relative } from "path";
import DisplayStudents from "../../pages/DisplayStudents";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import "./ChimpleAvatarPage.css";

import { Chapter } from "../../common/courseConstants";
// import { getFirestore } from "@firebase/firestore";
import {
  DocumentReference,
  doc,
  getFirestore,
  enableNetwork,
  disableNetwork,
  query,
  where,
  getDoc,
  collection,
  getDocs,
  DocumentData,
} from "firebase/firestore";
import { any } from "prop-types";
import { async } from "q";
import { useHistory } from "react-router";
import { language } from "ionicons/icons";
import { string } from "yargs";
import { t } from "i18next";


interface RecommendedCourse {
  title?: string;
  chapters?: string[];
  language: string;
  courseCode?: string;
}
interface Chapters {
  id: string;
  title: string;
}




export enum AvatarModes {
  Welcome,
  CourseSuggestion,
  ChapterSuggestion,
  LessonSuggestion,
  TwoOptionQuestion,
  FourOptionQuestion,
  ShowDailyProgress,
  // scores >= 70
  GoodProgress,

  // scores < 70
  BadProgress,
  Welcomedummy,
  Welcomedummy2
}

export enum CourseNames {
  en = "English",
  maths = "Maths",
  hi = "Hindi",
  puzzle = "Puzzle"
}

const ChimpleAvatarPage: FC<{
  style;
  isUnlocked?: boolean;
  // lesson: Lesson;
  // course: Course | undefined;
}> = ({ style, isUnlocked }) => {

  const [currentMode, setCurrentMode] = useState<AvatarModes>(
    AvatarModes.Welcome
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentChaptersList, setCurrentChaptersList] = useState<string | null>(null);
  const [currentCourseTitle, setCurrentCourseTitle] = useState<RecommendedCourse | null>(null);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<any>();
  const [userChoice, setUserChoice] = useState<any>();
  const [currentImgCode, setCurrentImgCode] = useState<any>();
  const [currentImgId, setCurrentImgId] = useState<any>();
  const [currentImgThumnail, setCurrentImgThumnail] = useState<any>();
  const [recCourseIndex, setRecCourseIndex] = useState<any>();
  const [currentCCodeOfRec, setCurrentCCodeRec] = useState<any>();
  const [recChapters, setRecChapters] = useState<any>();
  const [cuReChapter, setCuReChapter] = useState<any>();
  const [cuRecLessonId, setCuRecLessonId] = useState<any>();
  const [cuRecLessons, setCuRecLessons] = useState<any>();
  const [cuRecLesson, setCuRecLesson] = useState<any>();



  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [currentWebsrc, setCurrentWebSrc] = useState<any>(null);
  const [lessonId, setLessonId] = useState<any>();
  const db = getFirestore();
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  let chaptersList: Chapters[] = [];
  let chaptersListForChapterMode = "";
  let chapterTitle = "";
  let selectedLessonID: { [key: string]: string } = {};
  let cleanedCocosChapterCode = "";
  let localRecommendData: string[];
  let courseData: any;
  let currentWebsrc1: any;
  let currentLocalSrc1: any;
  let courses1: Course[] = [];
  let courseTitle = "";
  const localData: any = {};

  // let element : any;

  const api = ServiceConfig.getI().apiHandler;
  let currentLanguageIndex = 0;

  const fetchData = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (currentStudent) {
      courses1 = await api.getCoursesForParentsStudent(currentStudent);
      console.log("Student Courses chimpleavatarpage ", courses1);
    }
  };
  fetchData();

  const getLessonsForChapter = async (chapter: Chapter): Promise<Lesson[]> => {
    // setIsLoading(true);
    if (!chapter) {
      // setIsLoading(false);
      return [];
    }
    const lessons = await api.getLessonsForChapter(chapter);
    localData.lessons = lessons;
    console.log("lessons in getLessonsforChapter", lessons);
    setCuRecLessons(lessons);
    // setIsLoading(false);
    return lessons;
  };


  // const COMMON_AUDIOS = [
  //   "let_us_start_our_learning_journey",
  //   "may_i_help_you",
  //   "my_name_is_chimple",
  //   "i_am_hungry",
  // ];

  // const ACHIEVEMENT_AUDIOS = [
  //   "congratulations",
  //   "excellent",
  //   "you_are_getting_better",
  //   "i_enjoyed_eating",
  // ];

  // const NONACHIEVEMENT_AUDIOS = ["try_again", "may_i_help_you"];

  // const questions_list_from_remote = [
  //   ["mode", "question", "image", "answer", "chocie 1", "chocie 2"],
  //   [
  //     AvatarModes.TwoOptionQuestion,
  //     "Guess the animal",
  //     "tiger.png",
  //     "tiger",
  //     "Lion",
  //     "tiger",
  //   ],
  // ];

  // let avatarCurrentMode;
  // let avatarInfo;
  // let avatarAudio;

  // // async function inti() {
  // //   avatarInfo = await ServiceConfig.getI().apiHandler.getAvatarInfo();
  // // }

  // switch (avatarCurrentMode) {
  //   case AvatarModes.CourseSugestion:
  //     //Set Default Audio
  //     avatarAudio = "let_us_start_our_learning_journey";
  //     break;

  //   case AvatarModes.LessonSugestion:
  //     //Set Default Audio
  //     avatarAudio = "let_us_start_our_learning_journey";
  //     break;
  //   case AvatarModes.GoodProgress:
  //     avatarAudio =
  //       ACHIEVEMENT_AUDIOS[
  //         Math.floor(Math.random() * ACHIEVEMENT_AUDIOS.length)
  //       ];

  //     break;
  //   case AvatarModes.BadProgress:
  //     avatarAudio =
  //       NONACHIEVEMENT_AUDIOS[
  //         Math.floor(Math.random() * NONACHIEVEMENT_AUDIOS.length)
  //       ];
  //     break;
  //   case AvatarModes.TwoOptionQuestion:
  //     avatarAudio = "answer_the_following_question";
  //     let currentQuestion = questions_list_from_remote[1];
  //     break;
  // }

  // useEffect(() => {
  //   // getCurrentCourse();
  //   fetchCourses();
  // }, [lesson]);
  let temp: string;
  let currentCourseCode = "";
  let chapters1: Chapters[] = [];

  const currentStudentDocId = Util.getCurrentStudent()?.docId;
  const recommendationsInLocal = localStorage.getItem(`${currentStudentDocId}-${RECOMMENDATIONS}`);
  const recommendations = recommendationsInLocal
    ? JSON.parse(recommendationsInLocal)
    : {};
  console.log("Avatar data", recommendations);


  const handleButtonClick = async (choice: string) => {
    console.log("choicechoicechoicechoice", choice)
    // Handle button clicks based on the current mode
    switch (currentMode) {
      case AvatarModes.Welcome:
        if (choice === "Start") {
          setUserChoice("Success");
          const languages = Object.keys(recommendations);
          localRecommendData = Object.keys(recommendations);
          currentCourseCode = languages[0];
          const selectedCourse = courses1.find((course) => course.courseCode === currentCourseCode);

          setCurrentCourse(selectedCourse);

          // Get chapters from the selected course directly
          const chapters = selectedCourse?.chapters || [];
          // setCurrentChaptersList(chapters);
          setCurrentCCodeRec(selectedCourse?.courseCode);
          setTimeout(() => {
            setUserChoice("Fail");
            setCurrentMode(AvatarModes.Welcomedummy);
          }, 2000);
          // setCurrentMode(AvatarModes.Welcomedummy);
        } else if (choice === "no") {
          setUserChoice("Fail");
        }
        break;
      case AvatarModes.Welcomedummy:
        setUserChoice("uiui");
        setTimeout(() => {
          setCurrentMode(AvatarModes.CourseSuggestion);
        }, 5);
        break;
      case AvatarModes.CourseSuggestion:

        console.log("entered course suggestion", currentCCodeOfRec);
        let languages = Object.keys(recommendations);
        currentLanguageIndex = languages.findIndex(lang => lang === currentCCodeOfRec);
        if (choice === "yes") {
          setUserChoice("Success1");
          const recommendedLessonId = recommendations[currentCCodeOfRec];
          console.log("reommendedLessonId", recommendedLessonId);
          setCuRecLessonId(recommendedLessonId);
          if (recommendedLessonId) {
            const matchingCourse = courses1.find(course => course.courseCode === currentCCodeOfRec);
            console.log("matchingCourse", matchingCourse);

            if (matchingCourse) {
              console.log("matchingCourse", matchingCourse);

              const chapters = matchingCourse.chapters;
              console.log("matching chapters", chapters);
              setRecChapters(chapters);

              // const res = await api.getLesson(recommendedLessonId, undefined, true);
              // const ans = await api.getLesson(recommendedLessonId.toLowerCase());
              const tempLesson = await api. getLessonWithCocosLessonId(recommendedLessonId);
              // const lessonObj = await api.getLessonFromCourse(
              //   matchingCourse,
              //   recommendedLessonId.toLowerCase()
              // );
              console.log("res in avatar", tempLesson);

              let matchingChapter = chapters.find(chapter =>
                chapter.id.toLowerCase() === recommendedLessonId.toLowerCase()
              );

              if (matchingChapter === undefined) {
                if (tempLesson && tempLesson.id === recommendedLessonId) {
                  const cocosChapterCode = tempLesson.cocosChapterCode;
                  console.log('cocosChapterCode:', cocosChapterCode);
                  if (cocosChapterCode)
                    matchingChapter = chapters.find(chapter =>
                      chapter.id.toLowerCase() === cocosChapterCode.toLowerCase()
                    );
                  // Do something with the cocosChapterCode
                } else {
                  // Handle the case where the tempLesson with the matching ID is not found
                  console.log('Temp lesson not found for the recommendedLessonId:', recommendedLessonId);
                }

              }

              setCuReChapter(matchingChapter);

              console.log("matchingChapter", matchingChapter);

              if (matchingChapter) {
                console.log("currentChapter in recommendedChapter", matchingChapter.title);
                setCurrentChapter(matchingChapter.title);
              }
            }
          }
          setTimeout(() => {
            setUserChoice("Idle");
            setCurrentMode(AvatarModes.Welcomedummy2);
          }, 2000);
          // setCurrentMode(AvatarModes.ChapterSuggestion);
        } else if (choice === "no") {

          setUserChoice("Fail");
          const languages = Object.keys(recommendations);
          const nextIndex = currentLanguageIndex + 1;
          if (nextIndex < languages.length) {
            const nextLanguage = languages[nextIndex];
            setCurrentCCodeRec(nextLanguage);
            const selectedCourse = courses1.find((course) => course.courseCode === nextLanguage);
            setCurrentCourse(selectedCourse);

          }
          setTimeout(() => {
            setUserChoice("Success");
            setCurrentMode(AvatarModes.Welcomedummy2);
          }, 2000);
          // setCurrentMode(AvatarModes.Welcomedummy2);
        }

        break;
      case AvatarModes.Welcomedummy2:
        setUserChoice("uiui");
        if (userChoice === "Idle") {
          setTimeout(() => {
            setCurrentMode(AvatarModes.ChapterSuggestion);
          }, 5);
        } else if (userChoice === "Success") {
          setTimeout(() => {
            setCurrentMode(AvatarModes.CourseSuggestion);
          }, 5);
        }

        break;
      case AvatarModes.ChapterSuggestion:
        localRecommendData = Object.keys(recommendations);
        console.log("currentchapter in chapterSuggestion", currentChapter);
        console.log("currentcourse in chapterSuggestion", currentCourse);

        currentLanguageIndex = localRecommendData.findIndex(lang => lang === currentCourseTitle?.language);
        if (choice === "yes") {

          setUserChoice("Success");

          const recommendedLessonId = recommendations[currentCCodeOfRec];
          // console.log("ChapterSuggestion in recommendedLessonId", recommendedLessonId);

          // const finalLesson = await  Util.getNextLessonInChapter(currentCourse.chapters, cuReChapter.chapterId, recommendedLessonId, cuReChapter);
          console.log("cuReChapter in chaptersuggestion", cuReChapter);
          const RecLessons = await getLessonsForChapter(cuReChapter);
          const matchingLesson = RecLessons.find(lesson => lesson.id === cuRecLessonId);
          console.log("matchingLesson in chaptersuggestion", matchingLesson?.title);

          setCuRecLesson(matchingLesson);
          setCurrentMode(AvatarModes.LessonSuggestion);
        } else if (choice === "no") {

          setUserChoice("Fail1");
          const nextLanguageIndex = currentLanguageIndex + 1;
          if (nextLanguageIndex < localRecommendData.length) {
            // Ask about the next language course
            console.log("hehe", localRecommendData[nextLanguageIndex]);
            setCurrentCourseTitle(prevCourse => ({ ...prevCourse, language: localRecommendData[nextLanguageIndex] }));
          }
        }
        // }
        break;
      case AvatarModes.LessonSuggestion:
        if (choice === "yes") {
          setUserChoice("Success1");

          if (choice === "yes") {
            console.log("LessonCard course: course,", currentCourse);

            const parmas = `?courseid=${cuRecLesson.cocosSubjectCode}&chapterid=${cuRecLesson.cocosChapterCode}&lessonid=${cuRecLesson.id}`;
            console.log(
              "🚀 ~ file: LessonCard.tsx:73 ~ parmas:",
              parmas,
              Lesson.toJson(cuRecLesson)
            );
            history.push(PAGES.GAME + parmas, {
              url: "chimple-lib/index.html" + parmas,
              lessonId: cuRecLesson.id,
              courseDocId: currentCourse.id,
              course: JSON.stringify(Course.toJson(currentCourse!)),
              lesson: JSON.stringify(Lesson.toJson(cuRecLesson)),
              from: history.location.pathname + `?${CONTINUE}=true`,
            });

          } else {
            console.log(cuRecLesson?.title, "lesson is locked");
          }
        } else if (choice === "no") {
          setUserChoice("Fail1");
        }
        break;
      case AvatarModes.TwoOptionQuestion:
        if (choice === "1") {
        } else if (choice === "2") {
          setCurrentMode(AvatarModes.FourOptionQuestion);
        }
        break;
      case AvatarModes.FourOptionQuestion:
        if (choice === "1") {
        } else if (choice === "2") {
        } else if (choice === "3") {
        } else if (choice === "4") {
        }
        break;
      default:
        break;
    }
  };

  let message = t("welcomeMessage");
  let buttons: { label: string; onClick: () => void }[] = [];

  switch (currentMode) {
    case AvatarModes.Welcome:
      message = t("Hi! Welcome to Chimple");
      buttons = [{ label: "Start", onClick: () => handleButtonClick("Start") }];
      break;
    case AvatarModes.CourseSuggestion:
      const x1 = currentCourse?.title;

      message = t(`Do you want to play x1 course?`).replace('x1', x1);
      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick("yes") },
        { label: t("No"), onClick: () => handleButtonClick("no") },
      ];
      break;
    case AvatarModes.ChapterSuggestion:
      const x2 = currentChapter;
      message = t(`Do you want to play 'x2 chapter?`).replace('x2', x2);

      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick("yes") },
        { label: t("No"), onClick: () => handleButtonClick("no") },
      ];
      break;
    case AvatarModes.LessonSuggestion:
      const x3 = cuRecLesson.title;
      message = t(`Do you want to play x3 lesson?`).replace('x3', x3);

      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick("yes") },
        { label: t("No"), onClick: () => handleButtonClick("no") },
      ];
      break;
    case AvatarModes.TwoOptionQuestion:
      message = `Guess the Animal ?`;
      buttons = [
        { label: "1", onClick: () => handleButtonClick("1") },
        { label: "2", onClick: () => handleButtonClick("2") },
      ];
      break;
    case AvatarModes.FourOptionQuestion:
      message = `Guess the Animal 4 optionsF?`;
      buttons = [
        { label: "1", onClick: () => handleButtonClick("1") },
        { label: "2", onClick: () => handleButtonClick("2") },
        { label: "3", onClick: () => handleButtonClick("3") },
        { label: "4", onClick: () => handleButtonClick("4") },
      ];
      break;
    // Add more cases for other modes if needed
    default:
      break;
  }

  console.log("final currentchapter", currentChapter);
  console.log("final currentCourseTitle", currentCourseTitle);
  console.log("final currentlesson", currentLesson);
  console.log("final courseData", currentCourse?.thumbnail);
  console.log("final userChoice", userChoice);
  console.log("final setUserOption", setUserChoice);

  return (
    <div style={style}>
      <ChimpleAvatarCharacterComponent
        style={{
          height: "50vh",
          width: "25vw",
        }}
        userChoice={userChoice}
        clickHandler={() => handleButtonClick(userChoice)}
      />
      <div className="avatar-option-box-background"
      >
        <div
        >
          <TextBoxWithAudioButton
            message={message}
          ></TextBoxWithAudioButton>
          <AvatarImageOption
            imageWidth={38}
            localSrc={`courses/${currentImgCode}/icons/${currentImgCode}.webp`}
            defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
            // webSrc={"https://www.cambridgeblog.org/wp-content/uploads/2015/05/What-is-an-Animal.jpg"}
            webSrc={currentImgThumnail}
            currentMode={currentMode}
            currentCourse={currentCourse}
            cuReChapter={cuReChapter}
            cuRecLesson={cuRecLesson}
          ></AvatarImageOption>
          <div className="buttons-in-avatar-option-box"
            style={{
              flexWrap:
                buttons.length === 4
                  ? "wrap" : "wrap",
              justifyContent:
                buttons.length === 1
                  ? "center"
                  : buttons.length === 2
                    ? "space-evenly"
                    : buttons.length === 4
                      ? "space-between"
                      : "space-between"
            }}
          >
            {buttons.map((button, index) => (
              <div
                key={index}
              >
                <RectangularTextButton

                  buttonWidth={11}
                  buttonHeight={5}
                  text={button.label}
                  fontSize={3}
                  onHeaderIconClick={() => {
                    button.onClick()
                    handleButtonClick(userChoice)
                  }}
                  className={button.label === 'No' ? 'red-button' : 'green-button'}
                ></RectangularTextButton>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChimpleAvatarPage;