import { RefObject } from 'react';

export type DailyRewardAudioClipName = 'reward' | 'reward_01' | 'reward_02';

export type HomeworkStickerPlaybackStateConfig = {
  stateMachine?: string;
  inputName?: string;
  stateValue?: number;
  animationName?: string;
};

export interface UseHomeworkStickerParams {
  containerRef: RefObject<HTMLDivElement | null>;
  riveContainer: HTMLDivElement | null;
  currentMascotStateValue: number;
  reloadHomeworkPathway: () => void;
  onFinalHomeworkStickerComplete?: () => void;
  playMascotAudioFromLocalPath: (
    localAudioPath: string,
    stateConfig?: HomeworkStickerPlaybackStateConfig,
    playbackOptions?: {
      onPlaybackStop?: () => void;
    },
  ) => Promise<boolean>;
  playRewardAudio: (
    stateValue?: number,
    playbackOptions?: {
      onPlaybackStop?: () => void;
    },
    clipName?: DailyRewardAudioClipName,
  ) => Promise<boolean | void>;
}
