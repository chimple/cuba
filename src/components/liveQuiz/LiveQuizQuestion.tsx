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
import { PAGES, TableTypes } from "../../common/constants";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";
import { HiSpeakerWave } from "react-icons/hi2";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import LiveQuizNavigationDots from "./LiveQuizNavigationDots";

let questionInterval;
let audiosMap: { [key: string]: HTMLAudioElement } = {};
const LiveQuizQuestion: FC<{
  roomDoc: TableTypes<"live_quiz_room">;
  showQuiz: boolean;
  isTimeOut: boolean;
  cocosLessonId: string | null;
  onNewQuestionChange?: (newQuestionIndex: number) => void;
  onQuizEnd?: Function;
  onConfigLoaded?: (liveQuizConfig: LiveQuiz) => void;
  onRemainingTimeChange?: (remainingTime: number) => void;
  onShowAnswer?: (canShow: boolean) => void;
}> = ({
  roomDoc,
  onNewQuestionChange,
  onQuizEnd,
  cocosLessonId,
  onConfigLoaded,
  showQuiz,
  onRemainingTimeChange,
  onShowAnswer,
  isTimeOut,
}) => {
  const quizPath =
    (localStorage.getItem("gameUrl") ??
      "http://localhost/_capacitor_file_/storage/emulated/0/Android/data/org.chimple.bahama/files/") +
    cocosLessonId;
  const [liveQuizConfig, setLiveQuizConfig] = useState<LiveQuiz>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>();
  const [remainingTime, setRemainingTime] = useState(LIVE_QUIZ_QUESTION_TIME);
  const [canAnswer, setCanAnswer] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number>();
  const [audio, setAudio] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
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

  useEffect(() => {
    if (liveQuizConfig) {
      const correctAnswersList = liveQuizConfig.data.map((question) =>
        question.options.findIndex((option) => option.isCorrect)
      );
      console.log("correctAnswersList.......", correctAnswersList);
      setCorrectAnswers(correctAnswersList);
    }
  }, [liveQuizConfig]);

  const handleOptionClick = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prevSelectedAnswers) => {
      const updatedSelectedAnswers = [...prevSelectedAnswers];
      updatedSelectedAnswers[questionIndex] = optionIndex;
      return updatedSelectedAnswers;
    });
  };

  const getConfigJson = async () => {
    if (liveQuizConfig) return liveQuizConfig;
    if (!Capacitor.isNativePlatform()) {
      //TODO remove FOR testing
      const config = {
        data: [
          {
            options: [
              {
                text: "Lion",
                isCorrect: true,
              },
              {
                text: "Tiger",
              },
              {
                text: "Elephant",
              },
              {
                text: "Giraffe",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_1",
              text: "Which animal is known as the king of the jungle?",
              // audio:
              //   "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            },
            questionType: "audio",
          },
          {
            options: [
              {
                text: "Blue",
              },
              {
                text: "Orange",
              },
              {
                text: "red",
                isCorrect: true,
              },
              {
                text: "Pink",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_2",
              text: " What is the colour of an apple?",
              // image:
              // "https://fastly.picsum.photos/id/1012/3973/2639.jpg?hmac=s2eybz51lnKy2ZHkE2wsgc6S81fVD1W2NKYOSh8bzDc",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "7",
                isCorrect: true,
              },
              {
                text: "8",
              },
              {
                text: "5",
              },
              {
                text: "6",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_3",
              text: "How many days are there in a week?",
              // image: "https://picsum.photos/200/300",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "X",
              },
              {
                text: "T",
              },
              {
                text: "K",
                isCorrect: true,
              },
              {
                text: "P",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_4",
              text: "Fill in the blanks? H, I, J, _,L, M, N",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "E,K,S,T,P",
              },
              {
                text: "A,E,I,O,U",
                isCorrect: true,
              },
              {
                text: "A,O,T,S,Y",
              },
              {
                text: "O,I,V,Z,E",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_5",
              text: "Which are vowels?",
            },
            questionType: "text",
          },
          {
            options: [
              {
                text: "Kitten",
                isCorrect: true,
              },
              {
                text: "Puppy",
              },
              {
                text: "Cub",
              },
              {
                text: "Joey",
              },
            ],
            optionsType: "text",
            question: {
              id: "question_6",
              text: "A baby cat is called _",
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
        const lastQuestionId =
          liveQuizResult[liveQuizResult.length - 1].question_id;
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
    if (roomDoc.participants) {
      if (participantsPlayedCount === roomDoc.participants.length) {
        clearInterval(questionInterval);
        // setTimeout(() => {
        changeQuestion();
        // }, 1000);
      }
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
      if (onShowAnswer) onShowAnswer(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    setCurrentQuestionIndex((_currentQuestionIndex) => {
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
    if (onShowAnswer) onShowAnswer(false);
    setSelectedAnswerIndex(undefined);
    setRemainingTime(LIVE_QUIZ_QUESTION_TIME);
    if (onRemainingTimeChange) onRemainingTimeChange(LIVE_QUIZ_QUESTION_TIME);
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
        const newTime = remainingTime - 1;
        if (onRemainingTimeChange) onRemainingTimeChange(newTime);
        return newTime;
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
    for (let result of roomDoc.results[student!.id]) {
      console.log("inside for...", roomDoc.results[student!.id]);

      totalScore += result.score || 0;
      totalTimeSpent += result.timeSpent || 0;
      if (result.score > 0) {
        correctMoves++;
      }
    }
    var _assignment = await api.getAssignmentById(roomDoc.assignment_id);
    await api.updateResult(
      student!.id,
      roomDoc.course_id,
      roomDoc.lesson_id,
      Math.round(totalScore),
      correctMoves,
      totalQuestions - correctMoves,
      totalTimeSpent,
      roomDoc.assignment_id,
      _assignment?.chapter_id ?? "",
      roomDoc.class_id,
      roomDoc.school_id
    );
  }

  const playLiveQuizAudio = async (
    data: LiveQuizOption | LiveQuizQuestionType
  ) => {
    try {
      setAudio(true);
      await stopAllAudios();
      if (data.audio) {
        if (audiosMap[data.audio]) {
          await audiosMap[data.audio].play();
        } else {
          const audio = preLoadAudio(data.audio);
          await audio.play();
        }
        audiosMap[data.audio].play();
        setAudio(false);
      } else if (data.text) {
        setAudio(true);
        await TextToSpeech.speak({
          text: data.text,
        });
        setAudio(false);
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
            setAudio(true);
            preLoadAudio(option.audio);
            setAudio(false);
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
      <div className="live-quiz-navigation-dots">
        {isTimeOut && liveQuizConfig && currentQuestionIndex != null && (
          <LiveQuizNavigationDots
            totalDots={liveQuizConfig.data.length}
            currentDot={currentQuestionIndex}
            correctAnswers={correctAnswers}
            selectedAnswers={selectedAnswers}
          />
        )}
      </div>
      {showQuiz && liveQuizConfig && currentQuestionIndex != null && (
        <div>
          <div className="live-quiz-question">
            <div className="live-quiz-question-box">
              {(liveQuizConfig.data[currentQuestionIndex].question.audio ||
                liveQuizConfig.data[currentQuestionIndex].question.text) && (
                <div className="live-quiz-audio-button-question">
                  <HiSpeakerWave
                    onClick={(e) => {
                      e.stopPropagation();
                      playLiveQuizAudio(
                        liveQuizConfig.data[currentQuestionIndex].question
                      );
                      console.log("on audio question click");
                    }}
                    className={audio ? "audio-playing" : ""}
                  />
                </div>
              )}
              <p id="question-text">
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
                      handleOptionClick(currentQuestionIndex, index);
                      const score = calculateScoreForQuestion(
                        option.isCorrect === true,
                        liveQuizConfig.data.length,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime
                      );
                      await api.updateLiveQuiz(
                        roomDoc.id,
                        student?.id!,
                        liveQuizConfig.data[currentQuestionIndex].question.id,
                        LIVE_QUIZ_QUESTION_TIME - remainingTime,
                        score
                      );
                    }}
                    className={
                      "live-quiz-option-box " +
                      (selectedAnswerIndex === index && !showAnswer
                        ? "selected-option "
                        : "") +
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
                      <div
                        className={
                          "live-quiz-audio-button-option " +
                          (selectedAnswerIndex === index && !showAnswer
                            ? "selected--option-audio-button"
                            : "")
                        }
                      >
                        <HiSpeakerWave
                          onClick={(e) => {
                            e.stopPropagation();
                            playLiveQuizAudio(option);
                            console.log("on audio click");
                          }}
                          className={audio ? "audio-playing" : ""}
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
