import { RefObject, useEffect } from 'react';

import {
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
} from '../common/constants';
import { AudioUtil } from '../utility/AudioUtil';
import { CROWD_CHEER_AUDIO_URL } from './useHomeworkStickerAssets';

type DailyRewardAudioClipName = 'reward' | 'reward_01' | 'reward_02';

type RewardAudioSequence = {
  rewardId: string | null;
  crowdComplete: boolean;
  rewardReady: boolean;
  suppressed: boolean;
  stateValue: number | null;
  dailyRewardAudioClipName: DailyRewardAudioClipName;
  onRewardAudioComplete: (() => void) | null;
  token: number;
};

interface UseHomeworkStickerRewardAudioEffectsParams {
  currentMascotStateValue: number;
  playRewardAudio: (
    stateValue?: number,
    playbackOptions?: {
      onPlaybackStop?: () => void;
    },
    clipName?: DailyRewardAudioClipName,
  ) => Promise<boolean | void>;
  resetRewardAudioSequence: () => void;
  rewardAudioSequenceRef: RefObject<RewardAudioSequence>;
  rewardStickerTiltRequestIdRef: RefObject<number>;
  setStickerCollectTiltActive: (active: boolean) => void;
  shouldSuppressRewardAudioForStickerBook: () => boolean;
}

export const useHomeworkStickerRewardAudioEffects = ({
  currentMascotStateValue,
  playRewardAudio,
  resetRewardAudioSequence,
  rewardAudioSequenceRef,
  rewardStickerTiltRequestIdRef,
  setStickerCollectTiltActive,
  shouldSuppressRewardAudioForStickerBook,
}: UseHomeworkStickerRewardAudioEffectsParams) => {
  useEffect(() => {
    const playRewardAudioIfReady = (token: number, rewardId: string) => {
      const rewardAudioSequence = rewardAudioSequenceRef.current;
      if (
        rewardAudioSequence.token !== token ||
        rewardAudioSequence.rewardId !== rewardId ||
        rewardAudioSequence.suppressed
      ) {
        return;
      }

      const tiltRequestId = rewardStickerTiltRequestIdRef.current + 1;
      rewardStickerTiltRequestIdRef.current = tiltRequestId;
      let didStopRewardAudio = false;
      const stopRewardStickerTilt = () => {
        if (didStopRewardAudio) return;
        if (rewardStickerTiltRequestIdRef.current !== tiltRequestId) return;
        didStopRewardAudio = true;
        setStickerCollectTiltActive(false);
        rewardAudioSequence.onRewardAudioComplete?.();
      };

      resetRewardAudioSequence();
      setStickerCollectTiltActive(true);
      void playRewardAudio(
        rewardAudioSequence.stateValue ?? currentMascotStateValue,
        {
          onPlaybackStop: stopRewardStickerTilt,
        },
        rewardAudioSequence.dailyRewardAudioClipName,
      ).then((didStartPlayback) => {
        if (didStartPlayback === false) {
          stopRewardStickerTilt();
        }
      });
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

      const nextToken = rewardAudioSequenceRef.current.token + 1;
      const shouldSuppress =
        !customEvent.detail?.forceRewardAudio &&
        shouldSuppressRewardAudioForStickerBook();

      rewardAudioSequenceRef.current = {
        rewardId,
        crowdComplete: false,
        rewardReady: false,
        suppressed: shouldSuppress,
        stateValue: customEvent.detail?.stateValue ?? currentMascotStateValue,
        dailyRewardAudioClipName:
          customEvent.detail?.dailyRewardAudioClipName ?? 'reward',
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
        currentMascotStateValue;
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
    currentMascotStateValue,
    playRewardAudio,
    resetRewardAudioSequence,
    rewardAudioSequenceRef,
    rewardStickerTiltRequestIdRef,
    setStickerCollectTiltActive,
    shouldSuppressRewardAudioForStickerBook,
  ]);
};
