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
import { registerPlugin } from "@capacitor/core";
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
  const PortPlugin = registerPlugin<any>("Port");

  useEffect(() => {
    window.console.log("cocos game useEffect");
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
    console.log("---------count of LESSONS PLAYED", initialCount);
  };

  const push = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let fromPath: string = state?.from ?? PAGES.HOME;

      console.log("Checking fromPath conditions", fromPath);

      // Reset to home if trying to go back to an unloaded game screen
      if (fromPath === PAGES.GAME || fromPath.includes(PAGES.GAME)) {
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
    const data = e.detail as CocosLessonData;
    killGame(e);
    document.body.removeEventListener(LESSON_END, handleLessonEndListner);
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
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    console.log("donwloaded ", dow);
    setIsLoading(false);
    Util.launchCocosGame();

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
    const lessonNormal: Lesson = state.lesson ? JSON.parse(state.lesson) : undefined;
    
    if(Util.isDeepLink) {
      const deeplinkdata = await PortPlugin.sendLaunchData();
      const deeplinkLesson = await api.getLesson(deeplinkdata.lessonId);
      lesson = deeplinkLesson;
    
    }       
    else {
      lesson = lessonNormal;
    }
    
    console.log("upating fav lesson --> ", lesson);

    if (currentStudent != null && lesson && lesson.id) {
      console.log("calling the fav api");
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

      if(Util.isDeepLink) {
        const deeplinkdata = await PortPlugin.sendLaunchData();
        const deeplinkLesson = await api.getLesson(deeplinkdata.lessonId);
        lesson = deeplinkLesson;
      }
      else {
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
        chapter_id = await api.getChapterByLesson(lesson?.id || "", classId);
      } else {
        chapter_id = await api.getChapterByLesson(
          lesson?.id || "",
          undefined,
          currentStudent?.id
        );
      }
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
              score={gameResult.detail.score}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              yesText={t("Like the Game")}
              lessonName={lessonDetail?.name ?? ""}
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
