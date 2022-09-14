import { IonContent, IonLoading, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Util } from "../utility/util";

const CocosGame: React.FC = () => {
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  const iFrameUrl = state.url;
  console.log("iFrameUrl", iFrameUrl);
  const [isLoading, setIsLoading] = useState<any>();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setIsLoading(true);
    const dow = await Util.downloadZipBundle(state.lessonId).catch((er) => {
      console.log(" err donwloaded ", er);
    });
    console.log("donwloaded ", dow);
    setIsLoading(false);
    document.getElementById("iframe")?.focus();
    const push = (e: any) => {
      history.replace("/end", e.detail);
    };
    document.body.addEventListener("gameEnd", push);
    let prevPercentage = 0;
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
