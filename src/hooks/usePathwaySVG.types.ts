import { RefObject } from 'react';

import { RewardBoxState } from '../common/constants';
import { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal';

export interface UsePathwaySVGParams {
  containerRef: RefObject<HTMLDivElement | null>;
  setModalOpen: (b: boolean) => void;
  setModalText: (text: string) => void;
  history: any;
  getCachedLesson: (lessonId: string) => Promise<any>;
  checkAndUpdateReward: () => Promise<string | null>;
  updateMascotToNormalState: (rewardId: string) => Promise<void>;
  invokeMascotCelebration: (stateNumber: number) => Promise<void>;
  setRewardRiveState: (state: RewardBoxState) => void;
  setRiveContainer: (el: HTMLDivElement | null) => void;
  setRewardRiveContainer: (el: HTMLDivElement | null) => void;
  setHasTodayReward: (val: boolean) => void;
  setCurrentCourse: (course: any) => void;
  setCurrentChapter: (chapter: any) => void;
  setIsRewardPathLoaded: (b: boolean) => void;
  isRewardPathLoaded: boolean;
  setPathwayLoading?: (isLoading: boolean) => void;
  onStickerPreviewReady: (
    data: StickerBookModalData,
    trigger: 'sticker_click' | 'pathway_completion_auto',
  ) => void;
  onStickerCompletionReady: (data: StickerBookModalData) => void;
}

export interface PendingStickerReward {
  studentId: string;
  awardedStickerId: string;
  stickerBookId: string | null;
  createdAt: string;
}
