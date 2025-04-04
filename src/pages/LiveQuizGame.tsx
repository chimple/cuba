import { IonContent, IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import LiveQuizRoomObject from "../models/liveQuizRoom";
import { LESSONS_PLAYED_COUNT, PAGES } from "../common/constants";
import "./LiveQuizGame.css";
import LiveQuizCountdownTimer from "../components/liveQuiz/LiveQuizCountdownTimer";
import LiveQuizQuestion from "../components/liveQuiz/LiveQuizQuestion";
import LiveQuiz from "../models/liveQuiz";
import LiveQuizHeader from "../components/liveQuiz/LiveQuizHeader";
import LiveQuizNavigationDots from "../components/liveQuiz/LiveQuizNavigationDots";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import ScoreCard from "../components/parent/ScoreCard";
import { t } from "i18next";
import { Capacitor } from "@capacitor/core";
import { Util } from "../utility/util";

const LiveQuizGame: FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId");
  const paramLessonId = urlSearchParams.get("lessonId");
  const [roomDoc, setRoomDoc] = useState<LiveQuizRoomObject>();
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>();
  const [remainingTime, setRemainingTime] = useState<number>();
  const [showAnswer, setShowAnswer] = useState(false);
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [showScoreCard, setShowScoreCard] = useState<boolean>(false);
  const state = history.location.state as any;
  const [lessonName, setLessonName] = useState<string>("");
  const [scoreData, setScoreData] = useState<any>();
  let initialCount = Number(localStorage.getItem(LESSONS_PLAYED_COUNT)) || 0;

  useEffect(() => {
    console.log('roomDoc: ', roomDoc)
  }, [roomDoc])

  useEffect(() => {
    if (!paramLiveRoomId && !paramLessonId) {
      history.replace(PAGES.HOME);
      return;
    }
    if (paramLiveRoomId) {
      const unsubscribe = api.liveQuizListener(
        paramLiveRoomId,
        handleRoomChange
      );
      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    const fetchLessonName = async () => {
      if (paramLessonId) {
        const lessonData = await api.getLessonWithCocosLessonId(paramLessonId);
        setLessonName(lessonData?.title ?? "");
      }
    };
    fetchLessonName();
  }, [paramLessonId]);

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
  const handleQuizEnd = () => {
    setShowScoreCard(true);
    setShowDialogBox(true);
  };

  const push = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPath: string = state?.from ?? PAGES.HOME;
    if (Capacitor.isNativePlatform()) {
      history.replace(fromPath + "&isReload=false");
    } else {
      if (!!urlParams.get("isReload")) {
        if (fromPath.includes("?")) {
          history.replace(fromPath + "&isReload=true");
        } else {
          history.replace(fromPath + "?isReload=true");
        }
      } else {
        history.replace(fromPath);
      }
    }
  };

  const saveLikedStatus = async (scoreData: any, isLoved?: boolean) => {
    const api = ServiceConfig.getI().apiHandler;
    const currentStudent = api.currentStudent!;

    api.updateResult(
      currentStudent,
      scoreData.courseId,
      scoreData.lessonId,
      scoreData.totalScore,
      scoreData.correctMoves,
      scoreData.incorrectMoves,
      scoreData.totalTimeSpent,
      isLoved,
      scoreData.assignmentId,
      scoreData.classId,
      scoreData.schoolId
    );
  };

  return (
    <IonPage>
      {paramLessonId ? (
        <div className="live-quiz-container">
          <div className="live-quiz-center-div">
            {paramLessonId && (
              <LiveQuizQuestion
                lessonId={paramLessonId}
                isTimeOut={true}
                onNewQuestionChange={(newQuestionIndex) => {
                  console.log(
                    "🚀 ~ file: LiveQuizGame.tsx:136 ~ newQuestionIndex:",
                    newQuestionIndex,
                    liveQuizConfig?.data[newQuestionIndex]
                  );
                  setCurrentQuestionIndex(newQuestionIndex);
                }}
                onRemainingTimeChange={setRemainingTime}
                onShowAnswer={setShowAnswer}
                showQuiz={true}
                onConfigLoaded={setLiveQuizConfig}
                onTotalScoreChange={(scoreData) => {
                  console.log("✅ Updating Total Score:", scoreData.totalScore);
                  setScoreData(scoreData);
                }}
                onQuizEnd={handleQuizEnd}
              />
            )}
          </div>
          <IonContent>
            {showScoreCard ? (
              <ScoreCard
                title={t("🎉Congratulations🎊")}
                score={scoreData.totalScore ?? 0}
                message={t("You Completed the Lesson:")}
                showDialogBox={showDialogBox}
                yesText={t("Like the Game")}
                lessonName={lessonName}
                noText={t("Continue Playing")}
                handleClose={() => setShowDialogBox(true)}
                onYesButtonClicked={() => {
                  console.log(
                    "User liked the game, score.",
                    scoreData.totalScore
                  );
                  setShowDialogBox(false);
                  saveLikedStatus(scoreData, true);
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
                onContinueButtonClicked={() => {
                  console.log("User continues playing, score:",scoreData.totalScore);
                  setShowDialogBox(false);
                  saveLikedStatus(scoreData);
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
              />
            ) : null}
          </IonContent>
        </div>
      ) : (
        <div className="live-quiz-container">
          <div className="live-quiz-top-div">
            {roomDoc && (
              <LiveQuizHeader
                roomDoc={roomDoc}
                currentQuestionIndex={currentQuestionIndex}
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
                lessonId={paramLessonId ?? undefined}
                isTimeOut={isTimeOut}
                onNewQuestionChange={(newQuestionIndex) => {
                  console.log(
                    "🚀 ~ file: LiveQuizGame.tsx:235 ~ newQuestionIndex:",
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
                  console.log("🚀 ~ file: LiveQuizGame.tsx:246 ~ onQuizEnd:");
                  history.replace(
                    PAGES.LIVE_QUIZ_ROOM_RESULT +
                      "?liveRoomId=" +
                      paramLiveRoomId
                  );
                }}
              />
            )}
          </div>
        </div>
      )}
    </IonPage>
  );
};

export default LiveQuizGame;
