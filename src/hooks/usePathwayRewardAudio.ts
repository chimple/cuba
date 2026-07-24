import React from 'react';
import {
  ACTIVATION_REWARD_FLOW_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  CURRENT_STUDENT_CHANGED_EVENT,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
} from '../common/constants';
import { AudioUtil } from '../utility/AudioUtil';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';

const STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH = '/assets/audios';
const STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX =
  'congrats_on_sticker_collection.mp3';
const STICKER_REWARD_BOX_OPEN_CLASS =
  'PathwayStructure-end-reward-box--sticker-open';
const STICKER_REWARD_BOX_CLOSE_CLASS =
  'PathwayStructure-end-reward-box--sticker-close-anim';
const STICKER_REWARD_BOX_TILT_CLASS =
  'PathwayStructure-end-reward-box--sticker-clicked';
const CROWD_CHEER_AUDIO_URL = '/assets/audios/common/crowd_cheer.mp3';
type DailyRewardAudioClipName = 'reward_01' | 'reward_02';

const getStickerCollectMascotAudioPath = (languageCode?: string) => {
  const normalizedLanguageCode = languageCode?.toLowerCase().split('-')[0];
  const resolvedLanguageCode = normalizedLanguageCode || 'en';
  return `${STICKER_COLLECT_MASCOT_AUDIO_BASE_PATH}/${resolvedLanguageCode}_${STICKER_COLLECT_MASCOT_AUDIO_FILE_SUFFIX}`;
};

export const usePathwayRewardAudio = (ctx: any) => {
  const {
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
  } = ctx;
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
      dailyRewardAudioClipName: 'reward_01',
      onRewardAudioComplete: null,
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
    (
      localAudioPath: string,
      stateValue?: number,
      onPlaybackStop?: () => void,
    ) => {
      if (!localAudioPath) {
        onPlaybackStop?.();
        return;
      }

      void (async () => {
        const didStartPlayback = await playMascotAudioFromLocalPathRef.current(
          localAudioPath,
          {
            stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
            inputName: CHIMPLE_MASCOT_INPUT_REWARD,
            stateValue: stateValue ?? currentMascotStateValueRef.current ?? 1,
          },
          { onPlaybackStop },
        );

        if (!didStartPlayback) {
          onPlaybackStop?.();
        }
      })();
    },
    [],
  );

  const playRewardAudio = React.useCallback(
    async (
      stateValue?: number,
      onPlaybackStop?: () => void,
      clipName: DailyRewardAudioClipName = 'reward_01',
    ) => {
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

      if (localAudioPath) {
        playRewardCollectMascotAudio(
          localAudioPath,
          stateValue,
          onPlaybackStop,
        );
      } else {
        onPlaybackStop?.();
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
      if (rewardConfettiTimerRef.current !== null) {
        window.clearTimeout(rewardConfettiTimerRef.current);
      }
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

      const onRewardAudioComplete = rewardAudioSequence.onRewardAudioComplete;
      resetRewardAudioSequence();
      void playRewardAudio(
        rewardAudioSequence.stateValue ?? currentMascotStateValueRef.current,
        onRewardAudioComplete ?? undefined,
        rewardAudioSequence.dailyRewardAudioClipName,
      );
    };

    const handleRewardCelebrationStarted = (event: Event) => {
      const customEvent = event as CustomEvent<{
        rewardId?: string;
        stateValue?: number;
        forceRewardAudio?: boolean;
        dailyRewardAudioClipName?: DailyRewardAudioClipName;
      }>;
      const rewardId = customEvent.detail?.rewardId;
      if (!rewardId) return;
      const rewardStateValue =
        customEvent.detail?.stateValue ?? currentMascotStateValueRef.current;

      const nextToken = rewardAudioSequenceRef.current.token + 1;
      const shouldSuppress =
        !customEvent.detail?.forceRewardAudio &&
        shouldSuppressRewardAudioForStickerBook();
      setShowRewardConfetti(true);
      if (rewardConfettiTimerRef.current !== null) {
        window.clearTimeout(rewardConfettiTimerRef.current);
      }
      rewardConfettiTimerRef.current = window.setTimeout(() => {
        setShowRewardConfetti(false);
      }, 4500);

      rewardAudioSequenceRef.current = {
        rewardId,
        crowdComplete: false,
        rewardReady: false,
        suppressed: shouldSuppress,
        stateValue: rewardStateValue,
        dailyRewardAudioClipName:
          customEvent.detail?.dailyRewardAudioClipName ?? 'reward_01',
        onRewardAudioComplete: null,
        token: nextToken,
      };

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
        forceRewardAudio?: boolean;
        dailyRewardAudioClipName?: DailyRewardAudioClipName;
        onRewardAudioComplete?: () => void;
      }>;
      const rewardId = customEvent.detail?.rewardId;
      if (!rewardId) return;

      const rewardAudioSequence = rewardAudioSequenceRef.current;
      if (rewardAudioSequence.rewardId !== rewardId) return;
      rewardAudioSequence.stateValue =
        customEvent.detail?.stateValue ??
        rewardAudioSequence.stateValue ??
        currentMascotStateValueRef.current;
      rewardAudioSequence.dailyRewardAudioClipName =
        customEvent.detail?.dailyRewardAudioClipName ??
        rewardAudioSequence.dailyRewardAudioClipName;
      rewardAudioSequence.onRewardAudioComplete =
        customEvent.detail?.onRewardAudioComplete ?? null;

      if (
        rewardAudioSequence.suppressed ||
        (!customEvent.detail?.forceRewardAudio &&
          shouldSuppressRewardAudioForStickerBook())
      ) {
        rewardAudioSequence.onRewardAudioComplete?.();
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

  return {
    handleMascotReplayClick,
    hasPendingPathwayStickerReward,
    playStickerAudioAfterReload,
    playStickerAudioAndClearPending,
  };
};
