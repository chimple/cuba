import { FC, useEffect, useState } from "react";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";
import RectangularTextButton from "./RectangularTextButton";
import AvatarImageOption from "./AvatarImageOption";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
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
  let currentStageIndex = 0;
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course>(allCourses[0]);
  const [currentChapter, setCurrentChapter] = useState<Chapter>();
  const [currentLesson, setCurrentLesson] = useState<Lesson>();
  const [isBurst, setIsBurst] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(true);
  const [riveCharHandsUp, setRiveCharHandsUp] = useState("Fail");

  const history = useHistory();

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
    loadSuggestionsFromJson();
    setButtonsDisabled(true);
  }, [currentMode]);
  useEffect(() => {
    setButtonsDisabled(true);
  }, [currentStageMode]);

  const api = ServiceConfig.getI().apiHandler;

  async function loadSuggestionsFromJson() {
    await avatarObj.loadAvatarData();
    setCurrentMode(avatarObj.mode);
    if (avatarObj.mode === AvatarModes.CourseSuggestion) {
      setCurrentStageMode(AvatarModes.CourseSuggestion);
      cCourse = await getRecommendedCourse();
      setCurrentCourse(cCourse);
    }
    if (avatarObj.mode === AvatarModes.RecommededLesson) {
      console.log(
        "setCurrentLesson(recommadedSuggestion[0]);",
        recommadedSuggestion[0]
      );
      setCurrentLesson(recommadedSuggestion[0]);
    }
  }

  async function loadNextSuggestion(choice: boolean) {
    if (
      currentMode === AvatarModes.CourseSuggestion ||
      currentMode === AvatarModes.RecommededLesson
    ) {
    } else {
      const currentAvatarSuggestionNoFromLocal =
        Number(localStorage.getItem(CURRENT_AVATAR_SUGGESTION_NO)) ||
        avatarObj.currentSuggestionNumber;

      avatarObj.loadAvatarDataOnIndex(currentAvatarSuggestionNoFromLocal);

      setCurrentMode(avatarObj.mode);
      setButtonsDisabled(true);
      if (avatarObj.mode === AvatarModes.RecommededLesson) {
        console.log(
          "setCurrentLesson(recommadedSuggestion[0]);",
          recommadedSuggestion[0]
        );

        setCurrentLesson(await getRecommendedLesson(cChapter, currentCourse));
      }
    }
  }

  const fetchCoursesForStudent = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (currentStudent) {
      let courses = await api.getCoursesForParentsStudent(currentStudent);
      console.log("Student Courses chimpleavatarpage ", courses);
      if (courses) setAllCourses(courses);
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
    if (
      (currentMode === AvatarModes.CourseSuggestion &&
        currentStageMode != AvatarModes.LessonSuggestion) ||
      currentMode === AvatarModes.RecommededLesson
    ) {
      console.log("getCourseSuggestion ");

      // getCourseSuggestion();
    } else {
      if (
        avatarObj.currentSuggestionNumber === avatarObj.allSuggestions.length
      ) {
        avatarObj.currentSuggestionNumber = 0;
      } else {
        avatarObj.currentSuggestionNumber++;
      }
      loadNextSuggestion(true);
    }

    setButtonsDisabled(false);
    rive?.play(avatarObj.yesAnimation);
    buttons = [];
    onclickInput?.fire();
  }

  function onClickNo() {
    console.log("onclickNo", avatarObj.noAnimation);
    setButtonsDisabled(false);
    rive?.play(avatarObj.noAnimation);
    buttons = [];
    onclickInput?.fire();
    loadNextSuggestion(false);
    setButtonsDisabled(true);
  }

  let cCourse: Course, cChapter: Chapter, cLesson: Lesson | undefined;
  const handleButtonClick = async (choice: boolean) => {
    setIsBurst(true);
    if (!buttonsDisabled) {
      // If buttons are already disabled, don't proceed
      return;
    }

    console.log("handleButtonClick currentMode ", currentMode);
    switch (currentMode) {
      case AvatarModes.Welcome:
        if (choice) {
          onClickYes();
        }
        setButtonsDisabled(true);

        break;

      case AvatarModes.CourseSuggestion:
        switch (currentStageMode) {
          case AvatarModes.CourseSuggestion:
            if (choice) {
              onClickYes();
              cChapter = await getRecommendedChapter(cCourse || currentCourse);
              setCurrentChapter(cChapter);
              setCurrentStageMode(AvatarModes.ChapterSuggestion);
            } else {
              onClickNo();
              cCourse = await getRecommendedCourse();
              setCurrentCourse(cCourse);
            }

            break;
          case AvatarModes.ChapterSuggestion:
            console.log("btnDisabled in chapter", buttonsDisabled);

            if (choice) {
              onClickYes();
              cLesson = await getRecommendedLesson(
                currentChapter || cCourse.chapters[0],
                cCourse || currentCourse
              );
              setCurrentLesson(cLesson);
              // avatarObj.mode = AvatarModes.LessonSuggestion;
              setCurrentStageMode(AvatarModes.LessonSuggestion);
            } else {
              onClickNo();
              cChapter = await getRecommendedChapter(cCourse || currentCourse);
              setCurrentChapter(cChapter);
            }
            setButtonsDisabled(true);

            break;
          case AvatarModes.LessonSuggestion:
            console.log("btnDisabled in lesson", buttonsDisabled);

            if (choice) {
              setButtonsDisabled(false);
              onClickYes();
              playCurrentLesson();
            } else {
              onClickNo();
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
        if (choice) {
        } else if (choice) {
          setCurrentMode(AvatarModes.FourOptionQuestion);
        }
        break;

      case AvatarModes.RecommededLesson:
        if (choice) {
          setButtonsDisabled(false);
          onClickYes();
          playCurrentLesson();
        } else {
          onClickNo();
          setCurrentLesson(await getRecommendedLesson(cChapter, currentCourse));
        }
        break;
      default:
        break;
    }
    setTimeout(() => {
      setIsBurst(false);
    }, 1900);
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

    if (currentMode == AvatarModes.CourseSuggestion) {
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
    } else if (currentMode == AvatarModes.RecommededLesson) {
      currentStageIndex++;
      if (currentStageIndex === recommadedSuggestion.length - 1) {
        currentStageIndex = 0;
      }
      setCurrentLesson(recommadedSuggestion[currentStageIndex]);
      console.log(
        "recommadedSuggestion[currentStageIndex];",
        recommadedSuggestion,
        currentStageIndex,
        recommadedSuggestion[currentStageIndex]
      );

      return recommadedSuggestion[currentStageIndex];
    }
  }

  let buttons: { label: string; onClick: () => void }[] = [];

  switch (currentMode) {
    case AvatarModes.Welcome:
      buttons = [{ label: "Start", onClick: () => handleButtonClick(true) }];
      break;
    case AvatarModes.CourseSuggestion:
      switch (currentStageMode) {
        case AvatarModes.CourseSuggestion:
          const x1 = currentCourse?.title || "";

          avatarObj.message = t(`Do you want to play 'x1' course?`).replace(
            "x1",
            x1
          );
          buttons = [
            { label: t("Yes"), onClick: () => handleButtonClick(true) },
            { label: t("No"), onClick: () => handleButtonClick(false) },
          ];
          break;
        case AvatarModes.ChapterSuggestion:
          const x2 = currentChapter?.title || "";
          avatarObj.message = t(`Do you want to play 'x2' chapter?`).replace(
            "x2",
            x2
          );

          buttons = [
            { label: t("Yes"), onClick: () => handleButtonClick(true) },
            { label: t("No"), onClick: () => handleButtonClick(false) },
          ];
          break;
        case AvatarModes.LessonSuggestion:
          const x3 = currentLesson?.title || "";
          avatarObj.message = t(`Do you want to play 'x3' lesson?`).replace(
            "x3",
            x3
          );

          buttons = [
            { label: t("Yes"), onClick: () => handleButtonClick(true) },
            { label: t("No"), onClick: () => handleButtonClick(false) },
          ];
          break;
      }
      break;
    case AvatarModes.TwoOptionQuestion:
      // message = `Guess the Animal ?`;
      // setButtons([
      //   // { label: "1", onClick: () => handleButtonClick("1") },
      //   // { label: "2", onClick: () => handleButtonClick("2") },
      // ]);
      break;
    case AvatarModes.FourOptionQuestion:
      // message = `Guess the Animal 4 optionsF?`;
      // setButtons([
      //   // { label: "1", onClick: () => handleButtonClick("1") },
      //   // { label: "2", onClick: () => handleButtonClick("2") },
      //   // { label: "3", onClick: () => handleButtonClick("3") },
      //   // { label: "4", onClick: () => handleButtonClick("4") },
      // ]);
      break;
    case AvatarModes.RecommededLesson:
      console.log("const x1 = currentLesson?.title || ", currentLesson?.title);

      const x1 = currentLesson?.title || "";
      let tempMessage = avatarObj.message;
      tempMessage = t(tempMessage?.toString() || "").replace("x1", x1);
      avatarObj.message = tempMessage;
      buttons = [
        { label: t("Yes"), onClick: () => handleButtonClick(true) },
        { label: t("No"), onClick: () => handleButtonClick(false) },
      ];
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
        // clickHandler={() => handleButtonClick(userChoice)}
      />
      <div className={`avatar-option-box-background left-corner ${isBurst ? 'burst' : ''
        }`}>
        <div>
          <TextBoxWithAudioButton
            message={avatarObj.message}
            fontSize={"2vw"}
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

export default ChimpleAvatar;
