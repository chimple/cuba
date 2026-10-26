import React from 'react';

import { useHistory } from 'react-router';
import { StickerBookModalData } from './StickerBookPreviewModal';
import { usePathwayData } from '../../hooks/usePathwayData';
import { usePathwayRewardAudio } from '../../hooks/usePathwayRewardAudio';
import { usePathwayStickerModals } from '../../hooks/usePathwayStickerModals';
import { usePathwaySVG } from '../../hooks/usePathwaySVG';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { getPathwayStickerCollectedEvent } from '../../analytics/rewardEvents';
import {
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  COURSE_CHANGED,
  CURRENT_STUDENT_CHANGED_EVENT,
  EVENTS,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  REWARD_LEARNING_PATH,
  ACTIVATION_REWARD_FLOW_KEY,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../../common/constants';
import { AudioUtil } from '../../utility/AudioUtil';

const STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH = '/assets/audios';
const STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX =
  'congrats_on_sticker_collection.mp3';
const STICKER_REWARD_BOX_SELECTOR = '.PathwayStructure-end-reward-box--sticker';
const STICKER_REWARD_BOX_OPEN_CLASS =
  'PathwayStructure-end-reward-box--sticker-open';
const STICKER_REWARD_BOX_CLOSE_CLASS =
  'PathwayStructure-end-reward-box--sticker-close-anim';
const STICKER_REWARD_BOX_TILT_CLASS =
  'PathwayStructure-end-reward-box--sticker-clicked';
const CROWD_CHEER_AUDIO_URL = '/assets/audios/common/crowd_cheer.mp3';
const PATHWAY_LOADING_DELAY_MS = 1200;
type DailyRewardAudioClipName = 'reward_01' | 'reward_02';

const getStickerCollectMascotAudioPath = (languageCode?: string) => {
  const normalizedLanguageCode = languageCode?.toLowerCase().split('-')[0];
  const resolvedLanguageCode = normalizedLanguageCode || 'en';
  return `${STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH}/${resolvedLanguageCode}_${STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX}`;
};

export const usePathwayStructureController = () => {
  const history = useHistory();
  const [isPathwaySvgLoading, setIsPathwaySvgLoading] =
    React.useState<boolean>(false);
  const [showRewardConfetti, setShowRewardConfetti] =
    React.useState<boolean>(false);
  const rewardConfettiTimerRef = React.useRef<number | null>(null);
  const [stickerPreviewData, setStickerPreviewData] =
    React.useState<StickerBookModalData | null>(null);
  const [isStickerPreviewOpen, setIsStickerPreviewOpen] =
    React.useState<boolean>(false);
  const [stickerPreviewTrigger, setStickerPreviewTrigger] = React.useState<
    'sticker_click' | 'pathway_completion_auto'
  >('sticker_click');
  const [stickerPreviewLaunchMotion, setStickerPreviewLaunchMotion] =
    React.useState<{
      offsetX: number;
      offsetY: number;
      startScale: number;
    } | null>(null);
  const [stickerPreviewFlyoutMotion, setStickerPreviewFlyoutMotion] =
    React.useState<{
      offsetX: number;
      offsetY: number;
      endScale: number;
    } | null>(null);
  const [stickerCompletionData, setStickerCompletionData] =
    React.useState<StickerBookModalData | null>(null);
  const [isStickerCompletionOpen, setIsStickerCompletionOpen] =
    React.useState<boolean>(false);
  const [isStickerCollectSpeaking, setIsStickerCollectSpeaking] =
    React.useState<boolean>(false);
  const [
    shouldCelebrateAfterPathwayReload,
    setShouldCelebrateAfterPathwayReload,
  ] = React.useState<boolean>(false);
  const lastStickerCompletionOpenKeyRef = React.useRef<string | null>(null);
  const shouldRefreshPathAfterCompletionRef = React.useRef<boolean>(false);
  const isStickerCollectSpeakingRef = React.useRef<boolean>(false);
  const hasCollectedStickerRef = React.useRef<boolean>(false);
  const hasCheckedStickerReplayEligibilityRef = React.useRef<boolean>(false);
  const pendingCelebrationRiveContainerRef = React.useRef<Element | null>(null);
  const latestRiveContainerRef = React.useRef<Element | null>(null);
  const rewardAudioSequenceRef = React.useRef({
    rewardId: null as string | null,
    crowdComplete: false,
    rewardReady: false,
    suppressed: false,
    stateValue: null as number | null,
    dailyRewardAudioClipName: 'reward_01' as DailyRewardAudioClipName,
    onRewardAudioComplete: null as (() => void) | null,
    token: 0,
  });
  const currentMascotStateValueRef = React.useRef<number>(1);
  const pathwayLoadingDelayRef = React.useRef<{
    timerId: number | null;
  }>({
    timerId: null,
  });

  const {
    // refs
    containerRef,

    // modal
    modalOpen,
    modalText,
    setModalOpen,
    setModalText,
    shouldAnimate,

    // rive containers
    riveContainer,
    rewardRiveContainer,

    // mascot
    mascotProps,
    mascotKey,

    // reward rive box animation
    rewardRiveState,

    // reward logic
    hasTodayReward,
    isRewardFeatureOn,
    rewardModalOpen,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,
    inactiveText,
    rewardText,

    // NEW � functions for SVG to use instead of window globals
    getCachedLesson,
    updateMascotToNormalState,
    invokeMascotCelebration,
    playMascotAudioFromLocalPath,
    setRewardRiveState,
    setRiveContainer,
    setRewardRiveContainer,
    setHasTodayReward,
    setCurrentCourse,
    setCurrentChapter,
    setIsRewardPathLoaded,
    isRewardPathLoaded,
    checkAndUpdateReward,
  } = usePathwayData();

  const playMascotAudioFromLocalPathRef = React.useRef(
    playMascotAudioFromLocalPath,
  );

  React.useEffect(() => {
    playMascotAudioFromLocalPathRef.current = playMascotAudioFromLocalPath;
  }, [playMascotAudioFromLocalPath]);

  React.useEffect(() => {
    currentMascotStateValueRef.current = mascotProps.stateValue;
  }, [mascotProps.stateValue]);

  React.useEffect(() => {
    const loadingDelayState = pathwayLoadingDelayRef.current;
    return () => {
      if (loadingDelayState.timerId !== null) {
        window.clearTimeout(loadingDelayState.timerId);
        loadingDelayState.timerId = null;
      }
    };
  }, []);

  const handlePathwayLoadingChange = React.useCallback((isLoading: boolean) => {
    if (isLoading) {
      if (pathwayLoadingDelayRef.current.timerId !== null) {
        return;
      }
      pathwayLoadingDelayRef.current.timerId = window.setTimeout(() => {
        pathwayLoadingDelayRef.current.timerId = null;
        setIsPathwaySvgLoading(true);
      }, PATHWAY_LOADING_DELAY_MS);
      return;
    }

    if (pathwayLoadingDelayRef.current.timerId !== null) {
      window.clearTimeout(pathwayLoadingDelayRef.current.timerId);
      pathwayLoadingDelayRef.current.timerId = null;
    }
    setIsPathwaySvgLoading(false);
  }, []);

  const openStickerCompletion = React.useCallback(
    (data: StickerBookModalData) => {
      const completionKey = [
        data.source,
        data.stickerBookId,
        data.collectedStickerIds.length,
        data.totalStickerCount,
      ].join(':');

      if (lastStickerCompletionOpenKeyRef.current === completionKey) {
        return;
      }

      lastStickerCompletionOpenKeyRef.current = completionKey;
      if (data.collectedStickerIds.length > 0) {
        hasCollectedStickerRef.current = true;
        hasCheckedStickerReplayEligibilityRef.current = true;
      }
      setStickerCompletionData(data);
      setIsStickerCompletionOpen(true);
      Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_OPEN, {
        user_id: Util.getCurrentStudent()?.id ?? 'unknown',
        source: data.source,
        sticker_book_id: data.stickerBookId,
        sticker_book_title: data.stickerBookTitle,
        collected_count: data.collectedStickerIds.length,
        total_stickers: data.totalStickerCount,
      });
    },
    [],
  );

  const handleStickerPreviewReady = React.useCallback(
    (
      data: StickerBookModalData,
      trigger: 'sticker_click' | 'pathway_completion_auto',
    ) => {
      if (data.collectedStickerIds.length > 0) {
        hasCollectedStickerRef.current = true;
        hasCheckedStickerReplayEligibilityRef.current = true;
      }
      const rewardBoxRect = containerRef.current
        ?.querySelector('.PathwayStructure-end-reward-box--sticker')
        ?.getBoundingClientRect();
      if (trigger === 'pathway_completion_auto' && rewardBoxRect) {
        setStickerPreviewLaunchMotion({
          offsetX:
            rewardBoxRect.left +
            rewardBoxRect.width / 2 -
            window.innerWidth / 2,
          offsetY:
            rewardBoxRect.top +
            rewardBoxRect.height / 2 -
            window.innerHeight / 2,
          startScale: Math.max(0.12, Math.min(0.28, rewardBoxRect.width / 736)),
        });
      } else {
        setStickerPreviewLaunchMotion(null);
      }

      const profileAvatarRect = document
        .querySelector('[data-profile-avatar-anchor="true"]')
        ?.getBoundingClientRect();
      if (profileAvatarRect) {
        setStickerPreviewFlyoutMotion({
          offsetX:
            profileAvatarRect.right -
            profileAvatarRect.width * 0.25 -
            window.innerWidth / 2,
          offsetY:
            profileAvatarRect.top +
            profileAvatarRect.height * 0.3 -
            window.innerHeight / 2,
          endScale: Math.max(
            0.1,
            Math.min(0.24, profileAvatarRect.width / 736),
          ),
        });
      } else {
        setStickerPreviewFlyoutMotion(null);
      }
      setStickerPreviewData(data);
      setStickerPreviewTrigger(trigger);
      setIsStickerPreviewOpen(true);
      const isDragPopup = trigger === 'pathway_completion_auto';
      Util.logEvent(
        isDragPopup
          ? EVENTS.STICKER_DRAG_POPUP_SHOWN
          : EVENTS.STICKER_PREVIEW_POPUP_SHOWN,
        {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          sticker_book_id: data.stickerBookId,
          sticker_id: data.nextStickerId,
          source: data.source,
          trigger,
        },
      );
      if (isDragPopup) {
        Util.logEvent(getPathwayStickerCollectedEvent(data.source), {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          sticker_book_id: data.stickerBookId,
          sticker_id: data.nextStickerId,
          source: data.source,
          trigger,
        });
      }
    },
    [containerRef],
  );

  const handleStickerCompletionReadyInternal = React.useCallback(
    (data: StickerBookModalData) => {
      openStickerCompletion(data);
    },
    [openStickerCompletion],
  );

  const getStickerRewardBoxElement = React.useCallback(
    () => containerRef.current?.querySelector(STICKER_REWARD_BOX_SELECTOR),
    [containerRef],
  );

  // OPTIMIZED: merged tilt animation + tilt loop into one toggle � eliminates
  // redundant DOM lookups
  const setStickerCollectTiltActive = React.useCallback(
    (active: boolean) => {
      isStickerCollectSpeakingRef.current = active;
      setIsStickerCollectSpeaking(active);
      const rewardBox = getStickerRewardBoxElement();
      if (!rewardBox) return;
      if (active) {
        rewardBox.classList.remove(
          STICKER_REWARD_BOX_OPEN_CLASS,
          STICKER_REWARD_BOX_CLOSE_CLASS,
        );
        rewardBox.classList.add(STICKER_REWARD_BOX_TILT_CLASS);
      } else {
        rewardBox.classList.remove(STICKER_REWARD_BOX_TILT_CLASS);
      }
    },
    [getStickerRewardBoxElement],
  );

  const resetStickerCelebrationState = React.useCallback(() => {
    pendingCelebrationRiveContainerRef.current = null;
    latestRiveContainerRef.current = null;
    hasCollectedStickerRef.current = false;
    hasCheckedStickerReplayEligibilityRef.current = false;
    isStickerCollectSpeakingRef.current = false;
    setShouldCelebrateAfterPathwayReload(false);
    setStickerCollectTiltActive(false);
    setIsStickerPreviewOpen(false);
    setStickerPreviewData(null);
    setStickerPreviewLaunchMotion(null);
    setStickerPreviewFlyoutMotion(null);
    setStickerPreviewTrigger('sticker_click');
    setIsStickerCompletionOpen(false);
    setStickerCompletionData(null);
    shouldRefreshPathAfterCompletionRef.current = false;
  }, [setStickerCollectTiltActive]);

  // Play mascot audio from a local path and sync tilt with playback.
  const playStickerCollectMascotAudio = React.useCallback(
    (localAudioPath: string) => {
      if (!localAudioPath) return;
      setStickerCollectTiltActive(true);
      void (async () => {
        const didStartPlayback = await playMascotAudioFromLocalPath(
          localAudioPath,
          {
            stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
            inputName: CHIMPLE_MASCOT_INPUT_REWARD,
          },
          { onPlaybackStop: () => setStickerCollectTiltActive(false) },
        );
        if (!didStartPlayback) {
          setStickerCollectTiltActive(false);
        }
      })();
    },
    [playMascotAudioFromLocalPath, setStickerCollectTiltActive],
  );

  const {
    handleMascotReplayClick,
    hasPendingPathwayStickerReward,
    playStickerAudioAfterReload,
    playStickerAudioAndClearPending,
  } = usePathwayRewardAudio({
    containerRef,
    currentMascotStateValueRef,
    getStickerRewardBoxElement,
    hasCheckedStickerReplayEligibilityRef,
    hasCollectedStickerRef,
    isStickerCollectSpeaking,
    isStickerCollectSpeakingRef,
    latestRiveContainerRef,
    pendingCelebrationRiveContainerRef,
    playMascotAudioFromLocalPathRef,
    playStickerCollectMascotAudio,
    resetStickerCelebrationState,
    rewardAudioSequenceRef,
    rewardConfettiTimerRef,
    riveContainer,
    setIsStickerCollectSpeaking,
    setStickerCollectTiltActive,
    setShouldCelebrateAfterPathwayReload,
    setShowRewardConfetti,
    shouldCelebrateAfterPathwayReload,
  });
  // Mounts SVG with everything needed
  usePathwaySVG({
    containerRef,
    setModalOpen,
    setModalText,

    history,
    getCachedLesson,
    updateMascotToNormalState,
    invokeMascotCelebration,
    setRewardRiveState,
    setRiveContainer,
    setRewardRiveContainer,
    setHasTodayReward,
    setCurrentCourse,
    setCurrentChapter,
    setIsRewardPathLoaded,
    isRewardPathLoaded,
    checkAndUpdateReward,
    onStickerPreviewReady: handleStickerPreviewReady,
    onStickerCompletionReady: handleStickerCompletionReadyInternal,
    setPathwayLoading: handlePathwayLoadingChange,
  });
  const {
    closePathwayModal,
    closeStickerCompletion,
    closeStickerPreview,
    confirmPathwayModal,
  } = usePathwayStickerModals({
    hasCollectedStickerRef,
    hasCheckedStickerReplayEligibilityRef,
    hasPendingPathwayStickerReward,
    isStickerPreviewOpen,
    playStickerAudioAfterReload,
    playStickerAudioAndClearPending,
    setIsStickerCompletionOpen,
    setIsStickerPreviewOpen,
    setModalOpen,
    setStickerPreviewFlyoutMotion,
    setStickerPreviewLaunchMotion,
    shouldRefreshPathAfterCompletionRef,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewTrigger,
  });
  // OPTIMIZED: two effects merged into one; { once: true } replaces manual
  // removeEventListener � self-cleaning, no memory leak
  React.useEffect(() => {
    const rewardBox = containerRef.current?.querySelector(
      '.PathwayStructure-end-reward-box--sticker',
    );
    if (!rewardBox) return;

    if (isStickerPreviewOpen) {
      rewardBox.classList.remove(
        'PathwayStructure-end-reward-box--sticker-close-anim',
      );
      rewardBox.classList.add('PathwayStructure-end-reward-box--sticker-open');
    } else {
      if (
        rewardBox.classList.contains(
          'PathwayStructure-end-reward-box--sticker-open',
        )
      ) {
        rewardBox.classList.remove(
          'PathwayStructure-end-reward-box--sticker-open',
        );
        rewardBox.classList.add(
          'PathwayStructure-end-reward-box--sticker-close-anim',
        );
        setTimeout(() => {
          rewardBox.classList.remove(
            'PathwayStructure-end-reward-box--sticker-close-anim',
          );
        }, 500);
      }
    }
  }, [isStickerPreviewOpen, containerRef]);

  React.useEffect(() => {
    const handleStickerCompletionReady = (event: Event) => {
      const customEvent = event as CustomEvent<StickerBookModalData>;
      const data = customEvent.detail;
      if (!data?.stickerBookId) return;

      sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
      openStickerCompletion(data);
    };

    window.addEventListener(
      STICKER_BOOK_COMPLETION_READY_EVENT,
      handleStickerCompletionReady as EventListener,
    );

    return () => {
      window.removeEventListener(
        STICKER_BOOK_COMPLETION_READY_EVENT,
        handleStickerCompletionReady as EventListener,
      );
    };
  }, [openStickerCompletion]);

  return {
    closePathwayModal,
    closeStickerCompletion,
    closeStickerPreview,
    confirmPathwayModal,
    containerRef,
    handleMascotReplayClick,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,
    hasTodayReward,
    inactiveText,
    isPathwaySvgLoading,
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    mascotKey,
    mascotProps,
    modalOpen,
    modalText,
    rewardModalOpen,
    rewardRiveContainer,
    rewardRiveState,
    rewardText,
    riveContainer,
    shouldAnimate,
    showRewardConfetti,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  };
};
