import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  EVENTS,
  GAME_END,
  GAME_EXIT,
  GAME_START,
  LESSONS_PLAYED_COUNT,
  LESSON_END,
  PAGES,
  RECOMMENDATIONS,
} from "../common/constants";
import Loading from "../components/Loading";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import {
  ASSIGNMENT_COMPLETED_IDS,
  Chapter,
  CocosLessonData,
  StudentLessonResult,
} from "../common/courseConstants";
import { ServiceConfig } from "../services/ServiceConfig";
import ScoreCard from "../components/parent/ScoreCard";
import { t } from "i18next";
import DialogBoxButtons from "../components/parent/DialogBoxButtons​";
import Course from "../models/course";
import { AvatarObj } from "../components/animation/Avatar";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { sendDataToJava } from "../components/lessonUtils";
import { sendEiduResultToJava } from "../utility/sendResultEidu";
import { send } from "ionicons/icons";
import { registerPlugin } from "@capacitor/core";


const CocosGame: React.FC = () => {
  const PortPlugin = registerPlugin<any>("Port");
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
  // const CourseDetail: Course = JSON.parse(state.course);
  // const lessonDetail: Lesson = JSON.parse(state.lesson);
  let initialCount = Number(localStorage.getItem(LESSONS_PLAYED_COUNT)) || 0;
  let lessonStartTime = 0;
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
    CapApp.addListener("appStateChange", handleAppStateChange);
    return () => {
      CapApp.removeAllListeners();
      CapApp.addListener("appStateChange", Util.onAppStateChange);
    };
  }, []);


  let idleTimeMs = 7000; // Default idle time

  // Function to update idle time dynamically
  function setIdleTime(newTime: number) {
      idleTimeMs = newTime;
      console.log("Idle time updated to:", idleTimeMs, "ms");
  
      // Start the idle detection with the new time
      detectUserIdleOnCanvas(idleTimeMs, () => {
          console.log("User is idle. Triggering action...");
  
          const currentTime = Date.now();
          const totalTimeSpent = currentTime - lessonStartTime; 
  
          sendEiduResultToJava("TIME_UP", null, totalTimeSpent, "User is idle", []);
      });
  }
  
  // Function to detect user inactivity
  function detectUserIdleOnCanvas(idleTime: number, callback: () => void) {
      let timeout: NodeJS.Timeout;
      const canvas = document.getElementById("GameCanvas");
  
      if (!canvas) {
          console.error("GameCanvas not found!");
          return;
      }
  
      function resetTimer() {
          clearTimeout(timeout);
          timeout = setTimeout( () => {
              console.log("User is idle for", idleTime, "ms");
              callback();
          }, idleTime);
      }
  
      // Add event listeners for touch and click on the canvas
      canvas.addEventListener("click", resetTimer);
      canvas.addEventListener("touchstart", resetTimer);
  
      resetTimer();
  }
  
  const handleAppStateChange = (state) => {
    if (state.isActive) {
      setDeviceAwake(true);
    } else {
      setDeviceAwake(false);
    }
  };
  const killGame = (e: any) => {
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
    // let ChapterDetail: Chapter | undefined;
    // if (!!lessonDetail.cocosChapterCode) {
    //   let cChap = CourseDetail.chapters.find(
    //     (chap) => lessonDetail.cocosChapterCode === chap.id
    //   );
    //   if (cChap) {
    //     ChapterDetail = cChap;
    //     const data = e.detail as CocosLessonData;
    //     console.log("Sending Lesson End Data to Java:", JSON.stringify(data, null, 2));
    //     const lessonStartTime = data.lessonStartTime || 0; // Ensure lessonStartTime is defined
    //     const currentTime = Date.now(); // Get current timestamp
    //     const totalTimeSpent = currentTime - lessonStartTime; // Calculate total time spent
    //     sendEiduResultToJava("ABORT", null, totalTimeSpent, "Lesson aborted", []);
    //     console.log("Current Chapter ", ChapterDetail);
    //   }
    const lessonEndData = e.detail as CocosLessonData;
    console.log("Sending Lesson End Data to Java:", JSON.stringify(lessonEndData, null, 2));
    const lessonStartTime = lessonEndData.lessonStartTime || 0; // Ensure lessonStartTime is defined
    const currentTime = Date.now(); // Get current timestamp
    const totalTimeSpent = currentTime - lessonStartTime; // Calculate total time spent
    sendEiduResultToJava("ABORT", null, totalTimeSpent, "Lesson aborted", []);
    console.log("Current Chapter ", ChapterDetail);


    const api = ServiceConfig.getI().apiHandler;
    const data = e.detail as CocosLessonData;
    killGame(e);    
    Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent!.docId,
      // assignment_id: lessonDetail.assignment?.docId,
      left_game_no: data.currentGameNumber,
      left_game_name: data.gameName,
      chapter_id: data.chapterId,
      chapter_name: ChapterDetail ? ChapterDetail.title : "",
      lesson_id: data.lessonId,
      // lesson_name: lessonDetail.title,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      // course_name: CourseDetail.title,
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

  const gameStart = async (e: any) => {
    const data = await PortPlugin.sendLaunchData();
    // Example usage: Set idle time to 5000ms and start detection
    setIdleTime(data.inactivityTimeoutInMs);
    console.log("Sending Lesson End Data to Java:", JSON.stringify(data, null, 2));
    lessonStartTime = e.detail.lessonStartTime;
    console.log("game start001");
  };
  
  async function init() {
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

    document.body.addEventListener(
      LESSON_END,
      async (event) => {
        if (!event.detail) {
          console.error("Lesson End Data is undefined!");
          return;
        }
    
        const lessonEndData = event.detail; // Extract event data
        console.log("Sending Lesson End Data to Java:", JSON.stringify(lessonEndData, null, 2));

        sendEiduResultToJava("SUCCESS", lessonEndData.score / 100, lessonEndData.timeSpent * 1000, "Lesson completed", []);

    
        // Send data to Java
        await sendDataToJava("lessonEnd", lessonEndData);
        
      },
      { once: true }
    );
    
    
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });
    document.body.addEventListener(GAME_START, gameStart, { once: true });
    

    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  const currentStudentDocId: string = Util.getCurrentStudent()?.docId || "";

  let ChapterDetail: Chapter | undefined;
  const api = ServiceConfig.getI().apiHandler;
  // const lesson: Lesson = JSON.parse(state.lesson);

  const saveTempData = async (
    lessonData: CocosLessonData,
    isLoved: boolean | undefined
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    const courseDocId: string | undefined = state.courseDocId;
    const lesson: Lesson = JSON.parse(state.lesson);
    console.log("🚀 ~ file: CocosGame.tsx:57 ~ init ~ lesson:", lesson);
    console.log("--------lesson data -------", lessonData);
    console.log("--------score of the lesson", lessonData.score);
    const currentStudent = api.currentStudent!;
    const data = lessonData;
    const isStudentLinked = await api.isStudentLinked(currentStudent.docId);
    let classId;
    let schoolId;
    if (isStudentLinked) {
      const studentResult = await api.getStudentResult(currentStudent.docId);
      if (!!studentResult && studentResult.classes.length > 0) {
        classId = studentResult.classes[0];
        schoolId = studentResult.schools[0];
      }
    }

    let avatarObj = AvatarObj.getInstance();
    console.log(
      "Cosos weeklyTimespent ",
      avatarObj.weeklyTimeSpent["min"],
      avatarObj.weeklyTimeSpent["sec"]
    );

    let finalProgressTimespent =
      avatarObj.weeklyTimeSpent["min"] * 60 + avatarObj.weeklyTimeSpent["sec"];
    finalProgressTimespent = finalProgressTimespent + data.timeSpent;
    let computeMinutes = Math.floor(finalProgressTimespent / 60);
    let computeSec = finalProgressTimespent % 60;

    avatarObj.weeklyTimeSpent["min"] = computeMinutes;
    avatarObj.weeklyTimeSpent["sec"] = computeSec;
    avatarObj.weeklyPlayedLesson++;
    console.log(
      "after Cosos weeklyTimespent ",
      computeMinutes,
      computeSec,
      avatarObj.weeklyTimeSpent["min"],
      avatarObj.weeklyTimeSpent["sec"]
    );

    const result = await api.updateResult(
      currentStudent,
      courseDocId,
      lesson.docId,
      data.score!,
      data.correctMoves,
      data.wrongMoves,
      data.timeSpent,
      isLoved,
      lesson.assignment?.docId,
      classId,
      schoolId
    );
    // if (!!lessonDetail.cocosChapterCode) {
    //   let cChap = CourseDetail.chapters.find(
    //     (chap) => lessonDetail.cocosChapterCode === chap.id
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
    //     CourseDetail.chapters,
    //     lessonData.chapterId,
    //     lesson.id,
    //     ChapterDetail
    //   );
    //   console.log("final lesson", finalLesson);
    //   existing.set(CourseDetail.courseCode, finalLesson?.id);
    //   for (let [key, value] of existing) {
    //     res[key] = value;
    //   }
    //   localStorage.setItem(
    //     `${currentStudentDocId}-${RECOMMENDATIONS}`,
    //     JSON.stringify(res)
    //   );
    // }
    Util.logEvent(EVENTS.LESSON_END, {
      user_id: currentStudent.docId,
      assignment_id: lesson.assignment?.docId,
      chapter_id: data.chapterId,
      chapter_name: ChapterDetail ? ChapterDetail.title : "",
      lesson_id: data.lessonId,
      lesson_name: lesson.title,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      // course_name: CourseDetail.title,
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
    if (!assignmentCompletedIds[api.currentStudent?.docId!]) {
      assignmentCompletedIds[api.currentStudent?.docId!] = [];
    }
    assignmentCompletedIds[api.currentStudent?.docId!].push(
      lesson.assignment?.docId
    );
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
              lessonName={"eidu-test"}
              noText={t("Continue Playing")}
              handleClose={(e: any) => {
                setShowDialogBox(true);
                // saveTempData(gameResult.detail, undefined);
                // push();
              }}
              onYesButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                console.log("--------------line 200 game result", gameResult);
                setIsLoading(true);
                await saveTempData(gameResult.detail, true);
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
                await saveTempData(gameResult.detail, undefined);
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
