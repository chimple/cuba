import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  APP_URL_OPEN,
  EVENTS,
  GAME_END,
  GAME_EXIT,
  LESSONS_PLAYED_COUNT,
  LESSON_END,
  PAGES,
  TableTypes,
} from "../common/constants";
import Loading from "../components/Loading";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import {
  ASSIGNMENT_COMPLETED_IDS,
  Chapter,
  CocosLessonData,
} from "../common/courseConstants";
import { registerPlugin } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import ScoreCard from "../components/parent/ScoreCard";
import { t } from "i18next";
import { AvatarObj } from "../components/animation/Avatar";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
const CocosGame: React.FC = () => {
  const history = useHistory();
  const location = history.location.state as {
    from?: string;
    assignment?: any;
  };
  // const playedFrom = location?.from?.split('/')[1].split('?')[0]
  const playedFrom = localStorage.getItem("currentHeader");
  const assignmentType = location?.assignment?.type || "self-played";
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  const [isLoading, setIsLoading] = useState<any>();
  const [present] = useIonToast();
  const [showDialogBox, setShowDialogBox] = useState(false);
  // let gameResult : any;
  const [gameResult, setGameResult] = useState<any>();
  const [isDeviceAwake, setDeviceAwake] = useState(false);
  const currentStudent = Util.getCurrentStudent();
  const courseDetail: TableTypes<"course"> = state.course
    ? JSON.parse(state.course)
    : undefined;
  const chapterDetail: TableTypes<"chapter"> = state.chapter
    ? JSON.parse(state.chapter)
    : undefined;
  const lessonDetail: TableTypes<"lesson"> = state.lesson
    ? JSON.parse(state.lesson)
    : undefined;
  let initialCount = Number(localStorage.getItem(LESSONS_PLAYED_COUNT)) || 0;
  const presentToast = async () => {
    await present({
      message: "Something went wrong!",
      color: "danger",
      duration: 3000,
      position: "bottom",
      buttons: [
        {
          text: "Dismiss",
          role: "cancel",
        },
      ],
    });
  };
  const PortPlugin = registerPlugin<any>("Port");

  useEffect(() => {
    init();
    Util.checkingIfGameCanvasAvailable();
    CapApp.addListener("appStateChange", handleAppStateChange);
    return () => {
      CapApp.removeAllListeners();
      CapApp.addListener("appStateChange", Util.onAppStateChange);
      CapApp.addListener(APP_URL_OPEN, Util.onAppUrlOpen);
    };
  }, []);

  const handleAppStateChange = (state) => {
    if (state.isActive) {
      setDeviceAwake(true);
    } else {
      setDeviceAwake(false);
    }
  };
  const killGame = (e: any) => {
    document.body.removeEventListener(LESSON_END, handleLessonEndListner);
    setShowDialogBox(false);

    Util.killCocosGame();
    initialCount++;
    localStorage.setItem(LESSONS_PLAYED_COUNT, initialCount.toString());
    console.log("---------count of LESSONS PLAYED", initialCount);
  };

  const gameEnd = (e: any) => {
    document.body.removeEventListener(LESSON_END, handleLessonEndListner);
    setShowDialogBox(true);

    Util.killCocosGame();
    initialCount++;
    localStorage.setItem(LESSONS_PLAYED_COUNT, initialCount.toString());
  };

  const push = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let fromPath: string = state?.from ?? PAGES.HOME;
      console.log("Checking fromPath conditions", fromPath);

      // Reset to home if trying to go back to an unloaded game screen
      if (
        Util.isDeepLink ||
        fromPath === PAGES.GAME ||
        fromPath.includes(PAGES.GAME)
      ) {
        Util.isDeepLink = false;
        fromPath = PAGES.HOME;
        console.log("Resetting fromPath to:", fromPath);
      }

      if (Capacitor.isNativePlatform()) {
        console.log("Running on a native platform...");

        // Ensure we don't reload multiple times
        if (!urlParams.get("isReload") && Util.isDeepLink) {
          Util.isDeepLink = false;
          const newPath = `${fromPath}?isReload=true`;
          history.replace(newPath);
          window.location.reload();
        } else {
          history.replace(fromPath);
        }
      } else {
        console.log("Running on a web platform...");

        // Append query parameters safely
        const newPath = new URL(fromPath, window.location.origin);
        newPath.searchParams.set("isReload", "true");

        history.replace(newPath.pathname + newPath.search);

        // Reload only if not already done
        if (!urlParams.get("isReload")) {
          window.location.reload();
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Navigation error:", error);
      history.replace(`${PAGES.APP_UPDATE}?isReload=true`);
    }
  };

  const gameExit = async (e: any) => {
    const api = ServiceConfig.getI().apiHandler;
    if (!api.currentStudent) {
      console.error("[ERROR] currentStudent is undefined in gameExit");
      setShowDialogBox(false);
      setIsLoading(false);
      push();
      return;
    }
    const data = e.detail as CocosLessonData;
    await Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent.id,
      left_game_no: data.currentGameNumber,
      left_game_name: data.gameName,
      chapter_id: data.chapterId,
      chapter_name: chapterDetail?.name ?? "",
      lesson_id: data.lessonId,
      lesson_name: lessonDetail?.name ?? undefined,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      course_name: courseDetail?.name ?? "",
      time_spent: data.timeSpent,
      total_moves: data.totalMoves,
      total_games: data.totalGames,
      correct_moves: data.correctMoves,
      wrong_moves: data.wrongMoves,
      game_score: data.gameScore,
      quiz_score: data.quizScore,
      game_completed: data.gameCompleted,
      quiz_completed: data.quizCompleted,
      game_time_spent: data.gameTimeSpent,
      quiz_time_spent: data.quizTimeSpent,
      played_from: playedFrom,
      assignment_type: assignmentType,
    });
    killGame(e);
    document.body.removeEventListener(LESSON_END, handleLessonEndListner);
    setShowDialogBox(false);
    push();
  };
  const handleLessonEndListner = (event) => {
    saveTempData(event.detail);
    setGameResult(event);
  };

  const updateLearningPath = async () => {
    if (!currentStudent) return;
    const learningPath = currentStudent.learning_path
      ? JSON.parse(currentStudent.learning_path)
      : null;

    if (!learningPath) return;

    try {
      const { courses } = learningPath;
      const currentCourse = courses.courseList[courses.currentCourseIndex];

      const prevLessonId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .path[
          learningPath.courses.courseList[
            learningPath.courses.currentCourseIndex
          ].currentIndex
        ].lesson_id;
      const prevChapterId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .path[
          learningPath.courses.courseList[
            learningPath.courses.currentCourseIndex
          ].currentIndex
        ].chapter_id;
      const prevCourseId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .course_id;
      const prevPathId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .path_id;
      // Update currentIndex
      currentCourse.currentIndex += 1;

      // Check if currentIndex exceeds pathEndIndex
      if (currentCourse.currentIndex > currentCourse.pathEndIndex) {
        currentCourse.startIndex = currentCourse.currentIndex;
        currentCourse.pathEndIndex += 5;

        // Ensure pathEndIndex does not exceed the path length
        if (currentCourse.pathEndIndex > currentCourse.path.length) {
          currentCourse.pathEndIndex = currentCourse.path.length - 1;
        }

        // Move to the next course
        courses.currentCourseIndex += 1;

        await api.setStarsForStudents(currentStudent.id, 10);
        // Loop back to the first course if at the last course
        if (courses.currentCourseIndex >= courses.courseList.length) {
          courses.currentCourseIndex = 0;
        }
        const pathwayEndData = {
          user_id: currentStudent.id,
          current_path_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].path_id,
          current_course_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].course_id,
          current_lesson_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].path[
              learningPath.courses.courseList[
                learningPath.courses.currentCourseIndex
              ].currentIndex
            ].lesson_id,
          current_chapter_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].path[
              learningPath.courses.courseList[
                learningPath.courses.currentCourseIndex
              ].currentIndex
            ].chapter_id,
          prev_path_id: prevPathId,
          prev_course_id: prevCourseId,
          prev_lesson_id: prevLessonId,
          prev_chapter_id: prevChapterId,
        };
        await Util.logEvent(EVENTS.PATHWAY_COMPLETED, pathwayEndData);
        await Util.logEvent(EVENTS.PATHWAY_COURSE_CHANGED, pathwayEndData);
      }

      // Update the learning path in the database
      await api.updateLearningPath(
        currentStudent,
        JSON.stringify(learningPath)
      );
      // Update the current student object
      const updatedStudent = await api.getUserByDocId(currentStudent.id);
      if (updatedStudent) {
        Util.setCurrentStudent(updatedStudent);
      }
    } catch (error) {
      console.error("Error updating learning path:", error);
    }
  };

  async function init() {
    const currentStudent = Util.getCurrentStudent();
    setIsLoading(true);
    const lessonId: string = state.lessonId;
    const lessonIds: string[] = [];
    lessonIds.push(lessonId);
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    setIsLoading(false);
    Util.launchCocosGame();

    //Just fot Testing

    // const onProblemEnd = async (e: any) => {
    //   push();
    // };

    document.body.addEventListener(LESSON_END, handleLessonEndListner, {
      once: true,
    });
    document.body.addEventListener(GAME_END, gameEnd, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });
  }
  const currentStudentDocId: string = Util.getCurrentStudent()?.id || "";

  let ChapterDetail: Chapter | undefined;
  const api = ServiceConfig.getI().apiHandler;
  const lesson: Lesson = state.lesson ? JSON.parse(state.lesson) : undefined;

  const updateLessonAsFavorite = async () => {
    const currentStudent = Util.getCurrentStudent();
    let lesson;
    const lessonNormal: Lesson = state.lesson
      ? JSON.parse(state.lesson)
      : undefined;

    if (Util.isDeepLink) {
      const deeplinkdata = await PortPlugin.sendLaunchData();
      const deeplinkLesson = await api.getLesson(deeplinkdata.lessonId);
      lesson = deeplinkLesson;
    } else {
      lesson = lessonNormal;
    }

    if (currentStudent != null && lesson && lesson.id) {
      const result = await api.updateFavoriteLesson(
        currentStudent.id,
        lesson.id
      );
    } else {
      console.warn("Cannot update favorite lesson: Invalid lesson or student.");
    }
  };

  const saveTempData = async (lessonData: CocosLessonData) => {
    try {
      const api = ServiceConfig.getI().apiHandler;
      const courseDocId: string | undefined = state.courseDocId;
      let lesson;
      const lessonNormal: Lesson = state.lesson
        ? JSON.parse(state.lesson)
        : undefined;

      if (Util.isDeepLink) {
        const deeplinkdata = await PortPlugin.sendLaunchData();
        const deeplinkLesson = await api.getLesson(deeplinkdata.lessonId);
        lesson = deeplinkLesson;
      } else {
        lesson = lessonNormal;
      }

      const assignment = state?.assignment;
      const currentStudent = api.currentStudent!;
      const data = lessonData;
      let assignmentId = assignment ? assignment?.id : null;
      const isStudentLinked = await api.isStudentLinked(currentStudent?.id);
      let classId;
      let schoolId;
      let chapter_id;
      if (isStudentLinked) {
        const studentResult = await api.getStudentClassesAndSchools(
          currentStudent.id
        );
        if (!!studentResult && studentResult.classes.length > 0) {
          classId = studentResult.classes[0]?.id;
          schoolId = studentResult.schools[0]?.id;
        }
        if (!assignmentId) {
          const result = await api.getPendingAssignmentForLesson(
            lesson?.id || "",
            classId,
            currentStudent?.id
          );
          if (result) {
            assignmentId = result?.id;
          }
        }
        chapter_id = await api.getChapterIDByLessonID(
          lesson?.id || "",
          classId
        );
      } else {
        chapter_id = await api.getChapterIDByLessonID(
          lesson?.id || "",
          undefined,
          currentStudent?.id
        );
      }
      const learning_path: string = state?.learning_path ?? false;
      let avatarObj = AvatarObj.getInstance();
      let finalProgressTimespent =
        avatarObj.weeklyTimeSpent["min"] * 60 +
        avatarObj.weeklyTimeSpent["sec"];
      finalProgressTimespent = finalProgressTimespent + data.timeSpent;
      let computeMinutes = Math.floor(finalProgressTimespent / 60);
      let computeSec = finalProgressTimespent % 60;
      avatarObj.weeklyTimeSpent["min"] = computeMinutes;
      avatarObj.weeklyTimeSpent["sec"] = computeSec;
      avatarObj.weeklyPlayedLesson++;
      await Util.logEvent(EVENTS.LESSON_END, {
        user_id: currentStudent.id,
        // assignment_id: lesson.assignment?.id,
        chapter_id: data.chapterId,
        // chapter_name: ChapterDetail ? ChapterDetail.name : "",
        lesson_id: data.lessonId,
        // lesson_name: lesson.name,
        lesson_type: data.lessonType,
        lesson_session_id: data.lessonSessionId,
        ml_partner_id: data.mlPartnerId,
        ml_class_id: data.mlClassId,
        ml_student_id: data.mlStudentId,
        course_id: data.courseId,
        course_name: courseDetail?.name ?? undefined,
        time_spent: data.timeSpent,
        total_moves: data.totalMoves,
        total_games: data.totalGames,
        correct_moves: data.correctMoves,
        wrong_moves: data.wrongMoves,
        game_score: data.gameScore,
        quiz_score: data.quizScore,
        game_completed: data.gameCompleted,
        quiz_completed: data.quizCompleted,
        game_time_spent: data.gameTimeSpent,
        quiz_time_spent: data.quizTimeSpent,
        score: data.score,
        played_from: playedFrom,
        assignment_type: assignmentType,
      });
      const result = await api.updateResult(
        currentStudent?.id,
        courseDocId,
        lesson?.id,
        data.score!,
        data.correctMoves,
        data.wrongMoves,
        data.timeSpent,
        assignmentId,
        chapterDetail?.id ?? chapter_id?.toString() ?? "",
        classId,
        schoolId
      );
      // Check if the game was played from the `/home` URL and if the user is connected to a class, Update the learning path only if the conditions are met
      if (learning_path) {
        await updateLearningPath();
      }

      console.log(
        "🚀 ~ file: CocosGame.tsx:88 ~ saveTempData ~ result:",
        result
      );
      let tempAssignmentCompletedIds = localStorage.getItem(
        ASSIGNMENT_COMPLETED_IDS
      );
      let assignmentCompletedIds;
      if (!tempAssignmentCompletedIds) {
        assignmentCompletedIds = {};
      } else {
        assignmentCompletedIds = JSON.parse(tempAssignmentCompletedIds);
      }
      if (!assignmentCompletedIds[api.currentStudent?.id!]) {
        assignmentCompletedIds[api.currentStudent?.id!] = [];
      }
      // assignmentCompletedIds[api.currentStudent?.id!].push(lesson.assignment?.id);
      localStorage.setItem(
        ASSIGNMENT_COMPLETED_IDS,
        JSON.stringify(assignmentCompletedIds)
      );
    } catch (error) {
      console.error("Error: SaveTempData", error);
    }
  };
  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <Loading isLoading={isLoading} />
        {showDialogBox && (
          <div>
            <ScoreCard
              title={t("🎉Congratulations🎊")}
              score={gameResult.detail?.score ?? 0}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              yesText={t("Like the Game")}
              lessonName={lessonDetail?.name ?? ""}
              noText={t("Continue Playing")}
              handleClose={async (e: any) => {
                setShowDialogBox(false);
                setIsLoading(true);
                if (gameResult && gameResult.detail) {
                  await gameExit({ detail: gameResult.detail });
                } else {
                  push();
                }
              }}
              onYesButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                setIsLoading(true);
                await updateLessonAsFavorite();
                if (initialCount >= 5) {
                  Util.showInAppReview();
                  initialCount = 0;
                  localStorage.setItem(
                    LESSONS_PLAYED_COUNT,
                    initialCount.toString()
                  );
                }
                push();
              }}
              onContinueButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                setIsLoading(true);
                // await saveTempData(gameResult.detail, undefined);
                push();
              }}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CocosGame;
