import { useCallback, useEffect, useRef, useState } from 'react';
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react';

import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  CURRENT_STUDENT_CHANGED_EVENT,
  EVENTS,
  HOMEWORK_PATHWAY,
  PATHWAY_END_REWARD_BOX_VARIANT,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  REWARD_LEARNING_PATH,
  STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  STICKER_BOOK_COMPLETION_POPUP,
  STICKER_BOOK_COMPLETION_READY_EVENT,
  STICKER_BOOK_PREVIEW_ENABLED,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { AudioUtil } from '../utility/AudioUtil';
import {
  StickerBookModalData,
  StickerBookPreviewVariant,
} from '../components/learningPathway/StickerBookPreviewModal.logic';
import { setCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import { useAppSelector } from '../redux/hooks';
import logger from '../utility/logger';
import {
  clearPendingHomeworkStickerFlow,
  clearPendingHomeworkStickerPreviewState,
  clearPendingFinalHomeworkStickerFlow,
  hasPendingFinalHomeworkStickerFlow,
} from '../utility/homeworkStickerFlow';
import {
  getStickerCollectMascotAudioPath,
  getStickerImageFallbackFromBookSvg,
  STICKER_REWARD_BOX_CLOSE_CLASS,
  STICKER_REWARD_BOX_OPEN_CLASS,
  STICKER_REWARD_BOX_SELECTOR,
  STICKER_REWARD_BOX_TILT_CLASS,
} from './useHomeworkStickerAssets';
import { useHomeworkStickerModals } from './useHomeworkStickerModals';
import { useHomeworkStickerRewardAudioEffects } from './useHomeworkStickerRewardAudioEffects';
import {
  DailyRewardAudioClipName,
  UseHomeworkStickerParams,
} from './useHomeworkSticker.types';

export function useHomeworkSticker({
  containerRef,
  riveContainer,
  currentMascotStateValue,
  reloadHomeworkPathway,
  onFinalHomeworkStickerComplete,
  playMascotAudioFromLocalPath,
  playRewardAudio,
}: UseHomeworkStickerParams) {
  const api = ServiceConfig.getI().apiHandler;
  const [stickerPreviewData, setStickerPreviewData] =
    useState<StickerBookModalData | null>(null);
  const [isStickerPreviewOpen, setIsStickerPreviewOpen] = useState(false);
  const [stickerPreviewTrigger, setStickerPreviewTrigger] =
    useState<StickerBookPreviewVariant>('preview');
  const [stickerPreviewLaunchMotion, setStickerPreviewLaunchMotion] = useState<{
    offsetX: number;
    offsetY: number;
    startScale: number;
  } | null>(null);
  const [stickerPreviewFlyoutMotion, setStickerPreviewFlyoutMotion] = useState<{
    offsetX: number;
    offsetY: number;
    endScale: number;
  } | null>(null);
  const [stickerCompletionData, setStickerCompletionData] =
    useState<StickerBookModalData | null>(null);
  const [isStickerCompletionOpen, setIsStickerCompletionOpen] = useState(false);
  const [isStickerCollectSpeaking, setIsStickerCollectSpeaking] =
    useState(false);
  const [
    shouldCelebrateAfterPathwayReload,
    setShouldCelebrateAfterPathwayReload,
  ] = useState(false);

  const lastStickerCompletionOpenKeyRef = useRef<string | null>(null);
  const shouldRefreshPathAfterCompletionRef = useRef(false);
  const isStickerCollectSpeakingRef = useRef(false);
  const hasCollectedStickerRef = useRef(false);
  const hasCheckedStickerReplayEligibilityRef = useRef(false);
  const isFinishingFinalHomeworkStickerFlowRef = useRef(false);
  const pendingCelebrationRiveContainerRef = useRef<Element | null>(null);
  const latestRiveContainerRef = useRef<Element | null>(null);
  const rewardStickerTiltRequestIdRef = useRef(0);
  const rewardAudioSequenceRef = useRef({
    rewardId: null as string | null,
    crowdComplete: false,
    rewardReady: false,
    suppressed: false,
    stateValue: null as number | null,
    dailyRewardAudioClipName: 'reward' as DailyRewardAudioClipName,
    onRewardAudioComplete: null as (() => void) | null,
    token: 0,
  });

  const liveIsStickerBookPreviewOn = useFeatureIsOn(
    STICKER_BOOK_PREVIEW_ENABLED,
  );
  const liveIsStickerBookCelebrationPopupOn = useFeatureIsOn(
    STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  );
  const liveIsStickerBookCompletionPopupOn = useFeatureIsOn(
    STICKER_BOOK_COMPLETION_POPUP,
  );
  const liveRewardBoxVariant = useFeatureValue(
    PATHWAY_END_REWARD_BOX_VARIANT,
    'mystery_box',
  );
  const cachedFeatureValues = useAppSelector(
    (state) => state.growthbook.featureValues,
  );

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isStickerBookPreviewOn = isOffline
    ? ((cachedFeatureValues?.[STICKER_BOOK_PREVIEW_ENABLED] as boolean) ??
      liveIsStickerBookPreviewOn)
    : liveIsStickerBookPreviewOn;
  const isStickerBookCelebrationPopupOn = isOffline
    ? ((cachedFeatureValues?.[
        STICKER_BOOK_CELEBRATION_POPUP_ENABLED
      ] as boolean) ?? liveIsStickerBookCelebrationPopupOn)
    : liveIsStickerBookCelebrationPopupOn;
  const isStickerBookCompletionPopupOn = isOffline
    ? ((cachedFeatureValues?.[STICKER_BOOK_COMPLETION_POPUP] as boolean) ??
      liveIsStickerBookCompletionPopupOn)
    : liveIsStickerBookCompletionPopupOn;
  const rewardBoxVariant = isOffline
    ? ((cachedFeatureValues?.[PATHWAY_END_REWARD_BOX_VARIANT] as string) ??
      liveRewardBoxVariant)
    : liveRewardBoxVariant;

  useEffect(() => {
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_PREVIEW_ENABLED,
      liveIsStickerBookPreviewOn,
    );
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
      liveIsStickerBookCelebrationPopupOn,
    );
    setCachedGrowthBookFeatureValue(
      STICKER_BOOK_COMPLETION_POPUP,
      liveIsStickerBookCompletionPopupOn,
    );
    setCachedGrowthBookFeatureValue(
      PATHWAY_END_REWARD_BOX_VARIANT,
      liveRewardBoxVariant,
    );
  }, [
    liveIsStickerBookPreviewOn,
    liveIsStickerBookCelebrationPopupOn,
    liveIsStickerBookCompletionPopupOn,
    liveRewardBoxVariant,
  ]);

  const getStickerRewardBoxElement = useCallback(
    () => containerRef.current?.querySelector(STICKER_REWARD_BOX_SELECTOR),
    [containerRef],
  );

  const setStickerCollectTiltActive = useCallback(
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

  const clearPendingPathwayStickerReward = useCallback(() => {
    sessionStorage.removeItem(PENDING_PATHWAY_STICKER_REWARD_KEY);
  }, []);

  const hasPendingPathwayStickerReward = useCallback(() => {
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

  const finishHomeworkAfterStickerFlow = useCallback(() => {
    shouldRefreshPathAfterCompletionRef.current = false;
    clearPendingFinalHomeworkStickerFlow();
    clearPendingPathwayStickerReward();
    sessionStorage.removeItem(AUTO_OPEN_STICKER_PREVIEW_KEY);
    sessionStorage.removeItem(AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY);
    localStorage.removeItem(HOMEWORK_PATHWAY);
    onFinalHomeworkStickerComplete?.();
  }, [clearPendingPathwayStickerReward, onFinalHomeworkStickerComplete]);

  const resetRewardAudioSequence = useCallback(() => {
    rewardAudioSequenceRef.current = {
      ...rewardAudioSequenceRef.current,
      rewardId: null,
      crowdComplete: false,
      rewardReady: false,
      suppressed: false,
      stateValue: null,
      dailyRewardAudioClipName: 'reward',
      onRewardAudioComplete: null,
    };
  }, []);

  const shouldSuppressRewardAudioForStickerBook = useCallback(() => {
    const currentStudentId = Util.getCurrentStudent()?.id;
    if (!currentStudentId) return false;

    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(AUTO_OPEN_STICKER_PREVIEW_KEY) || 'null',
      );
      return Boolean(
        parsed?.studentId === currentStudentId && parsed?.awardedStickerId,
      );
    } catch {
      return false;
    }
  }, []);

  const playStickerCollectMascotAudio = useCallback(
    async (
      localAudioPath: string,
      onPlaybackStop?: () => void,
    ): Promise<boolean> => {
      if (!localAudioPath) {
        onPlaybackStop?.();
        return false;
      }
      setStickerCollectTiltActive(true);
      const didStartPlayback = await playMascotAudioFromLocalPath(
        localAudioPath,
        {
          stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
          inputName: CHIMPLE_MASCOT_INPUT_REWARD,
        },
        {
          onPlaybackStop: () => {
            setStickerCollectTiltActive(false);
            onPlaybackStop?.();
          },
        },
      );

      if (!didStartPlayback) {
        setStickerCollectTiltActive(false);
        onPlaybackStop?.();
      }

      return didStartPlayback;
    },
    [playMascotAudioFromLocalPath, setStickerCollectTiltActive],
  );

  const playStickerAudio = useCallback(
    async (onPlaybackStop?: () => void): Promise<boolean> => {
      if (!hasCollectedStickerRef.current) {
        onPlaybackStop?.();
        return false;
      }
      const studentLanguageCode = await AudioUtil.getAudioLanguageCode();
      const localAudioPath =
        getStickerCollectMascotAudioPath(studentLanguageCode);
      if (localAudioPath) {
        return playStickerCollectMascotAudio(localAudioPath, onPlaybackStop);
      }
      onPlaybackStop?.();
      return false;
    },
    [playStickerCollectMascotAudio],
  );

  const playStickerAudioAndClearPending = useCallback(
    (onPlaybackStop?: () => void) => {
      clearPendingPathwayStickerReward();
      return playStickerAudio(onPlaybackStop);
    },
    [clearPendingPathwayStickerReward, playStickerAudio],
  );

  const playStickerAudioAndFinishHomework = useCallback(() => {
    if (isFinishingFinalHomeworkStickerFlowRef.current) return;

    isFinishingFinalHomeworkStickerFlowRef.current = true;
    clearPendingFinalHomeworkStickerFlow();
    hasCollectedStickerRef.current = true;
    hasCheckedStickerReplayEligibilityRef.current = true;

    void playStickerAudioAndClearPending(() => {
      finishHomeworkAfterStickerFlow();
    });
  }, [finishHomeworkAfterStickerFlow, playStickerAudioAndClearPending]);

  const playStickerAudioAfterReload = useCallback(() => {
    pendingCelebrationRiveContainerRef.current = latestRiveContainerRef.current;
    setShouldCelebrateAfterPathwayReload(true);
  }, []);

  const canReplayStickerAudio = useCallback(async (): Promise<boolean> => {
    if (hasCollectedStickerRef.current) return true;
    if (hasCheckedStickerReplayEligibilityRef.current) return false;
    const student = Util.getCurrentStudent();
    if (!student?.id) return false;

    try {
      const current = await api.getCurrentStickerBookWithProgress(student.id);
      const hasAnySticker =
        (current?.progress?.stickers_collected?.length ?? 0) > 0;
      hasCollectedStickerRef.current = hasAnySticker;
      hasCheckedStickerReplayEligibilityRef.current = true;
      return hasAnySticker;
    } catch {
      return false;
    }
  }, [api]);

  const handleMascotReplayClick = useCallback(() => {
    if (isStickerCollectSpeakingRef.current) return;
    void (async () => {
      if (!(await canReplayStickerAudio())) return;
      playStickerAudio();
    })();
  }, [canReplayStickerAudio, playStickerAudio]);

  const {
    closeStickerCompletion,
    closeStickerPreview,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleStickerPreviewReady,
    openStickerCompletion,
  } = useHomeworkStickerModals({
    api,
    clearPendingPathwayStickerReward,
    getStickerRewardBoxElement,
    hasCollectedStickerRef,
    hasCheckedStickerReplayEligibilityRef,
    hasPendingPathwayStickerReward,
    lastStickerCompletionOpenKeyRef,
    playStickerAudioAfterReload,
    playStickerAudioAndClearPending,
    playStickerAudioAndFinishHomework,
    reloadHomeworkPathway,
    setIsStickerCompletionOpen,
    setIsStickerPreviewOpen,
    setStickerCompletionData,
    setStickerPreviewData,
    setStickerPreviewFlyoutMotion,
    setStickerPreviewLaunchMotion,
    setStickerPreviewTrigger,
    shouldRefreshPathAfterCompletionRef,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewTrigger,
  });

  const resetStickerCelebrationState = useCallback(() => {
    pendingCelebrationRiveContainerRef.current = null;
    latestRiveContainerRef.current = null;
    hasCollectedStickerRef.current = false;
    hasCheckedStickerReplayEligibilityRef.current = false;
    isFinishingFinalHomeworkStickerFlowRef.current = false;
    isStickerCollectSpeakingRef.current = false;
    setShouldCelebrateAfterPathwayReload(false);
    setStickerCollectTiltActive(false);
    setIsStickerPreviewOpen(false);
    setStickerPreviewData(null);
    setStickerPreviewLaunchMotion(null);
    setStickerPreviewFlyoutMotion(null);
    setStickerPreviewTrigger('preview');
    setIsStickerCompletionOpen(false);
    setStickerCompletionData(null);
    shouldRefreshPathAfterCompletionRef.current = false;
  }, [setStickerCollectTiltActive]);

  useEffect(
    () => () => setStickerCollectTiltActive(false),
    [setStickerCollectTiltActive],
  );

  useEffect(
    () => () => {
      rewardAudioSequenceRef.current.token += 1;
      resetRewardAudioSequence();
    },
    [resetRewardAudioSequence],
  );

  useEffect(() => {
    if (isStickerBookCelebrationPopupOn) return;

    clearPendingHomeworkStickerPreviewState();
    sessionStorage.removeItem(REWARD_LEARNING_PATH);
    setIsStickerPreviewOpen(false);
    setStickerPreviewData(null);
    setStickerPreviewLaunchMotion(null);
    setStickerPreviewFlyoutMotion(null);
    setStickerPreviewTrigger('preview');
    if (!isStickerBookCompletionPopupOn) {
      clearPendingHomeworkStickerFlow();
      resetStickerCelebrationState();
    }
  }, [
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    resetStickerCelebrationState,
  ]);

  useEffect(() => {
    const handleStudentChanged = () => {
      resetRewardAudioSequence();
      clearPendingHomeworkStickerFlow();
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

  useEffect(() => {
    latestRiveContainerRef.current = riveContainer;
    if (
      !shouldCelebrateAfterPathwayReload ||
      !riveContainer ||
      riveContainer === pendingCelebrationRiveContainerRef.current
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      pendingCelebrationRiveContainerRef.current = null;
      setShouldCelebrateAfterPathwayReload(false);
      if (hasPendingFinalHomeworkStickerFlow()) {
        playStickerAudioAndFinishHomework();
        return;
      }
      playStickerAudioAndClearPending();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    playStickerAudioAndFinishHomework,
    playStickerAudioAndClearPending,
    riveContainer,
    shouldCelebrateAfterPathwayReload,
  ]);

  useHomeworkStickerRewardAudioEffects({
    currentMascotStateValue,
    playRewardAudio,
    resetRewardAudioSequence,
    rewardAudioSequenceRef,
    rewardStickerTiltRequestIdRef,
    setStickerCollectTiltActive,
    shouldSuppressRewardAudioForStickerBook,
  });

  useEffect(() => {
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

  useEffect(() => {
    const rewardBox = getStickerRewardBoxElement();
    if (!rewardBox) return;

    if (isStickerPreviewOpen) {
      rewardBox.classList.remove(STICKER_REWARD_BOX_CLOSE_CLASS);
      rewardBox.classList.add(STICKER_REWARD_BOX_OPEN_CLASS);
      return;
    }

    if (rewardBox.classList.contains(STICKER_REWARD_BOX_OPEN_CLASS)) {
      rewardBox.classList.remove(STICKER_REWARD_BOX_OPEN_CLASS);
      rewardBox.classList.add(STICKER_REWARD_BOX_CLOSE_CLASS);
      setTimeout(() => {
        rewardBox.classList.remove(STICKER_REWARD_BOX_CLOSE_CLASS);
      }, 500);
    }
  }, [getStickerRewardBoxElement, isStickerPreviewOpen]);

  useEffect(() => {
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
    closeStickerCompletion,
    closeStickerPreview,
    getPersistedStickerCompletionPayload,
    getStickerPreviewPayload,
    handleMascotReplayClick,
    handleStickerPreviewReady,
    hasPendingPathwayStickerReward,
    finishFinalHomeworkStickerFlow: playStickerAudioAndFinishHomework,
    isOffline,
    isStickerBookCelebrationPopupOn,
    isStickerBookCompletionPopupOn,
    isStickerBookPreviewOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    openStickerCompletion,
    rewardBoxVariant,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  };
}
