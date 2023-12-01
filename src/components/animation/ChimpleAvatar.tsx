import { FC, useEffect, useState } from "react";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";
import RectangularTextButton from "./RectangularTextButton";
import AvatarImageOption from "./AvatarImageOption";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { useAudioPlayer, useTtsAudioPlayer } from "./animationUtils";
import {
  CURRENT_AVATAR_SUGGESTION_NO,
  PAGES,
  RECOMMENDATIONS,
} from "../../common/constants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import "./ChimpleAvatar.css";
import { Chapter } from "../../common/courseConstants";
import { useHistory } from "react-router";
import { t } from "i18next";
import { useRive, Layout, Fit, useStateMachineInput } from "rive-react";
import { AvatarModes, AvatarObj } from "./Avatar";
import { IonLoading, IonPage } from "@ionic/react";
// import { rows } from "../../../build/assets/animation/avatarSugguestions.json";

export enum CourseNames {
  en = "English",
  maths = "Maths",
  hi = "Hindi",
  puzzle = "Puzzle",
}

const ChimpleAvatar: FC<{
  recommadedSuggestion: Lesson[];
  style;
  isUnlocked?: boolean;
}> = ({ recommadedSuggestion, style }) => {
  let avatarObj = AvatarObj.getInstance();

  const [currentMode, setCurrentMode] = useState<AvatarModes>(
    avatarObj.mode || AvatarModes.Welcome
  );
  const [currentStageMode, setCurrentStageMode] = useState<AvatarModes>();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course>(allCourses[0]);
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentLesson, setCurrentLesson] = useState<Lesson>();
  const [isBurst, setIsBurst] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(true);
  const [riveCharHandsUp, setRiveCharHandsUp] = useState("Fail");
  const [spinnerLoading, setSpinnerLoading] = useState<boolean>(true);
  const history = useHistory();
  const State_Machine = "State Machine 1";
  const { rive, RiveComponent } = useRive({
    src: "/assets/animation/chimplecharacter.riv",
    stateMachines: State_Machine,
    layout: new Layout({ fit: Fit.Cover }),
    animations: riveCharHandsUp,
    autoplay: true,
    onLoad: () => {
      console.log("RiveComponent loaded successfully", rive);
      setSpinnerLoading(false);
    },
  });
  const onclickInput = useStateMachineInput(
    rive,
    State_Machine,
    riveCharHandsUp
  );

  useEffect(() => {
    loadSuggestionsFromJson();
    // setButtonsDisabled(true);
  }, [currentMode]);
  
  useEffect(() => {
    fetchCoursesForStudent();
  }, []);

  const api = ServiceConfig.getI().apiHandler;

  async function loadSuggestionsFromJson() {
    await avatarObj.loadAvatarData();
    setCurrentMode(avatarObj.mode);
    if (avatarObj.mode === AvatarModes.CourseSuggestion) {
      if (!allCourses || allCourses.length === 0) fetchCoursesForStudent();
      setCurrentStageMode(AvatarModes.CourseSuggestion);
      cCourse = await getRecommendedCourse();
      setCurrentCourse(cCourse);
      console.log(
        "if (avatarObj.mode === AvatarModes.CourseSuggestion) {",
        cCourse
      );
    }
    if (avatarObj.mode === AvatarModes.RecommendedLesson) {
      avatarObj.currentRecommededLessonIndex = 0;
      console.log(
        "setCurrentLesson(recommadedSuggestion[0]);",
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]
      );
      setCurrentLesson(
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]
      );
    }
  }
  let buttons: { label: string; onClick: () => void }[] = [];
  let message: string = "";

  async function loadNextSuggestion() {
    await avatarObj.loadAvatarNextSuggestion();

    setCurrentMode(avatarObj.mode);
    if (avatarObj.mode === AvatarModes.CourseSuggestion) {
      setCurrentStageMode(AvatarModes.CourseSuggestion);
      cCourse = await getRecommendedCourse();
      setCurrentCourse(cCourse);
      console.log("setCurrentLesson(CourseSuggestion);", cCourse);
    }
  }

  const fetchCoursesForStudent = async () => {
    if (cAllCourses) return;

    const currentStudent = Util.getCurrentStudent();
    if (currentStudent) {
      let courses = await api.getCoursesForParentsStudent(currentStudent);
      console.log("Student Courses chimpleavatarpage ", courses);
      if (courses) {
        setAllCourses(courses);
        cAllCourses = courses;
      }
      const recommendationsInLocal = localStorage.getItem(
        `${currentStudent.docId}-${RECOMMENDATIONS}`
      );
      const recommendations = recommendationsInLocal
        ? JSON.parse(recommendationsInLocal)
        : {};
      console.log("Avatar data", recommendations);
      if (!currentCourse) setCurrentCourse(allCourses[0]);
    }
  };

  async function onClickYes() {
    setButtonsDisabled(false);
    // if currentStageMode is AvatarModes.LessonSuggestion then skiping the avatar animation playing

    if (currentStageMode === AvatarModes.LessonSuggestion) {
      console.log(
        "currentStageMode is AvatarModes.LessonSuggestion onClickYes"
      );

      return;
    }
    rive?.play(avatarObj.yesAnimation);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (rive) {
      const animation = avatarObj.yesAnimation;
      rive?.play(avatarObj.yesAnimation);
      setTimeout(() => {
        rive?.stop(animation);
      }, 1 * 1000);
    }
    buttons = [];
    onclickInput?.fire();
  }

  const playAndStopAnimation = async () => {
    const animation = avatarObj.yesAnimation;
    const animationDuration = 100;
    let i = 0;
    while (i < 22) {
      rive?.play(avatarObj.yesAnimation);
      await new Promise((resolve) => setTimeout(resolve, animationDuration));
      console.log("audio testing", isAudioPlaying, isTtsPlaying);
      i++;
    }
    rive?.stop(avatarObj.yesAnimation);
  };

  const onClickRiveComponent = async () => {
    await avatarObj.loadAvatarDataOnIndex();
    if (rive) {
      playAndStopAnimation();
    } else {
      console.log("Rive component not fully initialized yet");
    }

    if (!isTtsPlaying) {
      console.log("hjgdfhdsg");
      await speak();
    }
  };

  async function onClickNo() {
    setButtonsDisabled(false);
    // if (currentStageMode === AvatarModes.LessonSuggestion) {
    //   console.log("if (currentStageMode === AvatarModes.LessonSuggestion) {");
    //   return;
    // }
    rive?.play(avatarObj.noAnimation);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    buttons = [];
    onclickInput?.fire();
  }

  let cCourse: Course,
    cChapter: Chapter,
    cLesson: Lesson | undefined,
    cAllCourses: Course[];
  const handleButtonClick = async (choice: boolean, option = "") => {
    if (!buttonsDisabled) {
      // If buttons are already disabled, don't proceed
      return;
    }
    setIsBurst(true);

    console.log("handleButtonClick currentMode ", currentMode);
    switch (currentMode) {
      case AvatarModes.Welcome:
        if (choice) {
          setButtonsDisabled(false);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          rive?.play(avatarObj.avatarAnimation);
          buttons = [];
          onclickInput?.fire();
          await loadNextSuggestion();
        }

        break;

      case AvatarModes.CourseSuggestion:
        switch (currentStageMode) {
          case AvatarModes.CourseSuggestion:
            if (choice) {
              await onClickYes();
              cChapter = await getRecommendedChapter(cCourse || currentCourse);
              setCurrentChapter(cChapter);
              setCurrentStageMode(AvatarModes.ChapterSuggestion);
            } else {
              await onClickNo();
              cCourse = await getRecommendedCourse();
              setCurrentCourse(cCourse);
            }

            break;
          case AvatarModes.ChapterSuggestion:
            console.log("btnDisabled in chapter", buttonsDisabled);

            if (choice) {
              await onClickYes();
              cLesson = await getRecommendedLesson(
                currentChapter || cCourse.chapters[0],
                cCourse || currentCourse
              );
              setCurrentLesson(cLesson);
              // avatarObj.mode = AvatarModes.LessonSuggestion;
              setCurrentStageMode(AvatarModes.LessonSuggestion);
            } else {
              await onClickNo();
              cChapter = await getRecommendedChapter(cCourse || currentCourse);
              setCurrentChapter(cChapter);
            }

            break;
          case AvatarModes.LessonSuggestion:
            console.log("btnDisabled in lesson", buttonsDisabled);

            if (choice) {
              await onClickYes();
              playCurrentLesson();
              await loadNextSuggestion();
            } else {
              await onClickNo();
              cLesson = await getRecommendedLesson(
                currentChapter || cCourse.chapters[0],
                cCourse || currentCourse
              );
              setCurrentLesson(cLesson);
            }
            break;
        }

        break;

      case AvatarModes.TwoOptionQuestion:
        choice = option === avatarObj.answer;
        if (choice) {
          await onClickYes();
          await loadNextSuggestion();
        } else {
          await onClickNo();
        }
        break;
      case AvatarModes.FourOptionQuestion:
        choice = option === avatarObj.answer;
        if (avatarObj.questionType === "unanswered") choice = true;

        console.log(
          "AvatarModes.FourOptionQuestion ",
          option,
          choice,
          avatarObj.questionType === "unanswered"
        );

        if (choice) {
          await onClickYes();
          await loadNextSuggestion();
        } else {
          await onClickNo();
        }
        break;

      case AvatarModes.RecommendedLesson:
        if (choice) {
          await onClickYes();
          playCurrentLesson();
          await loadNextSuggestion();
        } else {
          await onClickNo();
          avatarObj.currentRecommededLessonIndex++;
          console.log(
            "currentStageIndex++;",
            avatarObj.currentRecommededLessonIndex
          );

          let recomLesson = await getRecommendedLesson(cChapter, currentCourse);
          setCurrentLesson(recomLesson);
        }
        break;
      default:
        break;
    }
    setTimeout(() => {
      setIsBurst(false);
      setButtonsDisabled(true);
    }, 50);
  };

  async function playCurrentLesson() {
    if (currentLesson) {
      let lessonCourse = currentCourse;
      if (!currentCourse) {
        console.log("playCurrentLesson() is undefined ", currentCourse);
        lessonCourse =
          (await api.getCourseFromLesson(currentLesson)) || currentCourse;
      }
      const parmas = `?courseid=${currentLesson.cocosSubjectCode}&chapterid=${currentLesson.cocosChapterCode}&lessonid=${currentLesson.id}`;
      history.push(PAGES.GAME + parmas, {
        url: "chimple-lib/index.html" + parmas,
        lessonId: currentLesson.id,
        courseDocId: lessonCourse.docId,
        course: JSON.stringify(Course.toJson(lessonCourse)),
        lesson: JSON.stringify(Lesson.toJson(currentLesson)),
        from: history.location.pathname + "?continue=true",
      });
    }
  }

  async function getRecommendedCourse() {
    console.log("getRecommendedCourse called", allCourses);

    if (!allCourses || allCourses.length === 0) {
      await fetchCoursesForStudent();
    }
    if (currentCourse) {
      const courseIndex = allCourses.findIndex(
        (course) => course.courseCode === currentCourse?.courseCode
      );
      console.log(
        "getRecommendedCourse() {",
        courseIndex,
        allCourses[courseIndex + 1] || allCourses[0]
      );
      return allCourses[courseIndex + 1] || allCourses[0];
    } else {
      console.log("defalut course ", allCourses[0]);

      return allCourses[0] || cAllCourses[0];
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

    if (currentMode === AvatarModes.CourseSuggestion) {
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
        const cLessonRef = cChapter.lessons[0].id;
        const cLesson = await api.getLesson(cLessonRef);
        // console.log("getRecommendedLesson() ", cLesson);
        return cLesson;
      }
    } else if (currentMode === AvatarModes.RecommendedLesson) {
      console.log(
        "currentStageIndex++;",
        avatarObj.currentRecommededLessonIndex,
        recommadedSuggestion.length,
        avatarObj.currentRecommededLessonIndex === recommadedSuggestion.length
      );

      if (
        avatarObj.currentRecommededLessonIndex === recommadedSuggestion.length
      ) {
        avatarObj.currentRecommededLessonIndex = 0;
      }
      setCurrentLesson(
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]
      );
      console.log(
        "recommadedSuggestion[currentStageIndex];",
        // recommadedSuggestion,
        avatarObj.currentRecommededLessonIndex,
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]
      );

      return recommadedSuggestion[avatarObj.currentRecommededLessonIndex];
    }
  }

  switch (currentMode) {
    case AvatarModes.Welcome:
      message = t(avatarObj.message || "");
      buttons = [{ label: "Start", onClick: () => handleButtonClick(true) }];
      break;
    case AvatarModes.CourseSuggestion:
      switch (currentStageMode) {
        case AvatarModes.CourseSuggestion:
          const x1 = currentCourse?.title || "";
          message = t(`Do you want to play 'x1' course?`).replace("x1", x1);
          buttons = [
            { label: t("Yes"), onClick: () => handleButtonClick(true) },
            { label: t("No"), onClick: () => handleButtonClick(false) },
          ];
          break;
        case AvatarModes.ChapterSuggestion:
          const x2 = currentChapter?.title || "";
          message = t(`Do you want to play 'x2' chapter?`).replace("x2", x2);
          buttons = [
            { label: t("Yes"), onClick: () => handleButtonClick(true) },
            { label: t("No"), onClick: () => handleButtonClick(false) },
          ];
          break;
        case AvatarModes.LessonSuggestion:
          const x3 = currentLesson?.title || "";
          console.log(
            "t(`Do you want to play 'x3' lesson?`)",
            t(`Do you want to play 'x3' lesson?`)
          );
          message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);
          buttons = [
            { label: t("Yes"), onClick: () => handleButtonClick(true) },
            { label: t("No"), onClick: () => handleButtonClick(false) },
          ];
          break;
      }
      break;
    case AvatarModes.TwoOptionQuestion:
      message = t(avatarObj.message || "");
      buttons = [
        {
          label: t(avatarObj.option1 || ""),
          onClick: () => handleButtonClick(true, avatarObj.option1 || ""),
        },
        {
          label: t(avatarObj.option2 || ""),
          onClick: () => handleButtonClick(false, avatarObj.option2 || ""),
        },
      ];
      break;
    case AvatarModes.FourOptionQuestion:
      message = t(avatarObj.message || "");
      buttons = [
        {
          label: t(avatarObj.option1 || ""),
          onClick: () => handleButtonClick(true, avatarObj.option1 || ""),
        },
        {
          label: t(avatarObj.option2 || ""),
          onClick: () => handleButtonClick(false, avatarObj.option2 || ""),
        },
        {
          label: t(avatarObj.option3 || ""),
          onClick: () => handleButtonClick(true, avatarObj.option3 || ""),
        },
        {
          label: t(avatarObj.option4 || ""),
          onClick: () => handleButtonClick(false, avatarObj.option4 || ""),
        },
      ];
      break;
    case AvatarModes.RecommendedLesson:
      const x3 = currentLesson?.title || cLesson?.title || "";
      message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);
      // setMessage(t(`Do you want to play 'x1' Lesson?`).replace("x1", x1));
      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick(true) },
        { label: t("No"), onClick: () => handleButtonClick(false) },
      ];
      break;
    // Add more cases for other modes if needed
    default:
      break;
  }
  const {
    speak,
    stop,
    isTtsPlaying,
    getSupportedLanguages,
    getSupportedVoices,
    isLanguageSupported,
  } = useTtsAudioPlayer(message || "");
  const { playAudio, isAudioPlaying, pauseAudio } = useAudioPlayer(
    avatarObj.audioSrc || ""
  );
  return (
    <div style={style}>
      <div>
        <IonLoading id="custom-loading-for-avatar" isOpen={spinnerLoading} />
        <div className="rive-container">
          <RiveComponent
            className="rive-component"
            onClick={onClickRiveComponent}
          />
          <div className="avatar-shadow" />
        </div>
      </div>
      <div
        className={`avatar-option-box-background left-corner ${
          isBurst ? "burst" : ""
        }`}
      >
        <div>
          <TextBoxWithAudioButton
            message={message}
            fontSize={"2vw"}
            onClick={onClickRiveComponent}
          ></TextBoxWithAudioButton>
          <AvatarImageOption
            currentMode={currentMode}
            currtStageMode={currentStageMode || AvatarModes.CourseSuggestion}
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
                  : "center",
              gap: ".5em",
              display: buttons.length > 2 ? "grid" : "",
              gridTemplateColumns: buttons.length > 2 ? "35% 70px" : "",
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
                  // className={
                  //   (button.label === "No" && avatarObj.option2) || avatarObj.option4 ? "red-button" : "green-button"
                  // }
                  className={
                    button.onClick.toString().includes("true")
                      ? "green-button"
                      : "red-button"
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

export default ChimpleAvatar;
