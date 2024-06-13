import { FC, useEffect, useState } from "react";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";
import RectangularTextButton from "./RectangularTextButton";
import AvatarImageOption from "./AvatarImageOption";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { useAudioPlayer, useTtsAudioPlayer } from "./animationUtils";
import {
  CURRENT_AVATAR_SUGGESTION_NO,
  LEADERBOARDHEADERLIST,
  LEADERBOARD_REWARD_LIST,
  LIVE_QUIZ,
  PAGES,
  TableTypes,
  RECOMMENDATIONS,
  SHOW_DAILY_PROGRESS_FLAG,
} from "../../common/constants";
import "./ChimpleAvatar.css";
import { useHistory } from "react-router";
import { t } from "i18next";
import { useRive, Layout, Fit, useStateMachineInput } from "rive-react";
import { AvatarModes, AvatarObj } from "./Avatar";
import { IonLoading, IonPage } from "@ionic/react";
import { CircularProgress, Fade } from "@mui/material";
// import { rows } from "../../../build/assets/animation/avatarSugguestions.json";

export enum CourseNames {
  en = "English",
  maths = "Maths",
  hi = "Hindi",
  puzzle = "Puzzle",
}

const ChimpleAvatar: FC<{
  recommadedSuggestion: TableTypes<"lesson">[];
  assignments: TableTypes<"assignment">[];
  style;
  isUnlocked?: boolean;
}> = ({ recommadedSuggestion, assignments, style }) => {
  let avatarObj = AvatarObj.getInstance();
  const [currentMode, setCurrentMode] = useState<AvatarModes>(
    avatarObj.mode || AvatarModes.Welcome
  );
  const [currentStageMode, setCurrentStageMode] = useState<AvatarModes>();
  const [allCourses, setAllCourses] = useState<TableTypes<"course">[]>([]);
  const [currentCourse, setCurrentCourse] = useState<TableTypes<"course">>(
    allCourses[0]
  );
  const [currentChapter, setCurrentChapter] = useState<TableTypes<"chapter">>();
  const [currentLesson, setCurrentLesson] = useState<TableTypes<"lesson">>();
  const [isBurst, setIsBurst] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(true);
  const [riveCharHandsUp, setRiveCharHandsUp] = useState("Fail");
  const history = useHistory();
  const State_Machine = "State Machine 1";
  const [isAudioPlayed, setIsAudioPlayed] = useState<boolean>(true);

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
    avatarObj.wrongAttempts = 0;
    await avatarObj.loadAvatarData();

    setCurrentMode(avatarObj.mode);
    if (avatarObj.mode === AvatarModes.CourseSuggestion) {
      if (!allCourses || allCourses.length === 0) fetchCoursesForStudent();
      setCurrentStageMode(AvatarModes.CourseSuggestion);
      cCourse = await getRecommendedCourse();
      setCurrentCourse(cCourse);
      const x1 = cCourse?.name || "";
      message = t(`Do you want to play 'x1' course?`).replace(
        "x1",
        " " + x1 + " "
      );
    } else if (avatarObj.mode === AvatarModes.RecommendedLesson) {
      if (
        !avatarObj.currentRecommendedLessonIndex ||
        avatarObj.currentRecommendedLessonIndex >= recommadedSuggestion.length
      ) {
        avatarObj.currentRecommendedLessonIndex = 0;
      }
      setCurrentLesson(
        recommadedSuggestion[avatarObj.currentRecommendedLessonIndex]
      );
      const x3 =
        recommadedSuggestion[avatarObj.currentRecommendedLessonIndex]?.name ||
        "";
      message = t(`Do you want to play 'x3' lesson?`)
        .replace("x3", " " + x3 + " ")
        .replace(
          "lesson",
          // recommadedSuggestion[avatarObj.currentRecommendedLessonIndex]
          //   .assignment
          //   ? "assignment"
          //   :
          "lesson"
        );
    } else {
      if (!message) {
        message = t("Hi! Welcome to Chimple");
      }
    }
    if (isAudioPlayed) {
      await speak(message);
      setIsAudioPlayed(false);
    }
  }
  let buttons: { label: string; onClick: () => void; isTrue?: boolean }[] = [];
  let message: string = "";

  async function loadNextSuggestion() {
    avatarObj.imageSrc = "";
    await stop();
    avatarObj.wrongAttempts = 0;
    await avatarObj.loadAvatarNextSuggestion();

    setCurrentMode(avatarObj.mode);
    if (avatarObj.mode === AvatarModes.CourseSuggestion) {
      setCurrentStageMode(AvatarModes.CourseSuggestion);
      cCourse = await getRecommendedCourse();
      setCurrentCourse(cCourse);
    }
  }

  const fetchCoursesForStudent = async () => {
    if (cAllCourses) return;

    const currentStudent = Util.getCurrentStudent();
    if (currentStudent) {
      let courses = await api.getCoursesForParentsStudent(currentStudent.id);
      if (courses) {
        setAllCourses(courses);
        cAllCourses = courses;
      }
      const recommendationsInLocal = localStorage.getItem(
        `${currentStudent.id}-${RECOMMENDATIONS}`
      );
      const recommendations = recommendationsInLocal
        ? JSON.parse(recommendationsInLocal)
        : {};
      if (!currentCourse) setCurrentCourse(allCourses[0]);
    }
  };
  async function onClickYes() {
    setButtonsDisabled(false);
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
    // if (!isTtsPlaying) {
    await speak();
    // }
  };

  async function onClickNo() {
    if (
      avatarObj.mode === AvatarModes.CourseSuggestion ||
      avatarObj.mode === AvatarModes.ChapterSuggestion ||
      avatarObj.mode === AvatarModes.LessonSuggestion ||
      avatarObj.mode === AvatarModes.RecommendedLesson
    ) {
      avatarObj.wrongAttempts++;
    }
    setButtonsDisabled(false);
    rive?.play(avatarObj.noAnimation);
    buttons = [];
    onclickInput?.fire();
    if (avatarObj.wrongAttempts >= 3) {
      await loadNextSuggestion();
      return;
    }
  }
  let cCourse: TableTypes<"course">,
    cChapter: TableTypes<"chapter">,
    cLesson: TableTypes<"lesson"> | undefined,
    cAllCourses: TableTypes<"course">[];
  const handleButtonClick = async (choice: boolean, option = "") => {
    if (!buttonsDisabled) {
      // If buttons are already disabled, don't proceed
      return;
    }
    await stop();
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsBurst(true);
    switch (currentMode) {
      case AvatarModes.collectReward:
        if (choice) {
          setButtonsDisabled(false);
          rive?.play(avatarObj.avatarAnimation);
          buttons = [];
          onclickInput?.fire();
          history.replace(
            PAGES.LEADERBOARD +
              `?tab=${LEADERBOARDHEADERLIST.REWARDS.toLowerCase()}&rewards=${avatarObj.unlockedRewards[0]?.leaderboardRewardList.toLowerCase()}`
          );
          avatarObj.unlockedRewards = [];
        }
        break;
      case AvatarModes.ShowWeeklyProgress:
        if (choice) {
          localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "false");
          setButtonsDisabled(false);
          rive?.play("Success");
          buttons = [];
          onclickInput?.fire();
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
              const x2 = cChapter?.name || "";
              message = t(`Do you want to play 'x2' chapter?`).replace(
                "x2",
                x2
              );
              // await speak(message);
            } else {
              await onClickNo();
              cCourse = await getRecommendedCourse();
              setCurrentCourse(cCourse);
              const x1 = cCourse?.name || "";
              message = t(`Do you want to play 'x1' course?`).replace(
                "x1",
                " " + x1 + " "
              );
              // await speak(message);
            }
            break;
          case AvatarModes.ChapterSuggestion:
            if (choice) {
              await onClickYes();
              setCurrentStageMode(AvatarModes.LessonSuggestion);
              cLesson = await getRecommendedLesson(
                currentChapter || cChapter[0],
                cCourse || currentCourse
              );
              setCurrentLesson(cLesson);
              const x3 = cLesson?.name || "";
              message = t(`Do you want to play 'x3' lesson?`).replace(
                "x3",
                " " + x3 + " "
              );
              // await speak(message);
            } else {
              await onClickNo();
              cChapter = await getRecommendedChapter(cCourse || currentCourse);
              setCurrentChapter(cChapter);
              const x2 = cChapter?.name || "";
              message = t(`Do you want to play 'x2' chapter?`).replace(
                "x2",
                " " + x2 + " "
              );
              // await speak(message);
            }
            break;
          case AvatarModes.LessonSuggestion:
            if (choice) {
              await onClickYes();
              await playCurrentLesson();
              // await loadNextSuggestion();
            } else {
              await onClickNo();
              cLesson = await getRecommendedLesson(
                currentChapter || cChapter[0],
                cCourse || currentCourse
              );
              setCurrentLesson(cLesson);
              const x3 = cLesson?.name || "";
              message = t(`Do you want to play 'x3' lesson?`).replace(
                "x3",
                " " + x3 + " "
              );
              // await speak(message);
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
          // await speak();
        }
        break;
      case AvatarModes.FourOptionQuestion:
        choice = option === avatarObj.answer;
        if (avatarObj.questionType === "unanswered") choice = true;
        if (choice) {
          await onClickYes();
          await loadNextSuggestion();
        } else {
          await onClickNo();
          // await speak();
        }
        break;

      case AvatarModes.RecommendedLesson:
        if (choice) {
          await onClickYes();
          playCurrentLesson();
          // await loadNextSuggestion();
        } else {
          await onClickNo();
          avatarObj.currentLessonSuggestionIndex++;
          let recomLesson: any = await getRecommendedLesson(
            cChapter,
            currentCourse
          );
          setCurrentLesson(recomLesson);
          const x3 = recomLesson?.name || "";
          message = t(`Do you want to play 'x3' lesson?`)
            .replace("x3", " " + x3 + " ")
            .replace(
              "lesson",
              // recomLesson?.assignment ? "assignment" :
              "lesson"
            );
          // await speak(message);
        }
        break;
      default:
        break;
    }
  };

  async function playCurrentLesson() {
    await stop();
    if (currentLesson) {
      const assignmentMap = {};
      const assignmentFound = assignments?.find(
        (val) =>
          val.lesson_id === currentLesson.id && assignmentMap[val.id] == null
      );
      if (assignmentFound) {
        assignmentMap[assignmentFound.id] = currentLesson.id;
      }
      if (!!assignmentFound?.id && currentLesson.plugin_type === LIVE_QUIZ) {
        history.replace(
          PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${assignmentFound.id}`,
          {
            assignment: JSON.stringify(assignmentFound),
          }
        );
      } else {
        const lessonCourse =
          (await api.getCoursesFromLesson(currentLesson.id)) || currentCourse;
        // let lessonCourse = currentCourse;
        // if (!currentCourse) {
        //   lessonCourse =
        //     (await api.getCoursesFromLesson(currentLesson.id)) || currentCourse;
        // }
        const parmas = `?courseid=${currentLesson.cocos_subject_code}&chapterid=${currentLesson.cocos_chapter_code}&lessonid=${currentLesson.cocos_lesson_id}`;
        await history.replace(PAGES.GAME + parmas, {
          url: "chimple-lib/index.html" + parmas,
          lessonId: currentLesson.cocos_lesson_id,
          courseDocId: lessonCourse[0].id,
          course: JSON.stringify(lessonCourse),
          lesson: JSON.stringify(currentLesson),
          from: history.location.pathname + "?continue=true",
          assignment: assignmentFound,
        });
      }
    }
  }

  async function getRecommendedCourse() {
    if (!allCourses || allCourses.length === 0) {
      await fetchCoursesForStudent();
    }
    if (currentCourse) {
      const courseIndex = allCourses.findIndex(
        (course) => course.code === currentCourse?.code
      );
      return allCourses[courseIndex + 1] || allCourses[0];
    } else {
      return allCourses[0] || cAllCourses[0];
    }
  }

  async function getRecommendedChapter(course: TableTypes<"course">) {
    const cCourseChapter = await api.getChaptersForCourse(course.id);
    if (currentChapter) {
      const chapterIndex = cCourseChapter.findIndex(
        (chapter) => chapter.id === currentChapter?.id
      );
      return cCourseChapter[chapterIndex + 1];
    } else {
      return cCourseChapter[0];
    }
  }

  async function getRecommendedLesson(
    cChapter: TableTypes<"chapter">,
    cCourse: TableTypes<"course">
  ) {
    if (currentMode === AvatarModes.CourseSuggestion) {
      const cChapterLessons = await api.getLessonsForChapter(cChapter.id);
      if (currentLesson && cChapter) {
        const lessonIndex = cChapterLessons.findIndex(
          (lesson) => lesson.id === currentLesson?.id
        );
        if (lessonIndex === cChapterLessons.length - 1) {
          const chapterIndex = cChapterLessons.findIndex(
            (chapter) => chapter.id === cChapter.id
          );
          if (!cLesson) {
            return cChapterLessons[0];
          }
          const cCourseChapter = await api.getChaptersForCourse(cCourse.id);
          setCurrentChapter(cCourseChapter[chapterIndex + 1]);
          const cChapterLesson = await api.getLessonsForChapter(
            cCourseChapter[chapterIndex + 1].id
          );
          // const cLessonRef = cCourseChapter[chapterIndex + 1].lessons[0].id;
          // const cLesson = await api.getLesson(cLessonRef);
          return cChapterLesson[0];
        } else {
          const cLesson = cChapterLessons[lessonIndex + 1];
          // const cLesson = await api.getLesson(cLessonRef);
          return cLesson;
        }
      } else {
        // const cLessonRef = cChapterLessons[0].id;
        const cLesson = cChapterLessons[0];
        return cLesson;
      }
    } else if (currentMode === AvatarModes.RecommendedLesson) {
      avatarObj.currentRecommendedLessonIndex++;
      if (
        avatarObj.currentRecommendedLessonIndex === recommadedSuggestion.length
      ) {
        avatarObj.currentRecommendedLessonIndex = 0;
      }
      setCurrentLesson(
        recommadedSuggestion[avatarObj.currentRecommendedLessonIndex]
      );
      return recommadedSuggestion[avatarObj.currentRecommendedLessonIndex];
    }
  }

  switch (currentMode) {
    case AvatarModes.collectReward:
      message = t("Congratulations on earning the x1!").replace(
        "x1",
        t(avatarObj.unlockedRewards[0]?.type)
      );
      buttons = [
        {
          label: t("Collect your reward"),
          onClick: () => handleButtonClick(true),
          isTrue: true,
        },
      ];
      break;
    case AvatarModes.ShowWeeklyProgress:
      const x1 = avatarObj.weeklyProgressGoal;
      message = t(avatarObj.gamifyTimespentMessage).replace(
        "x1",
        " " + x1.toString() + " " + t("minutes")
      );
      buttons = [
        {
          label: t("Let's Play"),
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
          const x1 = currentCourse?.name || "";
          message = t(`Do you want to play 'x1' course?`).replace(
            "x1",
            " " + x1 + " "
          );
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
          const x2 = currentChapter?.name || "";
          message = t(`Do you want to play 'x2' chapter?`).replace(
            "x2",
            " " + x2 + " "
          );
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
          if (currentLesson) {
            const x3 = currentLesson.name;
            message = t(`Do you want to play 'x3' lesson?`).replace(
              "x3",
              " " + x3 + " "
            );
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
          }
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
      if (currentLesson) {
        const x3 = currentLesson.name;

        message = t(`Do you want to play 'x3' lesson?`)
          .replace("x3", " " + x3 + " ")
          .replace(
            "lesson",
            // currentLesson.assignment ? "assignment" :
            "lesson"
          );
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
      }
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

  return (
    <div style={style}>
      <div>
        {/* <IonLoading id="custom-loading-for-avatar" isOpen={spinnerLoading} /> */}
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
        onAnimationEnd={async () => {
          setIsBurst(false);
          setButtonsDisabled(true);
          await speak(message);
        }}
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
          <AvatarImageOption
            currentCourse={currentCourse}
            currentMode={currentMode}
            currtStageMode={currentStageMode || AvatarModes.CourseSuggestion}
            currentChapter={currentChapter}
            currentLesson={currentLesson}
            avatarObj={avatarObj}
          />
          <div className="buttons-container-in-avatar-option-box">
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
                gridTemplateColumns: buttons.length > 2 ? "35% 15vw" : "",
                paddingTop: buttons.length > 2 ? "1vh" : "5vh",
              }}
            >
              {buttons.map((button, index) => (
                <div key={index}>
                  <RectangularTextButton
                    buttonWidth={
                      avatarObj.mode === AvatarModes.collectReward
                        ? "auto"
                        : "17vw"
                    }
                    buttonHeight={"8vh"}
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
    </div>
  );
};

export default ChimpleAvatar;
