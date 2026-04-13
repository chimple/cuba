import React from 'react';
import ReactDOM from 'react-dom';
import './PathwayStructure.css';

import PathwayModal from './PathwayModal';
import ChimpleRiveMascot from './ChimpleRiveMascot';
import RewardBox from './RewardBox';
import DailyRewardModal from './DailyRewardModal';
import RewardRive from './RewardRive';
import StickerBookPreviewModal, {
  StickerBookModalData,
} from './StickerBookPreviewModal';

import { useHistory } from 'react-router';
import { usePathwayData } from '../../hooks/usePathwayData';
import { usePathwaySVG } from '../../hooks/usePathwaySVG';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import {
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  COURSE_CHANGED,
  CURRENT_STUDENT_CHANGED_EVENT,
  EVENTS,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  REWARD_LEARNING_PATH,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../../common/constants';
import { t } from 'i18next';
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

const getStickerCollectMascotAudioPath = (languageCode?: string) => {
  const normalizedLanguageCode = languageCode?.toLowerCase().split('-')[0];
  const resolvedLanguageCode = normalizedLanguageCode || 'en';
  return `${STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH}/${resolvedLanguageCode}_${STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX}`;
};

const PathwayStructure: React.FC = () => {
  const history = useHistory();
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
    token: 0,
  });
  const currentMascotStateValueRef = React.useRef<number>(1);

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

    // NEW — functions for SVG to use instead of window globals
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
      Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_OPENED, {
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

  // OPTIMIZED: merged tilt animation + tilt loop into one toggle — eliminates
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
            stateMachine: 'State Machine 4',
            inputName: 'Number 3',
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

  const hasPendingPathwayStickerReward = React.useCallback(() => {
    const raw = sessionStorage.getItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
    const currentStudentId = Util.getCurrentStudent()?.id;
    if (!raw || !currentStudentId) return false;

    try {
      const parsed = JSON.parse(raw);
      return Boolean(
        parsed?.studentId === currentStudentId && parsed?.awardedStickerId,
      );
    } catch {
      return false;
    }
  }, []);

  const clearPendingPathwayStickerReward = React.useCallback(() => {
    sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
  }, []);

  const resetRewardAudioSequence = React.useCallback(() => {
    rewardAudioSequenceRef.current = {
      ...rewardAudioSequenceRef.current,
      rewardId: null,
      crowdComplete: false,
      rewardReady: false,
      suppressed: false,
      stateValue: null,
    };
  }, []);

  const shouldSuppressRewardAudioForStickerBook = React.useCallback(() => {
    const currentStudentId = Util.getCurrentStudent()?.id;
    if (!currentStudentId) return false;

    const hasMatchingAwardedSticker = (raw: string | null) => {
      if (!raw) return false;

      try {
        const parsed = JSON.parse(raw);
        return Boolean(
          parsed?.studentId === currentStudentId && parsed?.awardedStickerId,
        );
      } catch {
        return false;
      }
    };

    return hasMatchingAwardedSticker(
      sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY),
    );
  }, []);

  const playRewardCollectMascotAudio = React.useCallback(
    (localAudioPath: string, stateValue?: number) => {
      if (!localAudioPath) return;

      void playMascotAudioFromLocalPathRef.current(localAudioPath, {
        stateMachine: 'State Machine 4',
        inputName: 'Number 3',
        stateValue: stateValue ?? currentMascotStateValueRef.current ?? 1,
      });
    },
    [],
  );

  const playRewardAudio = React.useCallback(
    async (stateValue?: number) => {
      const localAudioPath = await AudioUtil.getLocalizedAudioUrl(
        'dailyReward',
        'reward',
      );
      if (localAudioPath) {
        playRewardCollectMascotAudio(localAudioPath, stateValue);
      }
    },
    [playRewardCollectMascotAudio],
  );

  // Plays the sticker-collect audio using the student's language.
  const playStickerAudio = React.useCallback(async () => {
    if (!hasCollectedStickerRef.current) return;
    const studentLanguageCode = await AudioUtil.getAudioLanguageCode();
    const localAudioPath =
      getStickerCollectMascotAudioPath(studentLanguageCode);
    if (localAudioPath) playStickerCollectMascotAudio(localAudioPath);
  }, [playStickerCollectMascotAudio]);

  const playStickerAudioAndClearPending = React.useCallback(() => {
    clearPendingPathwayStickerReward();
    void playStickerAudio();
  }, [clearPendingPathwayStickerReward, playStickerAudio]);

  const canReplayStickerAudio =
    React.useCallback(async (): Promise<boolean> => {
      if (hasCollectedStickerRef.current) return true;
      if (hasCheckedStickerReplayEligibilityRef.current) return false;
      const student = Util.getCurrentStudent();
      if (!student?.id) return false;
      try {
        const current =
          await ServiceConfig.getI().apiHandler.getCurrentStickerBookWithProgress(
            student.id,
          );
        const hasAnySticker =
          (current?.progress?.stickers_collected?.length ?? 0) > 0;
        hasCollectedStickerRef.current = hasAnySticker;
        hasCheckedStickerReplayEligibilityRef.current = true;
        return hasAnySticker;
      } catch {
        return false;
      }
    }, []);

  const handleMascotReplayClick = React.useCallback(() => {
    if (isStickerCollectSpeakingRef.current) return;
    void (async () => {
      if (!(await canReplayStickerAudio())) return;
      playStickerAudio();
    })();
  }, [canReplayStickerAudio, playStickerAudio]);

  // Queue audio to play after the pathway reload swaps in a fresh rive container.
  const playStickerAudioAfterReload = React.useCallback(() => {
    pendingCelebrationRiveContainerRef.current = latestRiveContainerRef.current;
    setShouldCelebrateAfterPathwayReload(true);
  }, []);

  // Cleanup tilt on unmount
  React.useEffect(
    () => () => setStickerCollectTiltActive(false),
    [setStickerCollectTiltActive],
  );

  React.useEffect(
    () => () => {
      rewardAudioSequenceRef.current.token += 1;
      resetRewardAudioSequence();
    },
    [resetRewardAudioSequence],
  );

  React.useEffect(() => {
    const handleStudentChanged = () => {
      resetRewardAudioSequence();
      clearPendingPathwayStickerReward();
      resetStickerCelebrationState();
    };

    window.addEventListener(
      CURRENT_STUDENT_CHANGED_EVENT,
      handleStudentChanged as EventListener,
    );

    return () => {
      window.removeEventListener(
        CURRENT_STUDENT_CHANGED_EVENT,
        handleStudentChanged as EventListener,
      );
    };
  }, [
    clearPendingPathwayStickerReward,
    resetRewardAudioSequence,
    resetStickerCelebrationState,
  ]);

  // Trigger audio after pathway reloads with a new riveContainer
  React.useEffect(() => {
    latestRiveContainerRef.current = riveContainer;
    if (
      !shouldCelebrateAfterPathwayReload ||
      !riveContainer ||
      riveContainer === pendingCelebrationRiveContainerRef.current
    )
      return;

    const frameId = window.requestAnimationFrame(() => {
      pendingCelebrationRiveContainerRef.current = null;
      setShouldCelebrateAfterPathwayReload(false);
      playStickerAudioAndClearPending();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    playStickerAudioAndClearPending,
    riveContainer,
    shouldCelebrateAfterPathwayReload,
  ]);

  React.useEffect(() => {
    const playRewardAudioIfReady = (token: number, rewardId: string) => {
      const rewardAudioSequence = rewardAudioSequenceRef.current;
      if (
        rewardAudioSequence.token !== token ||
        rewardAudioSequence.rewardId !== rewardId ||
        rewardAudioSequence.suppressed
      ) {
        return;
      }

      resetRewardAudioSequence();
      void playRewardAudio(
        rewardAudioSequence.stateValue ?? currentMascotStateValueRef.current,
      );
    };

    const handleRewardCelebrationStarted = (event: Event) => {
      const customEvent = event as CustomEvent<{
        rewardId?: string;
        stateValue?: number;
      }>;
      const rewardId = customEvent.detail?.rewardId;
      if (!rewardId) return;
      const rewardStateValue =
        customEvent.detail?.stateValue ?? currentMascotStateValueRef.current;

      const nextToken = rewardAudioSequenceRef.current.token + 1;
      const shouldSuppress = shouldSuppressRewardAudioForStickerBook();

      rewardAudioSequenceRef.current = {
        rewardId,
        crowdComplete: false,
        rewardReady: false,
        suppressed: shouldSuppress,
        stateValue: rewardStateValue,
        token: nextToken,
      };

      if (shouldSuppress) {
        return;
      }

      void AudioUtil.playAudioOrTts({
        audioUrl: CROWD_CHEER_AUDIO_URL,
        onComplete: () => {
          const rewardAudioSequence = rewardAudioSequenceRef.current;
          if (
            rewardAudioSequence.token !== nextToken ||
            rewardAudioSequence.rewardId !== rewardId ||
            rewardAudioSequence.suppressed
          ) {
            return;
          }

          rewardAudioSequence.crowdComplete = true;
          if (rewardAudioSequence.rewardReady) {
            playRewardAudioIfReady(nextToken, rewardId);
          }
        },
      });
    };

    const handleRewardAudioReady = (event: Event) => {
      const customEvent = event as CustomEvent<{
        rewardId?: string;
        stateValue?: number;
      }>;
      const rewardId = customEvent.detail?.rewardId;
      if (!rewardId) return;

      const rewardAudioSequence = rewardAudioSequenceRef.current;
      if (rewardAudioSequence.rewardId !== rewardId) return;
      rewardAudioSequence.stateValue =
        customEvent.detail?.stateValue ??
        rewardAudioSequence.stateValue ??
        currentMascotStateValueRef.current;

      if (
        rewardAudioSequence.suppressed ||
        shouldSuppressRewardAudioForStickerBook()
      ) {
        resetRewardAudioSequence();
        return;
      }

      if (rewardAudioSequence.crowdComplete) {
        playRewardAudioIfReady(rewardAudioSequence.token, rewardId);
        return;
      }

      rewardAudioSequence.rewardReady = true;
    };

    window.addEventListener(
      PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
      handleRewardCelebrationStarted as EventListener,
    );
    window.addEventListener(
      PATHWAY_REWARD_AUDIO_READY_EVENT,
      handleRewardAudioReady as EventListener,
    );

    return () => {
      window.removeEventListener(
        PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
        handleRewardCelebrationStarted as EventListener,
      );
      window.removeEventListener(
        PATHWAY_REWARD_AUDIO_READY_EVENT,
        handleRewardAudioReady as EventListener,
      );
    };
  }, [
    playRewardAudio,
    resetRewardAudioSequence,
    shouldSuppressRewardAudioForStickerBook,
  ]);

  // Keep tilt in sync with reward box when mascot is speaking
  React.useEffect(() => {
    if (!isStickerCollectSpeaking) return;
    const container = containerRef.current;
    if (!container) return;

    const syncTilt = () => {
      const rewardBox = getStickerRewardBoxElement();
      if (!rewardBox || !isStickerCollectSpeakingRef.current) return;
      rewardBox.classList.remove(
        STICKER_REWARD_BOX_OPEN_CLASS,
        STICKER_REWARD_BOX_CLOSE_CLASS,
      );
      rewardBox.classList.add(STICKER_REWARD_BOX_TILT_CLASS);
    };

    syncTilt();

    const observer = new MutationObserver(syncTilt);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [containerRef, getStickerRewardBoxElement, isStickerCollectSpeaking]);

  const getDeferredStickerCompletionPayload = React.useCallback(() => {
    const raw = sessionStorage.getItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const payload = parsed?.payload;
      if (
        !payload ||
        typeof payload !== 'object' ||
        !payload.stickerBookId ||
        !Array.isArray(payload.collectedStickerIds)
      ) {
        return null;
      }

      return {
        source: payload.source ?? 'learning_pathway',
        stickerBookId: payload.stickerBookId,
        stickerBookTitle: payload.stickerBookTitle || 'Sticker Book',
        stickerBookSvgUrl: payload.stickerBookSvgUrl || '',
        collectedStickerIds: payload.collectedStickerIds,
        totalStickerCount:
          typeof payload.totalStickerCount === 'number'
            ? payload.totalStickerCount
            : payload.collectedStickerIds.length,
      } as StickerBookModalData;
    } catch {
      return null;
    }
  }, []);

  const refreshPathAfterRewardModal = React.useCallback(() => {
    if (!sessionStorage.getItem(REWARD_LEARNING_PATH)) return;

    sessionStorage.removeItem(REWARD_LEARNING_PATH);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
    }, 0);
  }, []);

  const closePathwayModal = React.useCallback(() => {
    setModalOpen(false);
    refreshPathAfterRewardModal();
  }, [refreshPathAfterRewardModal, setModalOpen]);

  const confirmPathwayModal = React.useCallback(() => {
    setModalOpen(false);
    refreshPathAfterRewardModal();
  }, [refreshPathAfterRewardModal, setModalOpen]);

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
  });

  const closeStickerPreview = React.useCallback(
    (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => {
      if (!stickerPreviewData) return;
      const isDragPopup = stickerPreviewTrigger === 'pathway_completion_auto';
      Util.logEvent(
        isDragPopup
          ? EVENTS.STICKER_DRAG_POPUP_CLOSED
          : EVENTS.STICKER_PREVIEW_POPUP_CLOSED,
        {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          sticker_book_id: stickerPreviewData.stickerBookId,
          sticker_id: stickerPreviewData.nextStickerId,
          source: stickerPreviewData.source,
          close_reason: reason,
          trigger: stickerPreviewTrigger,
        },
      );
      setIsStickerPreviewOpen(false);
      setStickerPreviewLaunchMotion(null);
      setStickerPreviewFlyoutMotion(null);
      if (stickerPreviewTrigger === 'pathway_completion_auto') {
        hasCollectedStickerRef.current = true;
        hasCheckedStickerReplayEligibilityRef.current = true;
        sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
        sessionStorage.removeItem(REWARD_LEARNING_PATH);
        const deferredCompletionPayload = getDeferredStickerCompletionPayload();
        if (deferredCompletionPayload) {
          shouldRefreshPathAfterCompletionRef.current = true;
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
                detail: deferredCompletionPayload,
              }),
            );
          }, 0);
        } else {
          playStickerAudioAfterReload();
          window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
          }, 0);
        }
      }
    },
    [
      getDeferredStickerCompletionPayload,
      playStickerAudioAfterReload,
      stickerPreviewData,
      stickerPreviewTrigger,
    ],
  );

  const closeStickerCompletion = React.useCallback(
    (reason: 'backdrop' | 'close_button') => {
      if (stickerCompletionData && reason === 'close_button') {
        Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_CLOSE_CLICKED, {
          user_id: Util.getCurrentStudent()?.id ?? 'unknown',
          source: stickerCompletionData.source,
          sticker_book_id: stickerCompletionData.stickerBookId,
          sticker_book_title: stickerCompletionData.stickerBookTitle,
          collected_count: stickerCompletionData.collectedStickerIds.length,
          total_stickers: stickerCompletionData.totalStickerCount,
        });
      }
      setIsStickerCompletionOpen(false);
      if (shouldRefreshPathAfterCompletionRef.current) {
        shouldRefreshPathAfterCompletionRef.current = false;
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent(COURSE_CHANGED));
        }, 0);
      } else if (
        sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY) ||
        hasPendingPathwayStickerReward()
      ) {
        playStickerAudioAfterReload();
        window.setTimeout(() => {
          (window as any).__triggerPathwayReload__?.();
        }, 0);
      } else {
        playStickerAudioAndClearPending();
      }
    },
    [
      hasPendingPathwayStickerReward,
      playStickerAudioAndClearPending,
      playStickerAudioAfterReload,
      stickerCompletionData,
    ],
  );

  // OPTIMIZED: two effects merged into one; { once: true } replaces manual
  // removeEventListener — self-cleaning, no memory leak
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

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <PathwayModal
          text={modalText}
          onClose={closePathwayModal}
          onConfirm={confirmPathwayModal}
          animate={shouldAnimate}
          audioFolder={
            modalText === inactiveText
              ? 'lessonLocked'
              : modalText === rewardText
                ? 'completeLesson'
                : undefined
          }
          audioClipName={
            modalText === inactiveText
              ? 'lesson_locked'
              : modalText === rewardText
                ? 'complete_lesson_to_get_reward'
                : undefined
          }
        />
      )}
      {/* SVG Root Container */}
      <div className="PathwayStructure-div" ref={containerRef} />

      {/* Chimple Mascot */}
      {riveContainer &&
        ReactDOM.createPortal(
          <ChimpleRiveMascot
            key={mascotKey}
            stateMachine={mascotProps.stateMachine}
            inputName={mascotProps.inputName}
            stateValue={mascotProps.stateValue}
            animationName={mascotProps.animationName}
            onClick={handleMascotReplayClick}
            overlayRules={[
              { stateMachine: 'State Machine 4', inputName: 'Number 3' },
            ]}
          />,
          riveContainer,
        )}

      {/* Reward Box Rive */}
      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer,
        )}

      {/* Daily reward icon */}
      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleRewardBoxOpen} />
      )}

      {/* Daily Reward modal */}
      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={t('Play one lesson and collect your daily reward!')}
          onClose={handleRewardModalClose}
          onPlay={handleRewardModalPlay}
        />
      )}

      {isStickerPreviewOpen && stickerPreviewData && (
        <StickerBookPreviewModal
          data={stickerPreviewData}
          variant={
            stickerPreviewTrigger === 'pathway_completion_auto'
              ? 'drag_collect'
              : 'preview'
          }
          launchMotion={stickerPreviewLaunchMotion}
          flyoutMotion={stickerPreviewFlyoutMotion}
          onClose={closeStickerPreview}
        />
      )}

      {isStickerCompletionOpen && stickerCompletionData && (
        <StickerBookPreviewModal
          data={stickerCompletionData}
          mode="completion"
          onClose={
            closeStickerCompletion as (
              reason: 'close_button' | 'backdrop' | 'acknowledge_button',
            ) => void
          }
        />
      )}
    </>
  );
};

export default PathwayStructure;
