import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import LiveQuizRoomObject from "../models/liveQuizRoom";
import { PAGES } from "../common/constants";
import "./LiveQuizGame.css";
import LiveQuizCountdownTimer from "../components/liveQuiz/LiveQuizCountdownTimer";
import LiveQizHeader from "../components/liveQuiz/liveQuizHeader";

const LiveQuizGame: FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId");
  const [roomDoc, setRoomDoc] = useState<LiveQuizRoomObject>();
  const [isTimeOut, setIsTimeOut] = useState(false);

  useEffect(() => {
    if (!paramLiveRoomId) {
      history.push(PAGES.HOME);
      return;
    }

    const unsubscribe = api.liveQuizListener(paramLiveRoomId, handleRoomChange);

    return () => {
      unsubscribe();
    };
  }, []);
  const handleRoomChange = async (roomDoc: LiveQuizRoomObject) => {
    setRoomDoc(roomDoc);
  };

  return (
    <IonPage>
      <div className="live-quiz-container">
        <div className="live-quiz-top-div">
          {roomDoc && <LiveQizHeader roomDoc={roomDoc} />}
        </div>
        <div className="live-quiz-center-div">
          {roomDoc && !isTimeOut && (
            <LiveQuizCountdownTimer
              startsAt={roomDoc.startsAt}
              onTimeOut={() => {
                setIsTimeOut(true);
              }}
            />
          )}
          {isTimeOut && <p>Show Quiz</p>}
        </div>
      </div>
    </IonPage>
  );
};

export default LiveQuizGame;
