import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { t } from 'i18next';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  CHIMPLE_MASCOT_ANIMATION_IDLE,
  CHIMPLE_MASCOT_INPUT_CELEBRATE,
  CHIMPLE_MASCOT_INPUT_NORMAL,
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_CELEBRATE,
  CHIMPLE_MASCOT_STATE_MACHINE_NORMAL,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  HOMEWORK_REMOTE_ASSETS_ENABLED,
  HOMEWORK_PATHWAY,
  HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
  IDLE_REWARD_ID,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  ACTIVATION_REWARD_FLOW_KEY,
  RewardBoxState,
  TableTypes,
  IS_REWARD_FEATURE_ON,
  MASCOT_X_OFFSET,
  PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  REWARD_FLIGHT_ARC_Y_OFFSET,
  REWARD_FLIGHT_DURATION_MS,
  REWARD_FLIGHT_TARGET_X_OFFSET,
  FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS,
  FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS,
} from '../../common/constants';
import { useReward } from '../../hooks/useReward';
import { Util } from '../../utility/util';
import { AudioUtil } from '../../utility/AudioUtil';
import { useHomeworkSticker } from '../../hooks/useHomeworkSticker';
import logger from '../../utility/logger';
import { useHomeworkPathwayStructureAssets } from './useHomeworkPathwayStructureAssets';
import { useHomeworkPathwayLessonLoader } from './useHomeworkPathwayLessonLoader';
import { useHomeworkPathwaySvgLoader } from './useHomeworkPathwaySvgLoader';
import { useHomeworkPathwayRewardModalActions } from './useHomeworkPathwayRewardModalActions';
import { useHomeworkDailyRewardModalVisibility } from './useHomeworkDailyRewardModalVisibility';
import {
  DailyRewardAudioClipName,
  HomeworkPathLessonItem,
  HomeworkPathwayLesson,
  HomeworkPathwayStructureProps,
} from './homeworkPathwayStructureTypes';
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const useHomeworkPathwayStructureController = ({
  selectedSubject,
  onHomeworkComplete,
  onFinalHomeworkStickerComplete,
}: HomeworkPathwayStructureProps) => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState('');
  const [riveContainer, setRiveContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [rewardRiveContainer, setRewardRiveContainer] =
    useState<HTMLDivElement | null>(null);
  const [showRewardConfetti, setShowRewardConfetti] = useState(false);
  const rewardConfettiTimerRef = useRef<number | null>(null);

  const [rewardRiveState, setRewardRiveState] = useState<
    RewardBoxState.IDLE | RewardBoxState.SHAKING | RewardBoxState.BLAST
  >(RewardBoxState.IDLE);

  const [chimpleRiveStateMachineName, setChimpleRiveStateMachineName] =
    useState<string>(CHIMPLE_MASCOT_STATE_MACHINE_NORMAL);
  const [chimpleRiveInputName, setChimpleRiveInputName] = useState<string>(
    CHIMPLE_MASCOT_INPUT_NORMAL,
  );
  const [chimpleRiveStateValue, setChimpleRiveStateValue] = useState<number>(1);
  const [chimpleRiveAnimationName, setChimpleRiveAnimationName] = useState<
    string | undefined
  >(CHIMPLE_MASCOT_ANIMATION_IDLE);
  const [mascotKey, setMascotKey] = useState(0);
  const mascotStateRef = useRef<{
    stateMachine: string;
    inputName: string;
    stateValue: number;
    animationName?: string;
  } | null>(null);
  const mascotSpeakRequestIdRef = useRef(0);
  const currentMascotStateValueRef = useRef(1);

  const {
    hasTodayReward,
    setHasTodayReward,
    checkAndUpdateReward,
    shouldShowDailyRewardModal,
  } = useReward();
  const hasTodayRewardRef = useRef(hasTodayReward);

  const [currentCourse, setCurrentCourse] = useState<TableTypes<'course'>>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<'chapter'>>();

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [isRewardPathLoaded, setIsRewardPathLoaded] = useState(false);
  const lessonCacheRef = useRef<Map<string, HomeworkPathwayLesson>>(new Map());
  const lastRenderedPathSignatureRef = useRef<string | null>(null);
  const loadSvgRequestIdRef = useRef(0);

  // New state for homework pathway lessons array
  const [homeworkLessons, setHomeworkLessons] = useState<
    HomeworkPathLessonItem[]
  >([]);

  const inactiveText = t(
    'This lesson is locked. Play the current active lesson.',
  );
  const rewardText = t('Complete these lessons to earn rewards.');
  const shouldShowHomeworkRemoteAssets = useFeatureIsOn(
    HOMEWORK_REMOTE_ASSETS_ENABLED,
  );

  const isRewardFeatureOn: boolean =
    localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';

  const shouldAnimate = modalText === rewardText;

  useEffect(() => {
    currentMascotStateValueRef.current = chimpleRiveStateValue;
  }, [chimpleRiveStateValue]);

  useEffect(() => {
    const handleRewardCelebrationStarted = () => {
      setShowRewardConfetti(true);
      if (rewardConfettiTimerRef.current !== null) {
        window.clearTimeout(rewardConfettiTimerRef.current);
      }
      rewardConfettiTimerRef.current = window.setTimeout(() => {
        setShowRewardConfetti(false);
      }, 4500);
    };

    window.addEventListener(
      PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
      handleRewardCelebrationStarted,
    );

    return () => {
      window.removeEventListener(
        PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
        handleRewardCelebrationStarted,
      );
      if (rewardConfettiTimerRef.current !== null) {
        window.clearTimeout(rewardConfettiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    hasTodayRewardRef.current = hasTodayReward;
  }, [hasTodayReward]);

  const invokeMascotCelebration = async (stateValue: number) => {
    setChimpleRiveStateMachineName(CHIMPLE_MASCOT_STATE_MACHINE_CELEBRATE);
    setChimpleRiveInputName(CHIMPLE_MASCOT_INPUT_CELEBRATE);
    setChimpleRiveStateValue(stateValue || 1);
    setChimpleRiveAnimationName(undefined);
    setMascotKey((prev) => prev + 1);
  };

  const playMascotAudioFromLocalPath = useCallback(
    async (
      localAudioPath: string,
      stateConfig?: {
        stateMachine?: string;
        inputName?: string;
        stateValue?: number;
        animationName?: string;
      },
      playbackOptions?: {
        onPlaybackStop?: () => void;
      },
    ): Promise<boolean> => {
      const normalizedPath = localAudioPath?.trim();
      if (!normalizedPath) {
        playbackOptions?.onPlaybackStop?.();
        return false;
      }

      const requestId = mascotSpeakRequestIdRef.current + 1;
      mascotSpeakRequestIdRef.current = requestId;

      const previousState = {
        stateMachine: chimpleRiveStateMachineName,
        inputName: chimpleRiveInputName,
        stateValue: chimpleRiveStateValue,
        animationName: chimpleRiveAnimationName,
      };
      mascotStateRef.current = previousState;

      setChimpleRiveStateMachineName(
        stateConfig?.stateMachine ?? previousState.stateMachine,
      );
      setChimpleRiveInputName(
        stateConfig?.inputName ?? previousState.inputName,
      );
      setChimpleRiveStateValue(
        stateConfig?.stateValue ?? previousState.stateValue,
      );
      setChimpleRiveAnimationName(stateConfig?.animationName);
      setMascotKey((prev) => prev + 1);

      const restoreState = () => {
        if (mascotSpeakRequestIdRef.current !== requestId) return;
        const savedState = mascotStateRef.current;
        if (!savedState) return;
        setChimpleRiveStateMachineName(savedState.stateMachine);
        setChimpleRiveInputName(savedState.inputName);
        setChimpleRiveStateValue(savedState.stateValue);
        setChimpleRiveAnimationName(savedState.animationName);
        setMascotKey((prev) => prev + 1);
      };

      return AudioUtil.playAudioOrTts({
        audioUrl: normalizedPath,
        onStop: () => {
          restoreState();
          playbackOptions?.onPlaybackStop?.();
        },
        onComplete: () => {
          restoreState();
          playbackOptions?.onPlaybackStop?.();
        },
      });
    },
    [
      chimpleRiveAnimationName,
      chimpleRiveInputName,
      chimpleRiveStateMachineName,
      chimpleRiveStateValue,
    ],
  );

  const {
    createSVGImage,
    fetchSVGGroup,
    getCachedLesson,
    loadHaloAnimation,
    loadPathwayContent,
    placeElement,
    preloadAllLessonImages,
    tryFetchSVG,
  } = useHomeworkPathwayStructureAssets({
    lessonCacheRef,
    shouldShowHomeworkRemoteAssets,
  });
  const { fetchHomeworkLessons, getPendingRewardTransition } =
    useHomeworkPathwayLessonLoader({
      api,
      getCachedLesson,
      onHomeworkComplete,
      setHomeworkLessons,
    });

  const reloadHomeworkPathway = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    lastRenderedPathSignatureRef.current = null;
    setHomeworkLessons([]);
    void fetchHomeworkLessons();
  }, [fetchHomeworkLessons]);

  const playRewardAudio = useCallback(
    async (
      stateValue?: number,
      playbackOptions?: {
        onPlaybackStop?: () => void;
      },
      clipName: DailyRewardAudioClipName = 'reward',
    ): Promise<boolean> => {
      let localAudioPath: string | null = null;
      const pendingActivationRewardFlow = sessionStorage.getItem(
        ACTIVATION_REWARD_FLOW_KEY,
      );

      if (pendingActivationRewardFlow) {
        if (pendingActivationRewardFlow === 'true') {
          const languageCode = await AudioUtil.getAudioLanguageCode();
          localAudioPath = `/assets/audios/activationLesson/complete/${languageCode}_activation_lesson_complete.mp3`;
          sessionStorage.removeItem(ACTIVATION_REWARD_FLOW_KEY);
        } else {
          try {
            const parsed = JSON.parse(pendingActivationRewardFlow);
            if (parsed) {
              const languageCode = await AudioUtil.getAudioLanguageCode();
              localAudioPath = `/assets/audios/activationLesson/complete/${languageCode}_activation_lesson_complete.mp3`;
              sessionStorage.removeItem(ACTIVATION_REWARD_FLOW_KEY);
            }
          } catch {
            sessionStorage.removeItem(ACTIVATION_REWARD_FLOW_KEY);
          }
        }
      }

      if (!localAudioPath) {
        localAudioPath = await AudioUtil.getLocalizedAudioUrl(
          'dailyReward',
          clipName,
        );
      }

      if (!localAudioPath) {
        playbackOptions?.onPlaybackStop?.();
        return false;
      }

      return playMascotAudioFromLocalPath(
        localAudioPath,
        {
          stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
          inputName: CHIMPLE_MASCOT_INPUT_REWARD,
          stateValue: stateValue ?? currentMascotStateValueRef.current ?? 1,
        },
        playbackOptions,
      );
    },
    [playMascotAudioFromLocalPath],
  );

  const {
    closeStickerCompletion,
    closeStickerPreview,
    finishFinalHomeworkStickerFlow,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleMascotReplayClick,
    handleStickerPreviewReady,
    isOffline,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    rewardBoxVariant,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  } = useHomeworkSticker({
    containerRef,
    riveContainer,
    currentMascotStateValue: chimpleRiveStateValue,
    reloadHomeworkPathway,
    onFinalHomeworkStickerComplete,
    playMascotAudioFromLocalPath,
    playRewardAudio,
  });

  const updateMascotToNormalState = useCallback(
    async (rewardId: string) => {
      try {
        const rewardRecord = await api.getRewardById(rewardId);
        if (rewardRecord && rewardRecord.type === 'normal') {
          setChimpleRiveStateMachineName(
            rewardRecord.state_machine || CHIMPLE_MASCOT_STATE_MACHINE_NORMAL,
          );
          setChimpleRiveInputName(
            rewardRecord.state_input_name || CHIMPLE_MASCOT_INPUT_NORMAL,
          );
          setChimpleRiveStateValue(rewardRecord.state_number_input || 1);
          setChimpleRiveAnimationName(undefined);
          setMascotKey((prev) => prev + 1);
        } else {
          setChimpleRiveAnimationName(CHIMPLE_MASCOT_ANIMATION_IDLE);
          setMascotKey((prev) => prev + 1);
        }
      } catch (e) {
        logger.warn('Update mascot failed offline', e);
      }
    },
    [api],
  );

  const initializeHomeworkRewardState = useCallback(async () => {
    try {
      const todaysReward = await Promise.all([
        checkAndUpdateReward(),
        Util.fetchTodaysReward(),
      ]).then(([, result]) => result);

      const currentReward = Util.retrieveUserReward();
      const today = new Date().toISOString().split('T')[0];

      const receivedTodayReward =
        currentReward?.timestamp &&
        new Date(currentReward.timestamp).toISOString().split('T')[0] ===
          today &&
        todaysReward?.id === currentReward?.reward_id;

      setHasTodayReward(!receivedTodayReward);

      if (currentReward.reward_id !== IDLE_REWARD_ID) {
        await updateMascotToNormalState(currentReward.reward_id);
      }
    } catch (err) {
      logger.error('Error in initializeHomeworkRewardState:', err);
    }
  }, [checkAndUpdateReward, setHasTodayReward, updateMascotToNormalState]);
  const { loadSVG } = useHomeworkPathwaySvgLoader({
    api,
    checkAndUpdateReward,
    containerRef,
    createSVGImage,
    delay,
    fetchSVGGroup,
    finishFinalHomeworkStickerFlow,
    getPendingRewardTransition,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleStickerPreviewReady,
    hasTodayRewardRef,
    history,
    inactiveText,
    invokeMascotCelebration,
    isOffline,
    isRewardFeatureOn,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    loadHaloAnimation,
    loadPathwayContent,
    loadSvgRequestIdRef,
    onHomeworkComplete,
    placeElement,
    preloadAllLessonImages,
    reloadHomeworkPathway,
    rewardBoxVariant,
    rewardText,
    setCurrentChapter,
    setCurrentCourse,
    setHasTodayReward,
    setHomeworkLessons,
    setIsRewardPathLoaded,
    setModalOpen,
    setModalText,
    setRewardRiveContainer,
    setRewardRiveState,
    setRiveContainer,
    tryFetchSVG,
    updateMascotToNormalState,
  });

  useEffect(() => {
    fetchHomeworkLessons();
  }, [fetchHomeworkLessons, isRewardPathLoaded]);

  useEffect(() => {
    if (homeworkLessons.length > 0) {
      const homeworkPathSignature = (() => {
        const pendingRewardTransition = sessionStorage.getItem(
          PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
        );
        const rewardCompletedIndex = sessionStorage.getItem(
          HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
        );
        const storedHomeworkPath = pendingRewardTransition
          ? null
          : localStorage.getItem(HOMEWORK_PATHWAY);
        const visualConfigSignature = [
          rewardBoxVariant ?? 'no-reward-box-variant',
          sessionStorage.getItem(ACTIVATION_REWARD_FLOW_KEY) ??
            'no-activation-reward-flow',
          isStickerBookPreviewOn ? 'preview-on' : 'preview-off',
          isStickerBookCelebrationPopupOn
            ? 'celebration-on'
            : 'celebration-off',
          isStickerBookCompletionPopupOn ? 'completion-on' : 'completion-off',
          isOffline ? 'offline' : 'online',
          sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY) ??
            'no-sticker-preview',
          sessionStorage.getItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY) ??
            'no-sticker-completion',
          sessionStorage.getItem(PENDING_PATHWAY_STICKER_REWARD_KEY) ??
            'no-pending-sticker-reward',
        ].join('::');
        const lessonIds = homeworkLessons
          .map((item) => item.lesson?.id || item.assignment_id || '')
          .join('|');

        try {
          const path = storedHomeworkPath
            ? (JSON.parse(storedHomeworkPath) as {
                path_id?: string;
                currentIndex?: number;
              })
            : null;
          return [
            path?.path_id ?? 'no-path-id',
            path?.currentIndex ?? 'no-index',
            rewardCompletedIndex ?? 'no-reward-index',
            pendingRewardTransition ?? 'no-reward-transition',
            visualConfigSignature,
            lessonIds,
          ].join('::');
        } catch {
          return [visualConfigSignature, lessonIds].join('::');
        }
      })();

      if (
        lastRenderedPathSignatureRef.current === homeworkPathSignature &&
        containerRef.current?.querySelector('svg')
      ) {
        return;
      }

      lastRenderedPathSignatureRef.current = homeworkPathSignature;
      loadSVG();
    } else {
      lastRenderedPathSignatureRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [
    homeworkLessons,
    isOffline,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    loadSVG,
    rewardBoxVariant,
  ]);

  useEffect(() => {
    if (!isRewardFeatureOn) return;
    initializeHomeworkRewardState();
  }, [initializeHomeworkRewardState, isRewardFeatureOn, isRewardPathLoaded]);

  useHomeworkDailyRewardModalVisibility({
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    setRewardModalOpen,
    shouldShowDailyRewardModal,
  });

  const { handleClose, handleOnPlay, handleOpen } =
    useHomeworkPathwayRewardModalActions({
      api,
      currentChapter,
      currentCourse,
      history,
      setCurrentChapter,
      setCurrentCourse,
      setRewardModalOpen,
    });

  return {
    chimpleRiveAnimationName,
    chimpleRiveInputName,
    chimpleRiveStateMachineName,
    chimpleRiveStateValue,
    closeStickerCompletion,
    closeStickerPreview,
    containerRef,
    handleClose,
    handleMascotReplayClick,
    handleOnPlay,
    handleOpen,
    hasTodayReward,
    inactiveText,
    isModalOpen,
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    mascotKey,
    modalText,
    rewardModalOpen,
    rewardRiveContainer,
    rewardRiveState,
    rewardText,
    riveContainer,
    setModalOpen,
    shouldAnimate,
    showRewardConfetti,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  };
};
