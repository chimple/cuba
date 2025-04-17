import { IonContent, IonPage } from "@ionic/react";
import { FC, useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory } from "react-router";
import { LESSONS_PLAYED_COUNT, PAGES, TableTypes } from "../common/constants";
import "./LiveQuizGame.css";
import LiveQuizCountdownTimer from "../components/liveQuiz/LiveQuizCountdownTimer";
import LiveQuizQuestion from "../components/liveQuiz/LiveQuizQuestion";
import LiveQuiz from "../models/liveQuiz";
import LiveQuizHeader from "../components/liveQuiz/LiveQuizHeader";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import ScoreCard from "../components/parent/ScoreCard";
import { Util } from "../utility/util";
import { t } from "i18next";
import { Capacitor } from "@capacitor/core";

const LiveQuizGame: FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get("liveRoomId");
  const [roomDoc, setRoomDoc] = useState<TableTypes<"live_quiz_room">>();
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>();
  const [remainingTime, setRemainingTime] = useState<number>();
  const [showAnswer, setShowAnswer] = useState(false);
  const [lesson, setLesson] = useState<TableTypes<"lesson">>();
  const { presentToast } = useOnlineOfflineErrorMessageHandler();
  const paramLessonId = urlSearchParams.get("lessonId");
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [showScoreCard, setShowScoreCard] = useState<boolean>(false);
  const state = history.location.state as any;
  const [quizData, setQuizData] = useState<any>();
  const [scoreData, setScoreData] = useState<any>();
  let initialCount = Number(localStorage.getItem(LESSONS_PLAYED_COUNT)) || 0;

  useEffect(() => {
    if (!paramLiveRoomId && !paramLessonId) {
      history.replace(PAGES.HOME);
      return;
    }
    if (paramLiveRoomId) {
      api.liveQuizListener(paramLiveRoomId, handleRoomChange);
      return () => {
        api.removeLiveQuizChannel();
      };
    }
  }, []);

  useEffect(() => {
    const courseId = state?.courseId;
    const lessonData = state?.lesson ? JSON.parse(state.lesson) : undefined;
    setLesson(lessonData);

    if (lessonData && courseId) {
      const quizData = {
        lessonid: lessonData.id,
        chapterId: lessonData.chapter_id,
        courseId: courseId,
      };
      setQuizData(quizData);
    }
  }, [paramLessonId]);

  const handleRoomChange = async (
    roomDoc: TableTypes<"live_quiz_room"> | undefined
  ) => {
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
    } else {
      setRoomDoc(roomDoc);
      if (roomDoc?.lesson_id) {
        getLesson(roomDoc.lesson_id);
      }
    }
  };
  const getLesson = async (lessonId: string) => {
    const lessonDoc = await api.getLesson(lessonId);
    if (lessonDoc) setLesson(lessonDoc);
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

  const saveLikedStatus = async () => {
    const api = ServiceConfig.getI().apiHandler;
    const currentStudent = api.currentStudent!;
    await api.updateFavoriteLesson(currentStudent.id, lesson?.id ?? "");
  };

  return (
    <IonPage>
      {paramLessonId ? (
        <div className="live-quiz-container">
          <div className="live-quiz-center-div">
            {paramLessonId && quizData && (
              <LiveQuizQuestion
                lessonId={paramLessonId}
                quizData={quizData}
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
                  console.log("✅ Updating Total Score:", scoreData);
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
                score={scoreData ?? 0}
                message={t("You Completed the Lesson:")}
                showDialogBox={showDialogBox}
                yesText={t("Like the Game")}
                lessonName={lesson?.name ?? ""}
                noText={t("Continue Playing")}
                handleClose={() => setShowDialogBox(true)}
                onYesButtonClicked={() => {
                  console.log("User liked the game, score.", scoreData);
                  setShowDialogBox(false);
                  saveLikedStatus();
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
                  console.log("User continues playing, score:", scoreData);
                  setShowDialogBox(false);
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
                startsAt={new Date(roomDoc.starts_at)}
                onTimeOut={() => {
                  setIsTimeOut(true);
                }}
              />
            )}
            {roomDoc && lesson && (
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
                cocosLessonId={lesson?.cocos_lesson_id}
                onQuizEnd={() => {
                  console.log("🚀 ~ file: LiveQuizGame.tsx:65 ~ onQuizEnd:");
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
