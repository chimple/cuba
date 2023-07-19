import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  EVENTS,
  GAME_END,
  GAME_EXIT,
  LESSON_END,
  PAGES,
} from "../common/constants";
import Loading from "../components/Loading";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import {
  ASSIGNMENT_COMPLETED_IDS,
  CocosLessonData,
} from "../common/courseConstants";
import { ServiceConfig } from "../services/ServiceConfig";
import ScoreCard from "../components/parent/ScoreCard";
import { t } from "i18next";
import DialogBoxButtons from "../components/parent/DialogBoxButtons​";

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
  const currentStudent = Util.getCurrentStudent();

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
  }, []);

  const killGame = (e: any) => {
    setShowDialogBox(true);
    Util.killCocosGame();
  };

  const push = () => {
    history.replace(state.from ?? PAGES.HOME);
  };

  const gameExit = (e: any) => {
    const data = e.detail as CocosLessonData;
    console.log("GameExit LessonData ", e.detail);

    killGame(e);
    setShowDialogBox(false);
    push();
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
      (event) => {
        // setGameResult(event.detail as lessonEndData);
        setGameResult(event);
        console.log("----------line 100 add event listener------", event);
      },
      { once: true }
    );
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });

    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
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
              width={"50vw"}
              height={"60vh"}
              title={t("Congratulations🎊🎉")}
              score={gameResult.detail.gameScore}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              yesText={t("Like the Game")}
              lessonName={gameResult.detail.chapterName}
              noText={t("Continue Playing")}
              handleClose={(e: any) => {
                setShowDialogBox(true);
                // saveTempData(gameResult.detail, undefined);
                // push();
              }}
              onYesButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                await saveTempData(gameResult.detail, true);
                console.log(
                  "------------------the game result ",
                  gameResult.detail.score
                );
                push();
              }}
              onContinueButtonClicked={async (e: any) => {
                setShowDialogBox(false);
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
