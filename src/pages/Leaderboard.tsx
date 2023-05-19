import { useEffect, useState } from "react";
import "./Leaderboard.css";
import {
  PAGES,
  PARENTHEADERLIST,
} from "../common/constants";
// import LeftTitleRectangularIconButton from "../components/parent/LeftTitleRectangularIconButton";
import { ServiceConfig } from "../services/ServiceConfig";
import BackButton from "../components/common/BackButton";
import { useHistory } from "react-router-dom";
import Loading from "../components/Loading";
import { IonPage } from "@ionic/react";
// import { EmailComposer } from "@ionic-native/email-composer";
// import Share from "react";

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<boolean>();
  const [musicFlag, setMusicFlag] = useState<boolean>();
  const [userProfile, setUserProfile] = useState<any[]>([]);
  const [langList, setLangList] = useState<string[]>([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();

  const history = useHistory();

  useEffect(() => {
    setIsLoading(true);
    setCurrentHeader(PARENTHEADERLIST.PROFILE);
    inti();
  }, []);

  async function inti() {
    const parentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (parentUser != undefined) {
      console.log("User ", parentUser);

      setIsLoading(false);
    }
  }

  function onHeaderIconClick(selectedHeader: any) {
    setCurrentHeader(selectedHeader);
  }

  function leaderboardUI() {
    return (
      <div id="leaderboard-UI">
        <div id="leaderboard-left-UI">leaderboard left</div>
        <div id="leaderboard-right-UI">leaderboard Right</div>
      </div>
    );
  }

  return (
    <IonPage>
      {!isLoading ? (
        <div id="leaderboard-page">
          <BackButton
           // iconSize={"8vh"}
            onClicked={() => {
              history.replace(PAGES.HOME);
            }}
          ></BackButton>
          {leaderboardUI()}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Leaderboard;
