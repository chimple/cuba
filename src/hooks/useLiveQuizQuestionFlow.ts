import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { useHistory } from 'react-router';
import {
  BUNDLE_ZIP_URLS,
  GAME_URL,
  PAGES,
  REWARD_LESSON,
  SOURCE,
  TableTypes,
} from '../common/constants';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import LiveQuiz, {
  LIVE_QUIZ_QUESTION_TIME,
  LiveQuizOption,
  LiveQuizQuestion as LiveQuizQuestionType,
} from '../models/LiveQuiz';
import { ServiceConfig } from '../services/ServiceConfig';
import { getBundleZipUrlsForEnv } from '../services/RemoteConfig';
import logger from '../utility/logger';
import { schoolUtil } from '../utility/schoolUtil';
import { Util } from '../utility/util';
import {
  calculateScoreForQuestion,
  DEFAULT_LIVE_QUIZ_CONFIG,
} from '../components/liveQuiz/liveQuizQuestionConfig';

let questionInterval: ReturnType<typeof setInterval> | undefined;
let audiosMap: { [key: string]: HTMLAudioElement } = {};
let totalLessonScore = 0;
let totalLessonTimeSpent = 0;
let lessonCorrectMoves = 0;

export type LiveQuizQuestionProps = {
  roomDoc?: TableTypes<'live_quiz_room'>;
  showQuiz: boolean;
  isTimeOut: boolean;
  cocosLessonId?: string | null;
  onNewQuestionChange?: (newQuestionIndex: number) => void;
  onQuizEnd?: Function;
  onConfigLoaded?: (liveQuizConfig: LiveQuiz) => void;
  onRemainingTimeChange?: (remainingTime: number) => void;
  onShowAnswer?: (canShow: boolean) => void;
  lessonId?: string;
  lesson?: TableTypes<'lesson'>;
  quizData?: any;
  onTotalScoreChange?: (totalScore: number) => void;
  isLearningPathway?: boolean;
  isReward?: boolean;
  source?: SOURCE;
};

export function useLiveQuizQuestionFlow({
  roomDoc,
  onNewQuestionChange,
  onQuizEnd,
  cocosLessonId,
  onConfigLoaded,
  showQuiz,
  onRemainingTimeChange,
  onShowAnswer,
  lessonId,
  lesson,
  quizData,
  onTotalScoreChange,
  isLearningPathway,
  isReward = false,
  source = SOURCE.SUBJECT_PAGE,
}: LiveQuizQuestionProps) {
  const quizPathBase =
    localStorage.getItem(GAME_URL) ??
    'http://localhost/_capacitor_file_/storage/emulated/0/Android/data/org.chimple.bahama/files/';

  const quizPath =
    lessonId || cocosLessonId
      ? quizPathBase + (lessonId || cocosLessonId)
      : quizPathBase;
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
    if (!roomDoc && !lessonId) return;
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
    if (Capacitor.isNativePlatform() && showQuiz) {
      const fetchData = async () => {
        const config = await getConfigJson();
        if (showQuiz && currentQuestionIndex === undefined && config) {
          changeQuestion(config, true);
        }
      };
      fetchData();
    } else {
      if (showQuiz && currentQuestionIndex === undefined && liveQuizConfig) {
        changeQuestion(liveQuizConfig, true);
      }
    }
  }, [showQuiz]);

  useEffect(() => {
    if (liveQuizConfig) {
      const correctAnswersList = liveQuizConfig.data.map((question) =>
        question.options.findIndex((option) => option.isCorrect),
      );
      setCorrectAnswers(correctAnswersList);
    }
  }, [liveQuizConfig]);

  const handleOptionClick = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prevSelectedAnswers) => {
      const updatedSelectedAnswers = [...prevSelectedAnswers];
      updatedSelectedAnswers[questionIndex] = optionIndex;
      return updatedSelectedAnswers;
    });
    if (lessonId) {
      const isCorrect = correctAnswers[questionIndex] === optionIndex;
      if (isCorrect) {
        totalLessonScore += calculateScoreForQuestion(
          true,
          liveQuizConfig?.data.length || 0,
          LIVE_QUIZ_QUESTION_TIME - remainingTime,
        );
        lessonCorrectMoves++;
      }
      clearInterval(questionInterval);
      changeQuestion();
    }
  };

  const downloadQuiz = async (lessonToDownload: TableTypes<'lesson'>) => {
    const dow = await Util.downloadZipBundle([lessonToDownload]);
    return dow;
  };

  const readLocalConfig = async (
    path: string,
  ): Promise<LiveQuiz | undefined> => {
    try {
      const file = await Filesystem.readFile({
        path,
        directory: Directory.External,
        encoding: Encoding.UTF8,
      });

      return JSON.parse(file.data as string) as LiveQuiz;
    } catch (err) {
      return undefined;
    }
  };

  const getConfigJson = async () => {
    if (liveQuizConfig) return liveQuizConfig;
    const lessonKey = lessonId || cocosLessonId;
    if (lessonKey) {
      const cachedConfig = localStorage.getItem(
        `live_quiz_config_${lessonKey}`,
      );
      if (cachedConfig) {
        const config = JSON.parse(cachedConfig) as LiveQuiz;
        setLiveQuizConfig(config);
        if (onConfigLoaded) onConfigLoaded(config);
        preLoadAudiosWithLiveQuizConfig(config);
        return config;
      }
    }
    if (!Capacitor.isNativePlatform()) {
      const config = DEFAULT_LIVE_QUIZ_CONFIG;
      preLoadAudiosWithLiveQuizConfig(config);
      setLiveQuizConfig(config);
      if (onConfigLoaded) onConfigLoaded(config);
      if (currentQuestionIndex == undefined && showQuiz)
        changeQuestion(config, true);

      return config;
    }

    let configFile: LiveQuiz | undefined;

    const remoteUrls = getCachedGrowthBookFeatureValue<string[]>(
      BUNDLE_ZIP_URLS,
      getBundleZipUrlsForEnv(),
    );

    for (const baseUrl of remoteUrls) {
      try {
        const response = await fetch(
          baseUrl + (lessonId || cocosLessonId) + '/config.json',
        );
        if (response.ok) {
          configFile = (await response.json()) as LiveQuiz;
          break;
        }
      } catch {
        logger.warn('Failed to fetch from remote:', baseUrl);
      }
    }

    if (!configFile) {
      const configPath = (lessonId || cocosLessonId) + '/config.json';

      configFile = await readLocalConfig(configPath);

      if (!configFile && lessonId && lesson) {
        logger.warn('[LiveQuiz] Config not found locally, downloading...');
        await downloadQuiz(lesson);

        configFile = await readLocalConfig(configPath);
      } else if (!configFile && lessonId) {
        logger.warn('[LiveQuiz] Lesson data required for bundle download');
      }
    }

    if (!configFile) {
      throw new Error('Failed to load live quiz config.');
    }

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
      0,
    );
    if (roomDoc.participants) {
      if (participantsPlayedCount === roomDoc.participants.length) {
        clearInterval(questionInterval);
        changeQuestion();
      }
    }
  };

  const onTimeOut = (_liveQuizConfig?: LiveQuiz) => {
    changeQuestion(_liveQuizConfig);
  };

  const changeQuestion = async (
    _liveQuizConfig?: LiveQuiz,
    isStart: boolean = false,
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
    totalLessonTimeSpent += LIVE_QUIZ_QUESTION_TIME - remainingTime;
  };

  async function updateResult() {
    let totalScore = 0;
    let totalTimeSpent = 0;
    const totalQuestions = liveQuizConfig?.data.length || 0;
    let correctMoves = 0;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (lessonId) {
      if (onTotalScoreChange) {
        onTotalScoreChange(totalLessonScore);
      }
      const classData = schoolUtil.getCurrentClass();
      const shouldGiveDailyReward =
        isReward || (isLearningPathway && (await Util.shouldGiveDailyReward()));
      if (shouldGiveDailyReward) {
        sessionStorage.setItem(REWARD_LESSON, 'true');
      }
      await api.updateResult(
        student!,
        quizData.courseId,
        quizData.lessonid,
        Math.round(totalLessonScore),
        lessonCorrectMoves,
        totalQuestions - lessonCorrectMoves,
        totalLessonTimeSpent,
        undefined,
        quizData.chapterId,
        classData?.id,
        classData?.school_id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        _currentUser?.id,
        undefined,
        source,
      );
      totalLessonScore = 0;
      totalLessonTimeSpent = 0;
      lessonCorrectMoves = 0;
      if (isLearningPathway) {
        const currentStudent = Util.getCurrentStudent() as TableTypes<'user'>;
        await Util.updateLearningPath(currentStudent, isReward);
      }
    } else {
      if (!roomDoc?.results) return;
      const roomResults = roomDoc.results as
        | Record<string, { score: number; timeSpent: number }[]>
        | undefined;
      for (let result of roomResults?.[student!.id] ?? []) {
        totalScore += result.score || 0;
        totalTimeSpent += result.timeSpent || 0;
        if (result.score > 0) {
          correctMoves++;
        }
      }
      var _assignment = await api.getAssignmentById(roomDoc.assignment_id);
      await api.updateResult(
        student!,
        roomDoc.course_id,
        roomDoc.lesson_id,
        Math.round(totalScore),
        correctMoves,
        totalQuestions - correctMoves,
        totalTimeSpent,
        roomDoc.assignment_id,
        _assignment?.chapter_id ?? '',
        roomDoc.class_id,
        roomDoc.school_id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        _currentUser?.id,
        undefined,
        source,
      );
    }
  }

  const playLiveQuizAudio = async (
    data: LiveQuizOption | LiveQuizQuestionType,
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
      logger.error('?? ~ file: LiveQuizQuestion.tsx:348 ~ error:', error);
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
      newUrl = quizPath + '/' + url;
    }
    const audio = new Audio(newUrl);
    audio.preload = 'auto';
    audio.load();
    audiosMap[url] = audio;
    return audio;
  };

  const stopAllAudios = async () => {
    try {
      await TextToSpeech.stop();
    } catch (error) {
      logger.error(
        '?? ~ file: LiveQuizQuestion.tsx:384 ~ stopAllAudios ~ error:',
        error,
      );
    }
    if (!audiosMap) return;
    try {
      Object.values(audiosMap)?.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    } catch (error) {
      logger.error(
        '?? ~ file: LiveQuizQuestion.tsx:393 ~ stopAllAudios ~ error:',
        error,
      );
    }
  };

  const handleOptionSelect = async (optionIndex: number) => {
    if (!canAnswer || !liveQuizConfig || currentQuestionIndex == null) return;

    const option = liveQuizConfig.data[currentQuestionIndex].options[optionIndex];
    setCanAnswer(false);
    setSelectedAnswerIndex(optionIndex);
    handleOptionClick(currentQuestionIndex, optionIndex);
    const score = calculateScoreForQuestion(
      option.isCorrect === true,
      liveQuizConfig.data.length,
      LIVE_QUIZ_QUESTION_TIME - remainingTime,
    );
    await api.updateLiveQuiz(
      lessonId ?? roomDoc?.id ?? '',
      student?.id!,
      liveQuizConfig.data[currentQuestionIndex].question.id,
      LIVE_QUIZ_QUESTION_TIME - remainingTime,
      score,
    );
  };

  return {
    audio,
    canAnswer,
    correctAnswers,
    currentQuestionIndex,
    handleOptionSelect,
    liveQuizConfig,
    playLiveQuizAudio,
    quizPath,
    selectedAnswerIndex,
    selectedAnswers,
    showAnswer,
  };
}
