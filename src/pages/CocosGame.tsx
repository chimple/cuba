import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { GAME_END, GAME_EXIT, LESSON_END, PAGES } from "../common/constants";
import Loading from "../components/Loading";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import { lessonEndData } from "../common/courseConstants";
import { ServiceConfig } from "../services/ServiceConfig";
import Course from "../models/course";

const CocosGame: React.FC = () => {
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  console.log("iFrameUrl", state?.url, iFrameUrl);
  const [isLoading, setIsLoading] = useState<any>();
  const [present] = useIonToast();

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
    Util.killCocosGame();
  };

  const push = () => {
    history.replace(state.from ?? PAGES.HOME);
  };

  const gameExit = (e: any) => {
    killGame(e);
    push();
  };

  async function init() {
    const api = ServiceConfig.getI().apiHandler;
    setIsLoading(true);
    const lesson: Lesson = JSON.parse(state.lesson);
    console.log("🚀 ~ file: CocosGame.tsx:57 ~ init ~ lesson:", lesson);
    const courseDocId: string | undefined = state.courseDocId;

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
    const saveTempData = async (e: any) => {
      console.log("🚀 ~ file: CocosGame.tsx:76 ~ saveTempData ~ e:", e);
      const data = e.detail as lessonEndData;
      const result = await api.updateResult(
        api.currentStudent!,
        courseDocId,
        lesson.docId,
        data.score,
        data.correctMoves,
        data.wrongMoves,
        data.timeSpent
      );
      push();
    };

    // const onProblemEnd = async (e: any) => {
    //   console.log("🚀 ~ file: CocosGame.tsx:73 ~ onProblemEnd ~ e:", e);
    //   push();
    // };

    document.body.addEventListener(LESSON_END, saveTempData, { once: true });
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });

    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default CocosGame;
