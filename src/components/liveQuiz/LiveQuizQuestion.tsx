import { FC, useEffect, useState } from "react";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import LiveQuiz, {
  LIVE_QUIZ_QUESTION_TIME,
  LiveQuizOption,
  LiveQuizQuestion as LiveQuizQuestionType,
} from "../../models/liveQuiz";
import "./LiveQuizQuestion.css";
import { Capacitor } from "@capacitor/core";
import { Util } from "../../utility/util";
import { PAGES } from "../../common/constants";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PiSpeakerHighBold } from "react-icons/pi";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

let questionInterval;
let audiosMap: { [key: string]: HTMLAudioElement } = {};
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
    audiosMap = {};
    getConfigJson();
    return () => {
      stopAllAudios();
    };
  }, []);

  useEffect(() => {
    onQuestionChange();
  }, [currentQuestionIndex]);

  useEffect(() => {
    handleRoomChange();
  }, [roomDoc]);

  useEffect(() => {
    if (showQuiz && currentQuestionIndex === undefined && liveQuizConfig) {
      changeQuestion(liveQuizConfig, true);
    }
  }, [showQuiz]);

  const getConfigJson = async () => {
    if (liveQuizConfig) return liveQuizConfig;
    if (!Capacitor.isNativePlatform()) {
      //TODO remove FOR testing
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
              text: "Click on audio button to hear the question",
              audio:
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            },
            questionType: "audio",
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
              image:
                "https://fastly.picsum.photos/id/1012/3973/2639.jpg?hmac=s2eybz51lnKy2ZHkE2wsgc6S81fVD1W2NKYOSh8bzDc",
            },
            questionType: "image",
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
              image: "https://picsum.photos/200/300",
            },
            questionType: "image",
          },
          {
            options: [
              {
                image: "https://picsum.photos/200/300",
              },
              {
                isCorrect: true,
                image: "https://picsum.photos/200/300",
              },
              {
                image: "https://picsum.photos/200/300",
              },
              {
                image: "https://picsum.photos/200/300",
              },
            ],
            optionsType: "image",
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
      preLoadAudiosWithLiveQuizConfig(config);
      setLiveQuizConfig(config);
      if (onConfigLoaded) onConfigLoaded(config);
      if (currentQuestionIndex == undefined && showQuiz)
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
    await stopAllAudios();
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
      const newQuestionIndex =
        _currentQuestionIndex == null ? 0 : _currentQuestionIndex + 1;
      const newQuestion = tempLiveQuizConfig.data[newQuestionIndex]?.question;
      if (newQuestion?.audio) {
        playLiveQuizAudio(newQuestion);
      }
      return newQuestionIndex;
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

  const playLiveQuizAudio = async (
    data: LiveQuizOption | LiveQuizQuestionType
  ) => {
    try {
      await stopAllAudios();
      if (data.audio) {
        if (audiosMap[data.audio]) {
          await audiosMap[data.audio].play();
        } else {
          const audio = preLoadAudio(data.audio);
          await audio.play();
        }
        audiosMap[data.audio].play();
      } else if (data.text) {
        await TextToSpeech.speak({
          text: data.text,
        });
      }
    } catch (error) {
      console.log("🚀 ~ file: LiveQuizQuestion.tsx:348 ~ error:", error);
    }
  };

  const preLoadAudiosWithLiveQuizConfig = async (_liveQuizConfig: LiveQuiz) => {
    for (let question of _liveQuizConfig.data) {
      if (question.question.audio) {
        preLoadAudio(question.question.audio);
        question.options.forEach((option) => {
          if (option.audio) {
            preLoadAudio(option.audio);
          }
        });
      }
    }
  };

  const preLoadAudio = (url: string): HTMLAudioElement => {
    let newUrl = url;
    if (Capacitor.isNativePlatform()) {
      newUrl = quizPath + "/" + url;
    }
    const audio = new Audio(newUrl);
    audio.preload = "auto";
    audio.load();
    audiosMap[url] = audio;
    return audio;
  };

  const stopAllAudios = async () => {
    try {
      await TextToSpeech.stop();
    } catch (error) {
      console.log(
        "🚀 ~ file: LiveQuizQuestion.tsx:384 ~ stopAllAudios ~ error:",
        error
      );
    }
    if (!audiosMap) return;
    try {
      Object.values(audiosMap)?.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    } catch (error) {
      console.log(
        "🚀 ~ file: LiveQuizQuestion.tsx:393 ~ stopAllAudios ~ error:",
        error
      );
    }
  };

  return (
    <div>
      {showQuiz && liveQuizConfig && currentQuestionIndex != null && (
        <div>
          <p>{remainingTime}</p>

          <div className="live-quiz-question">
            <div className="live-quiz-question-box">
              {(liveQuizConfig.data[currentQuestionIndex].question.audio ||
                liveQuizConfig.data[currentQuestionIndex].question.text) && (
                <div className="live-quiz-audio-button-question">
                  <PiSpeakerHighBold
                    onClick={(e) => {
                      e.stopPropagation();
                      playLiveQuizAudio(
                        liveQuizConfig.data[currentQuestionIndex].question
                      );
                      console.log("on audio question click");
                    }}
                  />
                </div>
              )}
              <p>
                {!liveQuizConfig.data[currentQuestionIndex]?.question
                  .isTextTTS &&
                  liveQuizConfig.data[currentQuestionIndex]?.question.text}
              </p>
              {liveQuizConfig.data[currentQuestionIndex]?.question.image && (
                <img
                  className="live-quiz-question-image"
                  src={
                    Capacitor.isNativePlatform()
                      ? quizPath +
                        "/" +
                        liveQuizConfig.data[currentQuestionIndex]?.question
                          .image
                      : liveQuizConfig.data[currentQuestionIndex]?.question
                          .image
                  }
                  alt=""
                />
              )}
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
                      setCanAnswer(false);
                      setSelectedAnswerIndex(index);
                      const score = calculateScoreForQuestion(
                        option.isCorrect === true,
                        liveQuizConfig.data.length,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime
                      );
                      await api.updateLiveQuiz(
                        roomDoc.docId,
                        student?.docId!,
                        liveQuizConfig.data[currentQuestionIndex].question.id,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime,
                        score
                      );
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
                    {(option.audio || option.text) && (
                      <div className="live-quiz-audio-button-option">
                        <PiSpeakerHighBold
                          onClick={(e) => {
                            e.stopPropagation();
                            playLiveQuizAudio(option);
                            console.log("on audio click");
                          }}
                        />
                      </div>
                    )}

                    {!option.isTextTTS && !option.image && option.text}
                    {option.image && (
                      <img
                        className="live-quiz-option-image"
                        src={
                          Capacitor.isNativePlatform()
                            ? quizPath + "/" + option.image
                            : option.image
                        }
                        alt=""
                      />
                    )}
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
