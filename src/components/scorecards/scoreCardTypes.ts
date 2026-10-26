import type { TableTypes } from '../../common/constants';

export type DailyRewardSnapshot = {
  reward_id?: string | null;
  timestamp?: string | null;
} | null;

export type StickerBookSummary = {
  id?: string | null;
  title?: string | null;
  svg_url?: string | null;
  total_stickers?: number | null;
  stickers_metadata?: { id: string; sequence: number }[] | null;
} | null;

export type AwardedStickerContext = {
  awardedStickerId: string;
  createdAt: string | null;
  stickerBookId: string | null;
  stickerBookSvgUrl: string | null;
  collectedStickerIds?: string[];
  totalStickerCount?: number | null;
  completed?: boolean;
};

export type StickerRowIcon = {
  iconSrc?: string;
  iconAlt: string;
};

export type StickerRowContext = {
  currentBook: StickerBookSummary;
  pendingAwardedSticker: AwardedStickerContext | null;
  shouldShowAwardedSticker: boolean;
  shouldShowCompletedRow: boolean;
};

export type LearningPathLesson = {
  lesson_id?: string;
  isPlayed?: boolean;
};

export type LearningPathCourse = {
  course_id?: string;
  path?: LearningPathLesson[];
};

export type LearningPathData = {
  courses?: {
    currentCourseIndex?: number;
    courseList?: LearningPathCourse[];
  };
};

export type ScoreCardLogicApi = {
  getCurrentStickerBookWithProgress: (studentId: string) => Promise<{
    book?: StickerBookSummary;
    progress?: {
      stickers_collected?: string[] | null;
    } | null;
  } | null>;
  getNextWinnableSticker: (
    stickerBookId: string,
    userId?: string,
  ) => Promise<string | null>;
  getStickersByIds: (stickerIds: string[]) => Promise<TableTypes<'sticker'>[]>;
  getUserStickerBook: (
    userId: string,
  ) => Promise<TableTypes<'user_sticker_book'>[]>;
  getAllStickerBooks?: () => Promise<
    { id?: string | null; svg_url?: string | null }[]
  >;
};

export type BuildScoreCardProgressRowsParams = {
  api: ScoreCardLogicApi;
  student?: TableTypes<'user'>;
  studentId?: string;
  completedCourseId?: string;
  completedLessonId?: string;
  completedHomeworkIndex?: number;
  animateDailyReward?: boolean;
  showDailyReward?: boolean;
  showStickerProgress?: boolean;
  countCompletedLessonTowardStickerProgress?: boolean;
  allowZeroStickerProgress?: boolean;
  stickerProgressCurrentOverride?: number;
};
