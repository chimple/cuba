import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
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
import { ServiceConfig } from "../services/ServiceConfig";
import ScoreCard from "../components/parent/ScoreCard";
import { t } from "i18next";
import { AvatarObj } from "../components/animation/Avatar";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
const CocosGame: React.FC = () => {
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  console.log("iFrameUrl", state?.url, iFrameUrl);
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
  useEffect(() => {
    console.log('JJJJJJJJJJJJJJJJJJJJJJJJ',chapterDetail)
    init();
    Util.checkingIfGameCanvasAvailable();
    CapApp.addListener("appStateChange", handleAppStateChange);
    return () => {
      CapApp.removeAllListeners();
      CapApp.addListener("appStateChange", Util.onAppStateChange);
      CapApp.addListener("appUrlOpen", Util.onAppUrlOpen);
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
    setShowDialogBox(true);
    Util.killCocosGame();
    initialCount++;
    localStorage.setItem(LESSONS_PLAYED_COUNT, initialCount.toString());
    console.log("---------count of LESSONS PLAYED", initialCount);
  };

  const push = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPath: string = state?.from ?? PAGES.HOME;
    if (Capacitor.isNativePlatform()) {
      if (!!isDeviceAwake) {
        history.replace(fromPath + "&isReload=true");
        window.location.reload();
      } else {
        history.replace(fromPath + "&isReload=false");
      }
      setIsLoading(false);
    } else {
      if (!!urlParams.get("isReload")) {
        if (fromPath.includes("?"))
          history.replace(fromPath + "&isReload=true");
        else history.replace(fromPath + "?isReload=true");
        window.location.reload();
      } else {
        history.replace(fromPath);
      }
    }
    setIsLoading(false);
  };

  const gameExit = async (e: any) => {
    // let chapterDetail: TableTypes<"chapter"> | undefined;
    // if (!!lessonDetail.cocos_chapter_code) {
    //   let cChap = courseDetail.chapters.find(
    //     (chap) => lessonDetail.cocosChapterCode === chap.id
    //   );
    //   if (cChap) {
    //     ChapterDetail = cChap;
    //     console.log("Current Chapter ", ChapterDetail);
    //   }
    // }
    const api = ServiceConfig.getI().apiHandler;
    const data = e.detail as CocosLessonData;
    killGame(e);
    document.body.removeEventListener(LESSON_END, handleLessonEndListner);
    Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent!.id,
      // assignment_id: lessonDetail.assignment?.id,
      left_game_no: data.currentGameNumber,
      left_game_name: data.gameName,
      chapter_id: data.chapterId,
      chapter_name: chapterDetail ? chapterDetail.name : "",
      lesson_id: data.lessonId,
      lesson_name: lessonDetail.name,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      course_name: courseDetail.name,
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
    });
    setShowDialogBox(false);
    push();
  };
  const handleLessonEndListner = (event) => {
    saveTempData(event.detail);
    setGameResult(event);
  };
  async function init() {
    const currentStudent = Util.getCurrentStudent();
    setIsLoading(true);
    const lessonId: string = state.lessonId;
    const lessonIds: string[] = [];
    lessonIds.push(lessonId);
    console.log("cocosGame page lessonIds", lessonIds);
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    console.log("donwloaded ", dow);
    setIsLoading(false);
    Util.launchCocosGame();

    //Just fot Testing

    // const onProblemEnd = async (e: any) => {
    //   console.log("🚀 ~ file: CocosGame.tsx:73 ~ onProblemEnd ~ e:", e);
    //   push();
    // };

    document.body.addEventListener(LESSON_END, handleLessonEndListner, {
      once: true,
    });
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });

    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  const currentStudentDocId: string = Util.getCurrentStudent()?.id || "";

  let ChapterDetail: Chapter | undefined;
  const api = ServiceConfig.getI().apiHandler;
  const lesson: Lesson = JSON.parse(state.lesson);

  const updateLessonAsFavorite = async () => {
    const currentStudent = Util.getCurrentStudent();
    const lesson: Lesson = JSON.parse(state.lesson);
    if (currentStudent != null) {
      const result = await api.updateFavoriteLesson(
        currentStudent.id,
        lesson.id
      );
    }
  };

  const saveTempData = async (lessonData: CocosLessonData) => {
    const api = ServiceConfig.getI().apiHandler;
    const courseDocId: string | undefined = state.courseDocId;
    const lesson: Lesson = JSON.parse(state.lesson);
    const assignment = state.assignment;
    const currentStudent = api.currentStudent!;
    const data = lessonData;
    let assignmentId = assignment ? assignment.id : null;
    const isStudentLinked = await api.isStudentLinked(currentStudent.id);
    let classId;
    let schoolId;
    if (isStudentLinked) {
      const studentResult = await api.getStudentClassesAndSchools(
        currentStudent.id
      );
      if (!!studentResult && studentResult.classes.length > 0) {
        classId = studentResult.classes[0].id;
        schoolId = studentResult.schools[0].id;
      }
      if (!assignmentId) {
        const result = await api.getPendingAssignmentForLesson(
          lesson.id,
          classId,
          currentStudent.id
        );
        if (result) {
          assignmentId = result?.id;
        }
      }
      var chapter_id = await api.getChapterByLesson(lesson.id, classId);
    }
    let avatarObj = AvatarObj.getInstance();
    let finalProgressTimespent =
      avatarObj.weeklyTimeSpent["min"] * 60 + avatarObj.weeklyTimeSpent["sec"];
    finalProgressTimespent = finalProgressTimespent + data.timeSpent;
    let computeMinutes = Math.floor(finalProgressTimespent / 60);
    let computeSec = finalProgressTimespent % 60;
    avatarObj.weeklyTimeSpent["min"] = computeMinutes;
    avatarObj.weeklyTimeSpent["sec"] = computeSec;
    avatarObj.weeklyPlayedLesson++;
    const result = await api.updateResult(
      currentStudent.id,
      courseDocId,
      lesson.id,
      data.score!,
      data.correctMoves,
      data.wrongMoves,
      data.timeSpent,
      assignmentId,
      chapterDetail?.id ?? chapter_id?.toString() ?? "",
      classId,
      schoolId
    );
    // if (!!lessonDetail.cocos_chapter_code) {
    //   let cChap = courseDetail.chapters.find(
    //     (chap) => lessonDetail.cocos_chapter_code === chap.id
    //   );
    //   if (cChap) {
    //     ChapterDetail = cChap;
    //     console.log("Current Chapter ", ChapterDetail);
    //   }
    //   let existing = new Map();
    //   let res: { [key: string]: string } = JSON.parse(
    //     localStorage.getItem(`${currentStudentDocId}-${RECOMMENDATIONS}`) ||
    //       "{}"
    //   );
    //   const finalLesson = await Util.getNextLessonFromGivenChapter(
    //     courseDetail.chapters,
    //     lessonData.chapterId,
    //     lesson.id,
    //     ChapterDetail
    //   );
    //   console.log("final lesson", finalLesson);
    //   existing.set(courseDetail.courseCode, finalLesson?.id);
    //   for (let [key, value] of existing) {
    //     res[key] = value;
    //   }
    //   localStorage.setItem(
    //     `${currentStudentDocId}-${RECOMMENDATIONS}`,
    //     JSON.stringify(res)
    //   );
    // }
    Util.logEvent(EVENTS.LESSON_END, {
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
      course_name: courseDetail.name,
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
    });
    console.log("🚀 ~ file: CocosGame.tsx:88 ~ saveTempData ~ result:", result);
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
  };

  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <Loading isLoading={isLoading} />
        {showDialogBox && (
          <div>
            <ScoreCard
              title={t("🎉Congratulations🎊")}
              score={gameResult.detail.score}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              yesText={t("Like the Game")}
              lessonName={lessonDetail.name ?? ""}
              noText={t("Continue Playing")}
              handleClose={(e: any) => {
                setShowDialogBox(true);
                //  saveTempData(gameResult.detail, undefined);
                // push();
              }}
              onYesButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                console.log("--------------line 200 game result", gameResult);
                setIsLoading(true);
                await updateLessonAsFavorite();
                console.log(
                  "------------------the game result ",
                  gameResult.detail.score
                );
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
                console.log(
                  "------------------the game result ",
                  gameResult.detail.score
                );
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
