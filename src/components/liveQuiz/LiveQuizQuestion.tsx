import { FC, useEffect, useState } from "react";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import LiveQuiz, {
  LIVE_QUIZ_QUESTION_TIME,
  LiveQuizData,
} from "../../models/liveQuiz";
import "./LiveQuizQuestion.css";
import { Capacitor } from "@capacitor/core";

let questionInterval;
const LiveQuizQuestion: FC<{
  roomDoc: LiveQuizRoomObject;
  onNewQuestionChange?: (newQuestionIndex: number) => void;
  onQuizEnd?: Function;
  onConfigLoaded?: (liveQuizConfig: LiveQuiz) => void;
}> = ({ roomDoc, onNewQuestionChange, onQuizEnd, onConfigLoaded }) => {
  const quizPath =
    (localStorage.getItem("gameUrl") ??
      "http://localhost/_capacitor_file_/storage/emulated/0/Android/data/org.chimple.bahama/files/") +
    roomDoc.lesson.id;
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>();
  const [remainingTime, setRemainingTime] = useState(LIVE_QUIZ_QUESTION_TIME);
  const [canAnswer, setCanAnswer] = useState(true);

  useEffect(() => {
    if (!roomDoc) return;
    getConfigJson();
  }, []);
  useEffect(() => {
    onQuestionChange();
  }, [currentQuestionIndex]);
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
      changeQuestion(config);
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

  const onTimeOut = (_liveQuizConfig?: LiveQuiz) => {
    console.log("🚀 ~ file: LiveQuizQuestion.tsx:168 ~ onTimeOut ~ onTimeOut:");
    changeQuestion(_liveQuizConfig);
  };
  const changeQuestion = (_liveQuizConfig?: LiveQuiz) => {
    const tempLiveQuizConfig = _liveQuizConfig || liveQuizConfig;
    if (!tempLiveQuizConfig) return;
    setCurrentQuestionIndex((_currentQuestionIndex) => {
      console.log(
        "🚀 ~ file: LiveQuizQuestion.tsx:177 ~ changeQuestion ~ _currentQuestionIndex:",
        _currentQuestionIndex
      );
      if (_currentQuestionIndex === tempLiveQuizConfig.data.length - 1) {
        if (onQuizEnd) onQuizEnd();
        return _currentQuestionIndex;
      }
      return _currentQuestionIndex == null ? 0 : _currentQuestionIndex + 1;
    });
  };

  console.log(
    "🚀 ~ file: LiveQuizQuestion.tsx:196 ~ questionInterval:",
    questionInterval
  );
  const onQuestionChange = () => {
    if (currentQuestionIndex == null) return;
    if (onNewQuestionChange) onNewQuestionChange(currentQuestionIndex);
    setCanAnswer(true);
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

  return (
    <div>
      {liveQuizConfig && currentQuestionIndex != null && (
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
                    onClick={() => {
                      console.log(
                        "🚀 ~ file: LiveQuizQuestion.tsx:246 ~ onClick:",
                        canAnswer
                      );
                      if (!canAnswer) return;
                      clearInterval(questionInterval);
                      console.log(
                        "🚀 ~ file: LiveQuizQuestion.tsx:252 ~ option.isCorrect:",
                        option.isCorrect
                      );

                      if (option.isCorrect) {
                        const score = calculateScoreForQuestion(
                          true,
                          liveQuizConfig.data.length,
                          LIVE_QUIZ_QUESTION_TIME - remainingTime
                        );
                        console.log(
                          "🚀 ~ file: LiveQuizQuestion.tsx:249 ~ score:",
                          score
                        );
                      } else {
                        const score = calculateScoreForQuestion(
                          false,
                          liveQuizConfig.data.length,
                          LIVE_QUIZ_QUESTION_TIME - remainingTime
                        );
                        console.log(
                          "🚀 ~ file: LiveQuizQuestion.tsx:252 ~ score:",
                          score
                        );
                      }
                      setCanAnswer(false);
                      setTimeout(() => {
                        changeQuestion();
                      }, 2000);
                    }}
                    className="live-quiz-option-box"
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
