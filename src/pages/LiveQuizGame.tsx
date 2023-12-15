import { IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import LiveQuizRoomObject from "../models/liveQuizRoom";
import { PAGES } from "../common/constants";
import "./LiveQuizGame.css";
import LiveQuizCountdownTimer from "../components/liveQuiz/LiveQuizCountdownTimer";
import LiveQuizQuestion from "../components/liveQuiz/LiveQuizQuestion";
import LiveQuiz from "../models/liveQuiz";
import LiveQuizHeader from "../components/liveQuiz/LiveQuizHeader";

const LiveQuizGame: FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId");
  const [roomDoc, setRoomDoc] = useState<LiveQuizRoomObject>();
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();

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
          {roomDoc && <LiveQuizHeader roomDoc={roomDoc} />}
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
          {roomDoc && (
            <LiveQuizQuestion
              roomDoc={roomDoc}
              onNewQuestionChange={(newQuestionIndex) => {
                console.log(
                  "🚀 ~ file: LiveQuizGame.tsx:54 ~ newQuestionIndex:",
                  newQuestionIndex,
                  liveQuizConfig?.data[newQuestionIndex]
                );
              }}
              showQuiz={isTimeOut}
              onConfigLoaded={setLiveQuizConfig}
              onQuizEnd={() => {
                console.log("🚀 ~ file: LiveQuizGame.tsx:65 ~ onQuizEnd:");
                history.replace(
                  PAGES.LIVE_QUIZ_ROOM_RESULT + "?liveRoomId=" + paramLiveRoomId
                );
              }}
            />
          )}
        </div>
      </div>
    </IonPage>
  );
};

export default LiveQuizGame;
