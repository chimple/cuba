import { IonContent, IonLoading, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { GAME_END, LESSON_END, TEMP_LESSONS_STORE } from "../common/constants";
import { Util } from "../utility/util";

const CocosGame: React.FC = () => {
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  console.log("iFrameUrl", iFrameUrl);
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

  async function init() {
    setIsLoading(true);
    const dow = await Util.downloadZipBundle(state.lessonId);
    if (!dow) {
      presentToast();
      history.goBack();
      return;
    }
    console.log("donwloaded ", dow);
    setIsLoading(false);
    document.getElementById("iframe")?.focus();
    const push = (e: any) => {
      history.goBack();
    };

    //Just fot Testing
    const saveTempData = (e: any) => {
      const json = localStorage.getItem(TEMP_LESSONS_STORE);
      let lessons: any = {};
      if (json) {
        lessons = JSON.parse(json);
      }
      lessons[e.detail.lessonId] = e.detail.score;
      localStorage.setItem(TEMP_LESSONS_STORE, JSON.stringify(lessons));
    };

    document.body.addEventListener(LESSON_END, saveTempData);
    document.body.addEventListener(GAME_END, push);

    // let prevPercentage = 0;
    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <IonLoading
          cssClass="my-custom-class"
          isOpen={isLoading}
          message={"Please wait..."}
        />
        {!isLoading ? (
          <iframe
            src={iFrameUrl}
            id="iframe"
            style={{ height: "100vh", width: "100vw" }}
            frameBorder="0"
          ></iframe>
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default CocosGame;
