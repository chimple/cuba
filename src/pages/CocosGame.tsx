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
  REWARD_LEARNING_PATH,
  REWARD_LESSON,
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
import { ScreenOrientation } from "@capacitor/screen-orientation";

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
  const selectedLesson: Map<string, string> = state.selectedLesson ?? undefined;

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
    init();
    Util.checkingIfGameCanvasAvailable();
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "landscape" });
    }
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
  };

  const push = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPath: string = state?.from ?? PAGES.HOME;
    if (Capacitor.isNativePlatform()) {
      if (!!isDeviceAwake) {
        history.replace(fromPath + "&isReload=true", {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true
        });
        // window.location.reload();
      } else {
        history.replace(fromPath + "&isReload=false", {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true
        });
      }
      setIsLoading(false);
    } else {
      if (!!urlParams.get("isReload")) {
        if (fromPath.includes("?"))
          history.replace(fromPath + "&isReload=true", {
            course: courseDetail,
            lesson: lesson,
            chapterId: chapterDetail?.id,
            selectedLesson: selectedLesson,
            fromCocos: true
          });
        else history.replace(fromPath + "?isReload=true", {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true
        });
        window.location.reload();
      } else {
        history.replace(fromPath, {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true
        });
      }
    }
    setIsLoading(false);
  };

  const gameExit = async (e: any) => {
    const api = ServiceConfig.getI().apiHandler;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const data = e.detail as CocosLessonData;

    await Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent?.id ?? _currentUser?.id,
      left_game_no: data.currentGameNumber,
      left_game_name: data.gameName,
      chapter_id: data.chapterId,
      chapter_name: chapterDetail?.name ?? "",
      lesson_id: data.lessonId,
      lesson_name: lessonDetail.name,
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

    setTimeout(() => {
      killGame(e);
      document.body.removeEventListener(LESSON_END, handleLessonEndListner);
      setShowDialogBox(false);
      push();
    }, 100);
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
    let chapter_id;
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
      chapter_id = await api.getChapterByLesson(lesson.id, classId);
    } else {
      chapter_id = await api.getChapterByLesson(
        lesson.id,
        undefined,
        currentStudent.id
      );
    }
    // Check if the game was played from `learning_pathway`
    const learning_path: boolean = state?.learning_path ?? false;
    const is_homework: boolean = state?.isHomework ?? false; // Check for our new flag
    const homeworkIndex: number | undefined = state?.homeworkIndex; // 👈 ADD THIS

    const isReward: boolean = state?.reward ?? false;
    if (isReward === true) {
      sessionStorage.setItem(REWARD_LESSON, "true");
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
      currentStudent,
      courseDocId,
      lesson.id,
      data.score!,
      data.correctMoves,
      data.wrongMoves,
      data.timeSpent,
      assignmentId,
      chapterDetail?.id ?? chapter_id?.toString() ?? undefined,
      classId,
      schoolId
    );
    // Update the learning path
    if (learning_path) {
      await Util.updateLearningPath(currentStudent, isReward);
    } else if (is_homework) {
      // This handles our temporary homework path
      await Util.updateHomeworkPath(homeworkIndex);
    }
    // if (!!lessonDetail.cocos_chapter_code) {
    //   let cChap = courseDetail.chapters.find(
    //     (chap) => lessonDetail.cocos_chapter_code === chap.id
    //   );
    //   if (cChap) {
    //     ChapterDetail = cChap;
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
    //   existing.set(courseDetail.courseCode, finalLesson?.id);
    //   for (let [key, value] of existing) {
    //     res[key] = value;
    //   }
    //   localStorage.setItem(
    //     `${currentStudentDocId}-${RECOMMENDATIONS}`,
    //     JSON.stringify(res)
    //   );
    // }
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
      course_name: data.courseName,
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
              score={gameResult.detail?.score ?? 0}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              lessonName={lessonDetail.name ?? ""}
              noText={t("Continue Playing")}
              handleClose={(e: any) => {
                setShowDialogBox(true);
                //  saveTempData(gameResult.detail, undefined);
                // push();
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
