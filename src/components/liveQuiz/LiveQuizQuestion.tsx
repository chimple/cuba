import { FC, useEffect, useState } from "react";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import LiveQuiz, { LIVE_QUIZ_QUESTION_TIME } from "../../models/liveQuiz";
import "./LiveQuizQuestion.css";
import { Capacitor } from "@capacitor/core";
import { Util } from "../../utility/util";
import { PAGES } from "../../common/constants";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";

let questionInterval;
const LiveQuizQuestion: FC<{
  roomDoc: LiveQuizRoomObject;
  showQuiz: boolean;
  onNewQuestionChange?: (newQuestionIndex: number) => void;
  onQuizEnd?: Function;
  onConfigLoaded?: (liveQuizConfig: LiveQuiz) => void;
}> = ({
  roomDoc,
  onNewQuestionChange,
  onQuizEnd,
  onConfigLoaded,
  showQuiz,
}) => {
  const quizPath =
    (localStorage.getItem("gameUrl") ??
      "http://localhost/_capacitor_file_/storage/emulated/0/Android/data/org.chimple.bahama/files/") +
    roomDoc.lesson.id;
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>();
  const [remainingTime, setRemainingTime] = useState(LIVE_QUIZ_QUESTION_TIME);
  const [canAnswer, setCanAnswer] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number>();

  const history = useHistory();
  const student = Util.getCurrentStudent();
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    if (!roomDoc) return;
    if (!student) {
      history.replace(PAGES.HOME);
      return;
    }

    getConfigJson();
  }, []);
  useEffect(() => {
    onQuestionChange();
  }, [currentQuestionIndex]);

  useEffect(() => {
    handleRoomChange();
  }, [roomDoc]);

  const getConfigJson = async () => {
    if (liveQuizConfig) return liveQuizConfig;
    if (!Capacitor.isNativePlatform()) {
      const config = {
        data: [
          {
            options: [
              {
                text: "4",
                isCorrect: true,
              },
              {
                text: "1",
              },
              {
                text: "2",
              },
              {
                text: "3",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_1",
              text: "What is 2+2?",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "1",
              },
              {
                isCorrect: true,
                text: "2",
              },
              {
                text: "4",
              },
              {
                text: "2",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_2",
              text: "What is 1+1?",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "Paris",
                isCorrect: true,
              },
              {
                text: "Berlin",
              },
              {
                text: "London",
              },
              {
                text: "Rome",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_3",
              text: "What is the capital of France?",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "3",
              },
              {
                isCorrect: true,
                text: "6",
              },
              {
                text: "9",
              },
              {
                text: "12",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_4",
              text: "What is 2 multiplied by 3?",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "Earth",
                isCorrect: true,
              },
              {
                text: "Mars",
              },
              {
                text: "Jupiter",
              },
              {
                text: "Saturn",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_5",
              text: "Which planet do we live on?",
            },
            questionType: "text",
          },
        ],
        type: "multiOptions",
      } as LiveQuiz;
      setLiveQuizConfig(config);
      if (onConfigLoaded) onConfigLoaded(config);
      changeQuestion(config, true);
      return config;
    }
    const response = await fetch(quizPath + "/config.json");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch config file. Status: ${response.status}`
      );
    }
    const configFile: LiveQuiz = (await response.json()) as LiveQuiz;
    console.log(
      "🚀 ~ file: LiveQuizQuestion.tsx:24 ~ getConfigJson ~ jsonData:",
      configFile
    );
    setLiveQuizConfig(configFile);
    if (onConfigLoaded) onConfigLoaded(configFile);
    return configFile;
  };

  const handleRoomChange = () => {
    if (!roomDoc || currentQuestionIndex === undefined) return;
    const results = roomDoc.results;
    if (!results) return;
    const participantsPlayedCount = Object.values(results).reduce(
      (accumulator, liveQuizResult) => {
        const lastQuestionId = liveQuizResult[liveQuizResult.length - 1].id;
        if (
          lastQuestionId ===
          liveQuizConfig?.data[currentQuestionIndex].question.id
        ) {
          return accumulator + 1;
        }
        return accumulator;
      },
      0
    );
    if (participantsPlayedCount === roomDoc.participants.length) {
      clearInterval(questionInterval);
      // setTimeout(() => {
      changeQuestion();
      // }, 1000);
    }
  };

  const onTimeOut = (_liveQuizConfig?: LiveQuiz) => {
    console.log("🚀 ~ file: LiveQuizQuestion.tsx:168 ~ onTimeOut ~ onTimeOut:");
    changeQuestion(_liveQuizConfig);
  };

  const changeQuestion = async (
    _liveQuizConfig?: LiveQuiz,
    isStart: boolean = false
  ) => {
    const tempLiveQuizConfig = _liveQuizConfig || liveQuizConfig;
    if (!tempLiveQuizConfig) return;
    if (!isStart) {
      setShowAnswer(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setCurrentQuestionIndex((_currentQuestionIndex) => {
      console.log(
        "🚀 ~ file: LiveQuizQuestion.tsx:177 ~ changeQuestion ~ _currentQuestionIndex:",
        _currentQuestionIndex
      );
      if (_currentQuestionIndex === tempLiveQuizConfig.data.length - 1) {
        if (onQuizEnd) {
          onQuizEnd();
          updateResult();
        }
        return _currentQuestionIndex;
      }
      return _currentQuestionIndex == null ? 0 : _currentQuestionIndex + 1;
    });
  };

  const onQuestionChange = () => {
    if (currentQuestionIndex == null) return;
    if (onNewQuestionChange) onNewQuestionChange(currentQuestionIndex);
    setCanAnswer(true);
    setShowAnswer(false);
    setSelectedAnswerIndex(undefined);
    setRemainingTime(LIVE_QUIZ_QUESTION_TIME);
    console.log(
      "🚀 ~ file: LiveQuizQuestion.tsx:203 ~ onQuestionChange ~ questionInterval:",
      questionInterval
    );
    if (questionInterval) clearInterval(questionInterval);
    questionInterval = setInterval(() => {
      setRemainingTime((remainingTime) => {
        if (remainingTime === 0) {
          clearInterval(questionInterval);
          onTimeOut();
        }
        return remainingTime - 1;
      });
    }, 1000);
  };

  function calculateScoreForQuestion(
    correct: boolean,
    totalQuestions: number,
    timeSpent: number
  ): number {
    if (!correct) return 0;
    const maxTotalScore = 100;
    const maxScoreForQuestion = maxTotalScore / totalQuestions;
    const baseScoreForQuestion = maxScoreForQuestion / 2;
    const timeScore = Math.max(
      0,
      maxScoreForQuestion / 2 -
        (maxScoreForQuestion / 2) * (timeSpent / LIVE_QUIZ_QUESTION_TIME)
    );
    const totalScoreForQuestion = baseScoreForQuestion + timeScore;
    return totalScoreForQuestion;
  }

  async function updateResult() {
    let totalScore = 0;
    let totalTimeSpent = 0;
    const totalQuestions = liveQuizConfig?.data.length || 0;
    let correctMoves = 0;
    if (!roomDoc.results) return;
    for (let result of roomDoc.results[student!.docId]) {
      totalScore += result.score || 0;
      totalTimeSpent += result.timeSpent || 0;
      if (result.score > 0) {
        correctMoves++;
      }
    }
    await api.updateResult(
      student!,
      roomDoc.course.id,
      roomDoc.lesson.id,
      totalScore,
      correctMoves,
      totalQuestions - correctMoves,
      totalTimeSpent,
      undefined,
      roomDoc.assignment.id,
      roomDoc.class.id,
      roomDoc.school.id
    );
  }

  return (
    <div>
      {showQuiz && liveQuizConfig && currentQuestionIndex != null && (
        <div>
          <p>{remainingTime}</p>
          <div className="live-quiz-question">
            <div className="live-quiz-question-box">
              {liveQuizConfig.data[currentQuestionIndex]?.question.text}
            </div>
          </div>
          <div className="live-quiz-options">
            {liveQuizConfig.data[currentQuestionIndex]?.options.map(
              (option, index) => {
                return (
                  <div
                    key={index}
                    aria-disabled={!canAnswer}
                    onClick={async () => {
                      if (!canAnswer) return;
                      // clearInterval(questionInterval);
                      setCanAnswer(false);
                      setSelectedAnswerIndex(index);
                      const score = calculateScoreForQuestion(
                        option.isCorrect === true,
                        liveQuizConfig.data.length,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime
                      );

                      console.log(
                        "🚀 ~ file: LiveQuizQuestion.tsx:284 ~ onClick={ ~ FirebaseApi:",
                        roomDoc.docId,
                        student?.docId!,
                        liveQuizConfig.data[currentQuestionIndex].question.id,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime,
                        score
                      );
                      await api.updateLiveQuiz(
                        roomDoc.docId,
                        student?.docId!,
                        liveQuizConfig.data[currentQuestionIndex].question.id,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime,
                        score
                      );
                      console.log(
                        "🚀 ~ file: LiveQuizQuestion.tsx:284 ~ onClick={ ~ FirebaseApi:",
                        roomDoc.docId,
                        student?.docId!,
                        liveQuizConfig.data[currentQuestionIndex].question.id,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime,
                        score
                      );

                      // setTimeout(() => {
                      //   changeQuestion();
                      // }, 2000);
                    }}
                    className={
                      "live-quiz-option-box " +
                      (showAnswer
                        ? option.isCorrect
                          ? "live-quiz-option-box-correct"
                          : selectedAnswerIndex === index
                          ? "live-quiz-option-box-incorrect"
                          : ""
                        : "")
                    }
                  >
                    {option.text}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveQuizQuestion;
