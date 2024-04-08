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
import LiveQuizNavigationDots from "../components/liveQuiz/LiveQuizNavigationDots";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";

const LiveQuizGame: FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId");
  const [roomDoc, setRoomDoc] = useState<LiveQuizRoomObject>();
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>();
  const [remainingTime, setRemainingTime] = useState<number>();
  const [showAnswer, setShowAnswer] = useState(false);
  const { presentToast } = useOnlineOfflineErrorMessageHandler();

  useEffect(() => {
    if (!paramLiveRoomId) {
      history.replace(PAGES.HOME);
      return;
    }

    const unsubscribe = api.liveQuizListener(paramLiveRoomId, handleRoomChange);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRoomChange = async (roomDoc: LiveQuizRoomObject | undefined) => {
    if (!roomDoc) {
      presentToast({
        message: `Device is offline. Cannot join live quiz`,
        color: "danger",
        duration: 10000,
        position: "bottom",
        buttons: [
          {
            text: "Dismiss",
            role: "cancel",
          },
        ],
      });
      history.replace(PAGES.LIVE_QUIZ);
      return;
    } else setRoomDoc(roomDoc);
  };

  return (
    <IonPage>
      <div className="live-quiz-container">
        <div className="live-quiz-top-div">
          {roomDoc && (
            <LiveQuizHeader
              roomDoc={roomDoc}
              remainingTime={remainingTime}
              showAnswer={showAnswer}
              currentQuestion={
                currentQuestionIndex != null
                  ? liveQuizConfig?.data[currentQuestionIndex].question
                  : undefined
              }
            />
          )}
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
              isTimeOut={isTimeOut}
              onNewQuestionChange={(newQuestionIndex) => {
                console.log(
                  "🚀 ~ file: LiveQuizGame.tsx:54 ~ newQuestionIndex:",
                  newQuestionIndex,
                  liveQuizConfig?.data[newQuestionIndex]
                );
                setCurrentQuestionIndex(newQuestionIndex);
              }}
              onRemainingTimeChange={setRemainingTime}
              onShowAnswer={setShowAnswer}
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
