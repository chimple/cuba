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
  SHOW_DAILY_PROGRESS_FLAG,
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
    return () => {
      stop();
    };
  }, []);
  const api = ServiceConfig.getI().apiHandler;

  async function loadSuggestionsFromJson() {
    const showDailyProgress = localStorage.getItem(SHOW_DAILY_PROGRESS_FLAG);
    console.log("localStorage.getItem(showDailyProgress) ", showDailyProgress);

    if (showDailyProgress === "true") {
      await avatarObj.loadAvatarWeeklyProgressData();
      console.log(
        "if (avatarObj.weeklyTimeSpent * 60 >= 10 * 60) {",
        avatarObj.weeklyTimeSpent,
        avatarObj.weeklyTimeSpent * 60,
        10 * 60
      );
      if (
        avatarObj.weeklyTimeSpent * 60 >= 10 * 60 ||
        avatarObj.weeklyTimeSpent <= 0
      ) {
        await avatarObj.loadAvatarData();
        localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "false");
      }
    } else await avatarObj.loadAvatarData();

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
      const x1 = cCourse?.title || "";
      message = t(`Do you want to play 'x1' course?`).replace("x1", x1);
      await speak(message);
    } else if (avatarObj.mode === AvatarModes.RecommendedLesson) {
      avatarObj.currentRecommededLessonIndex = 0;
      console.log(
        "setCurrentLesson(recommadedSuggestion[0]);",
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]
      );
      setCurrentLesson(
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]
      );
      const x3 =
        recommadedSuggestion[avatarObj.currentRecommededLessonIndex]?.title ||
        "";
      message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);
      await speak(message);
    } else {
      if (!message) {
        message = t("Hi! Welcome to Chimple");
      }
      await speak(message);
    }
  }
  let buttons: { label: string; onClick: () => void; isTrue?: boolean }[] = [];
  let message: string = "";

  async function loadNextSuggestion() {
    avatarObj.wrongAttempts = 0;
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

    // if (currentStageMode === AvatarModes.LessonSuggestion) {
    //   console.log(
    //     "currentStageMode is AvatarModes.LessonSuggestion onClickYes"
    //   );

    //   return;
    // }
    rive?.play(avatarObj.yesAnimation);
    buttons = [];
    onclickInput?.fire();
  }

  const speakAnimationUntilaudio = async () => {
    const animation = avatarObj.yesAnimation;
    const animationDuration = 100;
    let i = 0;
    while (i < 22) {
      rive?.play(avatarObj.yesAnimation);

      console.log("audio testing", isAudioPlaying, isTtsPlaying);
      i++;
    }
  };

  const onClickRiveComponent = async () => {
    if (rive) {
      speakAnimationUntilaudio();
    } else {
      console.log("Rive component not fully initialized yet");
    }
    if (!isTtsPlaying) {
      await speak();
    }
  };

  async function onClickNo() {
    if (
      currentStageMode === AvatarModes.LessonSuggestion ||
      currentStageMode === AvatarModes.RecommendedLesson
    ) {
      avatarObj.wrongAttempts++;
      console.log("wrongAttempt", avatarObj.wrongAttempts);
    }
    setButtonsDisabled(false);
    // if (currentStageMode === AvatarModes.LessonSuggestion) {
    //   console.log("if (currentStageMode === AvatarModes.LessonSuggestion) {");
    //   return;
    // }
    rive?.play(avatarObj.noAnimation);
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
      case AvatarModes.ShowWeeklyProgress:
        if (choice) {
          setButtonsDisabled(false);
          rive?.play(avatarObj.avatarAnimation);
          buttons = [];
          onclickInput?.fire();
          // await loadNextSuggestion();
          localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "false");
          await loadSuggestionsFromJson();
        }
        break;

      case AvatarModes.Welcome:
        if (choice) {
          setButtonsDisabled(false);
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
              const x2 = cChapter?.title || "";
              message = t(`Do you want to play 'x2' chapter?`).replace(
                "x2",
                x2
              );
              await speak(message);
            } else {
              await onClickNo();
              cCourse = await getRecommendedCourse();
              setCurrentCourse(cCourse);
              const x1 = cCourse?.title || "";
              message = t(`Do you want to play 'x1' course?`).replace("x1", x1);
              await speak(message);
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
              console.log("lesson after chapter", cLesson?.title);
              const x3 = cLesson?.title || "";
              message = t(`Do you want to play 'x3' lesson`).replace("x3", x3);
              // avatarObj.mode = AvatarModes.LessonSuggestion;
              setCurrentStageMode(AvatarModes.LessonSuggestion);
              await speak(message);
            } else {
              await onClickNo();
              cChapter = await getRecommendedChapter(cCourse || currentCourse);
              setCurrentChapter(cChapter);
              const x2 = cChapter?.title || "";
              message = t(`Do you want to play 'x2' chapter?`).replace(
                "x2",
                x2
              );
              await speak(message);
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
              if (avatarObj.wrongAttempts >= 3) {
                await loadNextSuggestion();
                return;
              }
              cLesson = await getRecommendedLesson(
                currentChapter || cCourse.chapters[0],
                cCourse || currentCourse
              );
              setCurrentLesson(cLesson);
              const x3 = cLesson?.title || "";
              message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);
              await speak(message);
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
          await speak();
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
          avatarObj.wrongAttempts++;
          if (avatarObj.wrongAttempts >= 3) {
            await loadNextSuggestion();
            return;
          }
          avatarObj.currentRecommededLessonIndex++;
          console.log(
            "currentStageIndex++;",
            avatarObj.currentRecommededLessonIndex
          );
          let recomLesson = await getRecommendedLesson(cChapter, currentCourse);
          setCurrentLesson(recomLesson);
          console.log("14", message);
          const x3 = recomLesson?.title || "";
          message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);
          await speak(message);
        }
        break;
      default:
        break;
    }
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
      await history.replace(PAGES.GAME + parmas, {
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
    case AvatarModes.ShowWeeklyProgress:
      console.log("case AvatarModes.ShowWeeklyProgress: ");
      const x1 = "10";
      message =
        avatarObj.message ||
        t(`' x1 ' minutes left to complete your learning goal.`).replace(
          "x1",
          x1
        );
      buttons = [
        {
          label: "Let's Play",
          onClick: () => handleButtonClick(true),
          isTrue: true,
        },
      ];
      break;
    case AvatarModes.Welcome:
      message = t(avatarObj.message || "");
      buttons = [
        {
          label: "Start",
          onClick: () => handleButtonClick(true),
          isTrue: true,
        },
      ];
      break;
    case AvatarModes.CourseSuggestion:
      switch (currentStageMode) {
        case AvatarModes.CourseSuggestion:
          const x1 = currentCourse?.title || "";
          message = t(`Do you want to play 'x1' course?`).replace("x1", x1);
          buttons = [
            {
              label: t("Yes"),
              onClick: () => handleButtonClick(true),
              isTrue: true,
            },
            {
              label: t("No"),
              onClick: () => handleButtonClick(false),
              isTrue: false,
            },
          ];
          break;
        case AvatarModes.ChapterSuggestion:
          const x2 = currentChapter?.title || "";
          message = t(`Do you want to play 'x2' chapter?`).replace("x2", x2);
          buttons = [
            {
              label: t("Yes"),
              onClick: () => handleButtonClick(true),
              isTrue: true,
            },
            {
              label: t("No"),
              onClick: () => handleButtonClick(false),
              isTrue: false,
            },
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
            {
              label: t("Yes"),
              onClick: () => handleButtonClick(true),
              isTrue: true,
            },
            {
              label: t("No"),
              onClick: () => handleButtonClick(false),
              isTrue: false,
            },
          ];
          break;
      }
      break;
    case AvatarModes.TwoOptionQuestion:
      message = t(avatarObj.message || "");
      buttons = [
        {
          label: t(avatarObj.option1 || ""),
          onClick: () =>
            handleButtonClick(
              avatarObj.option1 === avatarObj.answer,
              avatarObj.option1 || ""
            ),
          isTrue:
            avatarObj.questionType === "unanswered" ||
            avatarObj.option1 === avatarObj.answer,
        },
        {
          label: t(avatarObj.option2 || ""),
          onClick: () =>
            handleButtonClick(
              avatarObj.option2 === avatarObj.answer,
              avatarObj.option2 || ""
            ),
          isTrue:
            avatarObj.questionType === "unanswered" ||
            avatarObj.option2 === avatarObj.answer,
        },
      ];
      break;
    case AvatarModes.FourOptionQuestion:
      message = t(avatarObj.message || "");
      buttons = [
        {
          label: t(avatarObj.option1 || ""),
          onClick: () =>
            handleButtonClick(
              avatarObj.option1 === avatarObj.answer,
              avatarObj.option1 || ""
            ),
          isTrue:
            avatarObj.questionType === "unanswered" ||
            avatarObj.option1 === avatarObj.answer,
        },
        {
          label: t(avatarObj.option2 || ""),
          onClick: () =>
            handleButtonClick(
              avatarObj.option2 === avatarObj.answer,
              avatarObj.option2 || ""
            ),
          isTrue:
            avatarObj.questionType === "unanswered" ||
            avatarObj.option2 === avatarObj.answer,
        },
        {
          label: t(avatarObj.option3 || ""),
          onClick: () =>
            handleButtonClick(
              avatarObj.option3 === avatarObj.answer,
              avatarObj.option3 || ""
            ),
          isTrue:
            avatarObj.questionType === "unanswered" ||
            avatarObj.option3 === avatarObj.answer,
        },
        {
          label: t(avatarObj.option4 || ""),
          onClick: () =>
            handleButtonClick(
              avatarObj.option4 === avatarObj.answer,
              avatarObj.option4 || ""
            ),
          isTrue:
            avatarObj.questionType === "unanswered" ||
            avatarObj.option4 === avatarObj.answer,
        },
      ];
      break;
    case AvatarModes.RecommendedLesson:
      const x3 = currentLesson?.title || cLesson?.title || "";
      message = t(`Do you want to play 'x3' lesson?`).replace("x3", x3);
      // setMessage(t(`Do you want to play 'x1' Lesson?`).replace("x1", x1));
      buttons = [
        {
          label: t("Yes"),
          onClick: () => handleButtonClick(true),
          isTrue: true,
        },
        {
          label: t("No"),
          onClick: () => handleButtonClick(false),
          isTrue: false,
        },
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
  const numOfBubbles = 4;
  const chimpleAvatarChatboxBubbles = Array.from(
    { length: numOfBubbles },
    (_, index) => (
      <div
        key={index}
        className={`chimple-avatar-chatbox-bubble${index + 1}`}
      ></div>
    )
  );
  console.log("wrongAttempts", avatarObj.wrongAttempts);
  console.log("currentCourse_789798", currentCourse);
  return (
    <div style={style}>
      <div>
        <IonLoading id="custom-loading-for-avatar" isOpen={spinnerLoading} />
        <div className="rive-container">
          <RiveComponent
            className="rive-component"
            onClick={onClickRiveComponent}
          />
          <div id="rive-avatar-shadow" />
        </div>
      </div>
      <div
        className={`avatar-option-box-background ${isBurst ? "burst" : ""}`}
        onAnimationEnd={() => {
          setIsBurst(false);
          setButtonsDisabled(true);
        }}
        // id="temp"
      >
        {chimpleAvatarChatboxBubbles}
        <div>
          <TextBoxWithAudioButton
            message={message}
            fontSize={"2vw"}
            onClick={() => {
              onClickRiveComponent();
            }}
          ></TextBoxWithAudioButton>
          {spinnerLoading ||
          (currentStageMode === AvatarModes.CourseSuggestion &&
            currentCourse === undefined) ||
          (currentStageMode === AvatarModes.ChapterSuggestion &&
            currentChapter === undefined) ||
          (currentStageMode === AvatarModes.LessonSuggestion &&
            currentLesson === undefined) ? (
            <div className="custom-spinner-outerbox">
              <div className="custom-spinner" />
            </div>
          ) : (
            <AvatarImageOption
              currentCourse={currentCourse}
              currentMode={currentMode}
              currtStageMode={currentStageMode || AvatarModes.CourseSuggestion}
              currentChapter={currentChapter}
              currentLesson={currentLesson}
              activitiesValue={avatarObj.weeklyPlayedLesson}
              WeeklyProgressValue={avatarObj.weeklyTimeSpent}
              WeeklyGoalValue={avatarObj.weeklyProgressGoal}
            />
          )}

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
                  onHeaderIconClick={() => {
                    button.onClick();
                  }}
                  className={button.isTrue ? "green-button" : "red-button"}
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
