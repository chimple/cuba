import { FC, useEffect, useRef, useState } from "react";
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
import { COURSES, PAGES, RECOMMENDATIONS } from "../../common/constants";
import { relative } from "path";
import DisplayStudents from "../../pages/DisplayStudents";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import "./ChimpleAvatarPage.css";

import { Chapter } from "../../common/courseConstants";
// import { getFirestore } from "@firebase/firestore";
import { any } from "prop-types";
import { async } from "q";
import { useHistory } from "react-router";
import { language } from "ionicons/icons";
import { string } from "yargs";
import { t } from "i18next";
import { useRive, Layout, Fit, useStateMachineInput } from "rive-react";
import { useAudioPlayer} from "./animationUtils";

interface RecommendedCourse {
  title?: string;
  chapters?: string[];
  language: string;
  courseCode?: string;
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
  Welcomedummy2,
}

export enum CourseNames {
  en = "English",
  maths = "Maths",
  hi = "Hindi",
  puzzle = "Puzzle",
}

const ChimpleAvatarPage: FC<{
  style;
  isUnlocked?: boolean;
  audioSrc: string;
}> = ({ style, audioSrc }) => {
  const [currentMode, setCurrentMode] = useState<AvatarModes>(
    AvatarModes.Welcome
  );
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course>();
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentLesson, setCurrentLesson] = useState<Lesson>();
  // const [playing, setPlaying] = useState(false);
  const [userChoice, setUserChoice] = useState<boolean>(false);
  const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(true);
  const { playAudio, playing} = useAudioPlayer(audioSrc);


  const history = useHistory();
  // console.log("cocos game", history.location.state);

  const [riveCharHandsUp, setRiveCharHandsUp] = useState("Fail");
  const State_Machine = "State Machine 1";

  const { rive, RiveComponent } = useRive({
    src: "/assets/animation/chimplecharacter.riv",
    stateMachines: State_Machine,
    layout: new Layout({ fit: Fit.Cover }),
    animations: riveCharHandsUp,
    autoplay: true,
  });
  const onclickInput = useStateMachineInput(
    rive,
    State_Machine,
    riveCharHandsUp
  );

  useEffect(() => {
    fetchCoursesForStudent();
    setButtonsDisabled(true);
  }, [currentMode]);

  const api = ServiceConfig.getI().apiHandler;
  let recommendations;
  // let userChoice;

  const fetchCoursesForStudent = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (currentStudent) {
      let courses = await api.getCoursesForParentsStudent(currentStudent);
      // console.log("Student Courses chimpleavatarpage ", courses);
      if (courses) setAllCourses(courses);
      else setAllCourses([]);
      const recommendationsInLocal = localStorage.getItem(
        `${currentStudent.docId}-${RECOMMENDATIONS}`
      );
      recommendations = recommendationsInLocal
        ? JSON.parse(recommendationsInLocal)
        : {};
      // console.log("Avatar data", recommendations);
      if (!currentCourse) setCurrentCourse(allCourses[0]);
    }
  };

  let cCourse: Course, cChapter: Chapter, cLesson: Lesson | undefined;
  const handleButtonClick = async (choice: boolean) => {
    setUserChoice(choice);
    if (!buttonsDisabled) {
      // If buttons are already disabled, don't proceed
      return;
    }

    // console.log("choicechoicechoicechoice", choice);
    // Handle button clicks based on the current mode

    // console.log("cChapter", cChapter);

    switch (currentMode) {
      case AvatarModes.Welcome:
        // console.log("AvatarModes.Welcome", choice);
        // cChapter = await getRecommendedChapter(cCourse);
        // setCurrentChapter(cChapter);
        console.log("btnDisabled in Welcome", buttonsDisabled);

        if (choice) {
          setButtonsDisabled(false);

          rive?.play("Success");
          cCourse = await getRecommendedCourse();
          setCurrentCourse(cCourse);
          setCurrentMode(AvatarModes.CourseSuggestion);
        }
        setButtonsDisabled(true);

        break;

      case AvatarModes.CourseSuggestion:
        // console.log("AvatarModes.CourseSuggestion", choice);
        console.log("btnDisabled in course", buttonsDisabled);

        if (choice) {
          setButtonsDisabled(false);

          rive?.play("Success");
          cChapter = await getRecommendedChapter(cCourse || currentCourse);
          setCurrentChapter(cChapter);
          setCurrentMode(AvatarModes.ChapterSuggestion);
        } else {
          setButtonsDisabled(false);
          rive?.play("Fail");
          cCourse = await getRecommendedCourse();
          setCurrentCourse(cCourse);
        }
        setButtonsDisabled(true);

        break;
      case AvatarModes.ChapterSuggestion:
        console.log("btnDisabled in chapter", buttonsDisabled);

        if (choice) {
          setButtonsDisabled(false);

          rive?.play("Success");
          cLesson = await getRecommendedLesson(
            currentChapter || cCourse.chapters[0],
            cCourse || currentCourse
          );
          setCurrentLesson(cLesson);
          setCurrentMode(AvatarModes.LessonSuggestion);
        } else {
          setButtonsDisabled(false);

          rive?.play("Fail");
          cChapter = await getRecommendedChapter(cCourse || currentCourse);
          setCurrentChapter(cChapter);
        }
        setButtonsDisabled(true);

        break;
      case AvatarModes.LessonSuggestion:
        console.log("btnDisabled in lesson", buttonsDisabled);

        if (choice) {
          setButtonsDisabled(false);

          rive?.play("Success");
          if (currentLesson && currentCourse) {
            // console.log("LessonCard course: course,", currentCourse);
            const parmas = `?courseid=${currentLesson.cocosSubjectCode}&chapterid=${currentLesson.cocosChapterCode}&lessonid=${currentLesson.id}`;
            // console.log(
            //   "🚀 ~ file: LessonCard.tsx:73 ~ parmas:",
            //   parmas,
            //   Lesson.toJson(currentLesson)
            // );
            history.push(PAGES.GAME + parmas, {
              url: "chimple-lib/index.html" + parmas,
              lessonId: currentLesson.id,
              courseDocId: currentCourse.docId,
              course: JSON.stringify(Course.toJson(currentCourse!)),
              lesson: JSON.stringify(Lesson.toJson(currentLesson)),
              from: history.location.pathname + "?continue=true",
            });
          }
        } else {
          rive?.play("Fail");
          cLesson = await getRecommendedLesson(
            currentChapter || cCourse.chapters[0],
            cCourse || currentCourse
          );
          setCurrentLesson(cLesson);
        }
        break;
      case AvatarModes.TwoOptionQuestion:
        if (choice) {
        } else if (choice) {
          setCurrentMode(AvatarModes.FourOptionQuestion);
        }
        break;
      default:
        break;
    }
    buttons = [];
    onclickInput?.fire();
    setRectangularButtonClassName(choice ? "red-button" : "green-button");
    // userChoice = choice;
  };

  async function getRecommendedCourse() {
    // console.log("getRecommendedCourse called");

    if (!allCourses) {
      await fetchCoursesForStudent();
    }
    if (currentCourse) {
      const courseIndex = allCourses.findIndex(
        (course) => course.courseCode === currentCourse?.courseCode
      );
      // console.log(
      //   "getRecommendedCourse() {",
      //   courseIndex,
      //   allCourses[courseIndex + 1] || allCourses[0]
      // );
      return allCourses[courseIndex + 1] || allCourses[0];
    } else {
      return allCourses[0];
    }
  }

  async function getRecommendedChapter(course: Course) {
    // console.log("getRecommendedChapter", course.title, currentChapter);

    if (currentChapter) {
      const chapterIndex = course.chapters.findIndex(
        (chapter) => chapter.id === currentChapter?.id
      );
      // console.log(
      //   "currentChapter",
      //   chapterIndex + 1,
      //   course.chapters[chapterIndex + 1].title
      // );
      return course.chapters[chapterIndex + 1];
    } else {
      // console.log("currentChapter else", course.chapters[0].title);
      return course.chapters[0];
    }
  }

  async function getRecommendedLesson(cChapter: Chapter, cCourse: Course) {
    // console.log("getRecommendedLesson(chapter", chapter, currentLesson);

    if (currentLesson && cChapter) {
      const lessonIndex = cChapter.lessons.findIndex(
        (lesson) => lesson.id === currentLesson?.docId
      );
      console.log(
        "lessonIndex === cChapter.lessons.length",
        lessonIndex,
        cChapter.lessons.length,
        lessonIndex === cChapter.lessons.length - 1
      );

      if (lessonIndex === cChapter.lessons.length - 1) {
        console.log("reached last lesson in chapter ", cChapter);
        const chapterIndex = cCourse.chapters.findIndex(
          (chapter) => chapter.id === cChapter.id
        );
        setCurrentChapter(cCourse.chapters[chapterIndex + 1]);
        const cLessonRef = cCourse.chapters[chapterIndex + 1].lessons[0].id;
        const cLesson = await api.getLesson(cLessonRef);
        console.log(
          "getRecommendedLesson() next cLesson from next chapter ",
          chapterIndex,
          cCourse.chapters[chapterIndex + 1],
          cLessonRef,
          cLesson?.title
        );
        return cLesson;
      } else {
        const cLessonRef = cChapter.lessons[lessonIndex + 1].id;
        const cLesson = await api.getLesson(cLessonRef);

        console.log(
          "getRecommendedLesson() cLesson?.title ",
          lessonIndex,
          cLessonRef,
          cLesson?.title
        );
        return cLesson;
      }
    } else {
      // console.log(
      //   "const cLessonRef = chapter.lessons[0].id;",
      //   chapter,
      //   chapter.lessons,
      //   chapter.lessons[0].id
      // );

      const cLessonRef = cChapter.lessons[0].id;
      const cLesson = await api.getLesson(cLessonRef);
      // console.log("getRecommendedLesson() ", cLesson);
      return cLesson;
    }
  }

  let message = t("welcomeMessage");
  // const [buttons, setButtons] = useState<
  //   { label: string; onClick: () => void }[]
  // >([]);
  let buttons: { label: string; onClick: () => void }[] = [];

  const [rectangularButtonClassName, setRectangularButtonClassName] =
    useState<string>("defalut");
  switch (currentMode) {
    case AvatarModes.Welcome:
      // console.log("AvatarModes.Welcome");
      message = t("Hi! Welcome to Chimple");
      // setButtons([{ label: "Start", onClick: () => handleButtonClick(true) }]);
      buttons = [{ label: "Start", onClick: () => handleButtonClick(true) }];
      break;
    case AvatarModes.CourseSuggestion:
      const x1 = currentCourse?.title || "";

      message = t(`Do you want to play 'x1' course?`).replace("x1", x1);
      // setButtons([
      //   { label: t("Yes"), onClick: () => handleButtonClick(true) },
      //   { label: t("No"), onClick: () => handleButtonClick(false) },
      // ]);
      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick(true) },
        { label: t("No"), onClick: () => handleButtonClick(false) },
      ];
      break;
    case AvatarModes.ChapterSuggestion:
      const x2 = currentChapter?.title || "";
      message = t(`Do you want to play 'x2' chapter?`).replace("x2", x2);

      // setButtons([
      //   { label: t("Yes"), onClick: () => handleButtonClick(true) },
      //   { label: t("No"), onClick: () => handleButtonClick(false) },
      // ]);
      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick(true) },
        { label: t("No"), onClick: () => handleButtonClick(false) },
      ];
      break;
    case AvatarModes.LessonSuggestion:
      const x3 = currentLesson?.title || "";
      message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);

      // setButtons([
      //   { label: t("Yes"), onClick: () => handleButtonClick(true) },
      //   { label: t("No"), onClick: () => handleButtonClick(false) },
      // ]);
      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick(true) },
        { label: t("No"), onClick: () => handleButtonClick(false) },
      ];
      break;
    case AvatarModes.TwoOptionQuestion:
      message = `Guess the Animal ?`;
      // setButtons([
      //   // { label: "1", onClick: () => handleButtonClick("1") },
      //   // { label: "2", onClick: () => handleButtonClick("2") },
      // ]);
      break;
    case AvatarModes.FourOptionQuestion:
      message = `Guess the Animal 4 optionsF?`;
      // setButtons([
      //   // { label: "1", onClick: () => handleButtonClick("1") },
      //   // { label: "2", onClick: () => handleButtonClick("2") },
      //   // { label: "3", onClick: () => handleButtonClick("3") },
      //   // { label: "4", onClick: () => handleButtonClick("4") },
      // ]);
      break;
    // Add more cases for other modes if needed
    default:
      break;
  }

  return (
    <div style={style}>
      <RiveComponent
        style={{
          width: "35vw",
          height: "70vh",
        }}
        onClick={playAudio}
        // onDoubleClick={handleDoubleClick}
        // clickHandler={() => handleButtonClick(userChoice)}
      />
      <div className="avatar-option-box-background left-corner">
        <div>
          <TextBoxWithAudioButton
            message={message}
            fontSize={"2vw"}
          ></TextBoxWithAudioButton>
          <AvatarImageOption
            currentMode={currentMode}
            currentCourse={currentCourse}
            currentChapter={currentChapter}
            currentLesson={currentLesson}
          ></AvatarImageOption>
          <div
            className="buttons-in-avatar-option-box"
            style={{
              flexWrap: buttons.length === 4 ? "wrap" : "wrap",
              justifyContent:
                buttons.length === 1
                  ? "center"
                  : buttons.length === 2
                  ? "space-evenly"
                  : buttons.length === 4
                  ? "space-between"
                  : "space-between",
            }}
          >
            {buttons.map((button, index) => (
              <div key={index}>
                <RectangularTextButton
                  buttonWidth={11}
                  buttonHeight={8}
                  padding={1}
                  text={button.label}
                  fontSize={3.2}
                  // onHeaderIconClick={button.onClick()}

                  onHeaderIconClick={() => {
                    button.onClick();
                  }}
                  userChoice={userChoice}
                  className={
                    button.label === "No" ? "red-button" : "green-button"
                  }
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
