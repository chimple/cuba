import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  LATEST_LEARNING_PATH,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  REWARD_LEARNING_PATH,
  TableTypes,
} from '../../common/constants';
import { Util } from '../../utility/util';
import { extractStickerSvg } from '../common/SvgHelpers';
import { fetchStickerBookSvgText } from '../../utility/stickerBookAssets';
import type { ScoreCardProgressRowData } from './ScoreCardProgressRows';

export type { ScoreCardProgressRowData } from './ScoreCardProgressRows';

const STICKER_PROGRESS_TOTAL = 5;
const STICKER_ROW_ID = 'sticker';
const STICKER_ROW_LABEL = 'Collect sticker by completing a pathway.';
const STICKER_ICON_ALT = 'Sticker';
const DAILY_REWARD_ROW_ID = 'dailyReward';
const DAILY_REWARD_LABEL = 'Collect today’s reward.';
const DAILY_REWARD_ICON_SRC = 'assets/icons/reward.svg';
const DAILY_REWARD_ICON_ALT = 'Reward';
const DAILY_REWARD_ANIMATION_SEEN_KEY =
  'score_card_daily_reward_animation_seen';
const DAILY_REWARD_ANIMATION_RECENCY_MS = 2 * 60 * 1000;
const STICKER_COMPLETION_ANIMATION_SEEN_KEY =
  'score_card_sticker_completion_animation_seen';

type DailyRewardSnapshot = {
  reward_id?: string | null;
  timestamp?: string | null;
} | null;

const stickerImageCache: Record<string, string> = {};

type StickerBookSummary = {
  id?: string | null;
  svg_url?: string | null;
} | null;

type AwardedStickerContext = {
  awardedStickerId: string;
  createdAt: string | null;
  stickerBookId: string | null;
  stickerBookSvgUrl: string | null;
};

type StickerRowIcon = {
  iconSrc?: string;
  iconAlt: string;
};

type StickerRowContext = {
  currentBook: StickerBookSummary;
  pendingAwardedSticker: AwardedStickerContext | null;
  shouldShowAwardedSticker: boolean;
  shouldShowCompletedRow: boolean;
};

type LearningPathLesson = {
  lesson_id?: string;
  isPlayed?: boolean;
};

type LearningPathCourse = {
  course_id?: string;
  path?: LearningPathLesson[];
};

type LearningPathData = {
  courses?: {
    currentCourseIndex?: number;
    courseList?: LearningPathCourse[];
  };
};

export type ScoreCardLogicApi = {
  getCurrentStickerBookWithProgress: (studentId: string) => Promise<{
    book?: StickerBookSummary;
  } | null>;
  getNextWinnableSticker: (
    stickerBookId: string,
    userId?: string,
  ) => Promise<string | null>;
  getStickersByIds: (stickerIds: string[]) => Promise<TableTypes<'sticker'>[]>;
  getUserStickerBook: (
    userId: string,
  ) => Promise<TableTypes<'user_sticker_book'>[]>;
};

type BuildScoreCardProgressRowsParams = {
  api: ScoreCardLogicApi;
  student?: TableTypes<'user'>;
  studentId?: string;
  completedCourseId?: string;
  completedLessonId?: string;
  animateDailyReward?: boolean;
};

const parseDailyRewardSnapshot = (
  reward: string | DailyRewardSnapshot | undefined | null,
): DailyRewardSnapshot => {
  if (!reward) return null;
  if (typeof reward !== 'string') return reward;

  try {
    return JSON.parse(reward) as DailyRewardSnapshot;
  } catch {
    return null;
  }
};

const getDailyRewardDay = (timestamp?: string | null) =>
  timestamp ? new Date(timestamp).toISOString().split('T')[0] : null;

const getDailyRewardAnimationKey = (
  studentId: string | undefined,
  rewardId: string,
  rewardDay: string,
) =>
  [
    DAILY_REWARD_ANIMATION_SEEN_KEY,
    studentId ?? 'unknown',
    rewardId,
    rewardDay,
  ].join(':');

const shouldAnimateOnce = (storageKey: string) => {
  if (typeof sessionStorage === 'undefined') return true;
  if (sessionStorage.getItem(storageKey) === 'true') return false;

  sessionStorage.setItem(storageKey, 'true');
  return true;
};

const shouldAnimateDailyRewardRow = (
  student: TableTypes<'user'> | undefined,
  studentId: string | undefined,
  requestedAnimation: boolean,
): boolean => {
  const reward = parseDailyRewardSnapshot(student?.reward);
  const today = new Date().toISOString().split('T')[0];
  const rewardDay = getDailyRewardDay(reward?.timestamp);

  if (!reward?.reward_id || rewardDay !== today) return false;

  const rewardTime = new Date(reward.timestamp ?? '').getTime();
  const isRecentlyCollected =
    Number.isFinite(rewardTime) &&
    Date.now() - rewardTime >= 0 &&
    Date.now() - rewardTime <= DAILY_REWARD_ANIMATION_RECENCY_MS;

  if (!requestedAnimation && !isRecentlyCollected) return false;

  const storageKey = getDailyRewardAnimationKey(
    studentId ?? student?.id,
    reward.reward_id,
    rewardDay,
  );

  return shouldAnimateOnce(storageKey);
};

const buildDailyRewardRow = (
  animateCompletion = false,
): ScoreCardProgressRowData => ({
  id: DAILY_REWARD_ROW_ID,
  label: DAILY_REWARD_LABEL,
  current: 1,
  total: 1,
  iconSrc: DAILY_REWARD_ICON_SRC,
  iconAlt: DAILY_REWARD_ICON_ALT,
  completed: true,
  animateCompletion,
});

const buildBaseStickerRow = (
  current: number,
  overrides: Partial<ScoreCardProgressRowData> = {},
): ScoreCardProgressRowData => ({
  id: STICKER_ROW_ID,
  label: STICKER_ROW_LABEL,
  current,
  total: STICKER_PROGRESS_TOTAL,
  iconSrc: undefined,
  iconAlt: STICKER_ICON_ALT,
  completed: false,
  ...overrides,
});

const getStickerImageFromBookSvg = async (
  stickerBookSvgUrl: string | null | undefined,
  stickerId: string,
): Promise<string | undefined> => {
  if (!stickerBookSvgUrl || typeof document === 'undefined') return undefined;

  const cacheKey = stickerBookSvgUrl + '::' + stickerId;
  if (stickerImageCache[cacheKey]) return stickerImageCache[cacheKey];

  try {
    const svgText = await fetchStickerBookSvgText(stickerBookSvgUrl);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = svgText;
    const svgNode = wrapper.querySelector('svg') as SVGSVGElement | null;
    if (!svgNode) return undefined;

    const stickerSvg = extractStickerSvg(svgNode, stickerId);
    if (!stickerSvg) return undefined;

    const dataUrl =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(stickerSvg);
    stickerImageCache[cacheKey] = dataUrl;
    return dataUrl;
  } catch {
    return undefined;
  }
};

const parseLearningPath = (value: unknown): LearningPathData | null => {
  if (typeof value !== 'string' || !value) return null;

  try {
    return JSON.parse(value) as LearningPathData;
  } catch {
    return null;
  }
};

const getCourseList = (learningPath: LearningPathData | null | undefined) => {
  const courseList = learningPath?.courses?.courseList;
  return Array.isArray(courseList) ? courseList : [];
};

const findCourseByCourseId = (
  courseList: LearningPathCourse[],
  completedCourseId?: string,
) => {
  if (!completedCourseId) return null;

  return (
    courseList.find((course) => course?.course_id === completedCourseId) ?? null
  );
};

const findCourseByLessonId = (
  courseList: LearningPathCourse[],
  completedLessonId?: string,
) => {
  if (!completedLessonId) return null;

  return (
    courseList.find((course) =>
      Array.isArray(course?.path)
        ? course.path.some((lesson) => lesson?.lesson_id === completedLessonId)
        : false,
    ) ?? null
  );
};

const getCurrentCourseFromIndex = (learningPath: LearningPathData) => {
  const courseList = getCourseList(learningPath);
  const currentCourseIndex = learningPath.courses?.currentCourseIndex;
  return typeof currentCourseIndex === 'number'
    ? (courseList[currentCourseIndex] ?? null)
    : (courseList[0] ?? null);
};

const getProgressCourse = ({
  completedCourseId,
  completedLessonId,
  learningPath,
  requireMatch = false,
}: {
  completedCourseId?: string;
  completedLessonId?: string;
  learningPath: LearningPathData;
  requireMatch?: boolean;
}) => {
  const courseList = getCourseList(learningPath);
  const matchedCourse =
    findCourseByCourseId(courseList, completedCourseId) ??
    findCourseByLessonId(courseList, completedLessonId);

  if (matchedCourse) return matchedCourse;
  if (requireMatch) return null;

  return getCurrentCourseFromIndex(learningPath);
};

const readStoredLearningPath = (
  studentId?: string,
): LearningPathData | null => {
  if (typeof localStorage === 'undefined' || !studentId) return null;

  try {
    const storedValue = localStorage.getItem(
      LATEST_LEARNING_PATH + ':' + studentId,
    );
    if (!storedValue) return null;

    const parsed = JSON.parse(storedValue);
    if (parsed?.studentId !== studentId) return null;

    return parseLearningPath(parsed?.learningPath);
  } catch {
    return null;
  }
};

const getFallbackLearningPath = (
  student?: TableTypes<'user'>,
): LearningPathData | null => {
  if (!student) return null;

  return (
    readStoredLearningPath(student.id) ??
    parseLearningPath(student.learning_path)
  );
};

const hasRewardSnapshot = () => {
  return (
    typeof sessionStorage !== 'undefined' &&
    Boolean(sessionStorage.getItem(REWARD_LEARNING_PATH))
  );
};

const resolveProgressLearningPath = ({
  student,
  completedCourseId,
  completedLessonId,
}: {
  student?: TableTypes<'user'>;
  completedCourseId?: string;
  completedLessonId?: string;
}) => {
  const latestLearningPath = parseLearningPath(
    student ? Util.getLatestLearningPathByUpdatedAt(student) : null,
  );
  if (!latestLearningPath) return null;

  if (!completedCourseId && !completedLessonId) {
    return getFallbackLearningPath(student) ?? latestLearningPath;
  }

  const latestMatchedCourse = getProgressCourse({
    completedCourseId,
    completedLessonId,
    learningPath: latestLearningPath,
    requireMatch: true,
  });
  if (latestMatchedCourse) return latestLearningPath;
  if (!hasRewardSnapshot()) return latestLearningPath;

  const fallbackLearningPath = getFallbackLearningPath(student);
  if (!fallbackLearningPath) return latestLearningPath;

  const fallbackMatchedCourse = getProgressCourse({
    completedCourseId,
    completedLessonId,
    learningPath: fallbackLearningPath,
    requireMatch: true,
  });

  return fallbackMatchedCourse ? fallbackLearningPath : latestLearningPath;
};

const isSameCalendarDay = (value: string | null | undefined): boolean => {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const readSessionJson = (key: string) => {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

const normalizeStickerIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string');
  }

  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
};

const getPendingAwardedStickerContext = (
  studentId?: string,
): AwardedStickerContext | null => {
  if (!studentId) return null;

  const pendingReward = readSessionJson(PENDING_PATHWAY_STICKER_REWARD_KEY);
  const previewReward = readSessionJson(AUTO_OPEN_STICKER_PREVIEW_KEY);
  const completionReward = readSessionJson(
    AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  );
  const completionPayload = completionReward?.payload;

  const hasPendingAward =
    pendingReward?.studentId === studentId &&
    typeof pendingReward?.awardedStickerId === 'string';
  const hasPreviewAward =
    previewReward?.studentId === studentId &&
    typeof previewReward?.awardedStickerId === 'string';
  const hasCompletionAward =
    completionReward?.studentId === studentId &&
    Array.isArray(completionPayload?.collectedStickerIds) &&
    completionPayload.collectedStickerIds.length > 0;

  if (!hasPendingAward && !hasPreviewAward && !hasCompletionAward) {
    return null;
  }

  const awardedStickerId = hasPendingAward
    ? pendingReward.awardedStickerId
    : hasPreviewAward
      ? previewReward.awardedStickerId
      : completionPayload.collectedStickerIds[
          completionPayload.collectedStickerIds.length - 1
        ];

  return {
    awardedStickerId,
    createdAt:
      typeof pendingReward?.createdAt === 'string'
        ? pendingReward.createdAt
        : typeof previewReward?.createdAt === 'string'
          ? previewReward.createdAt
          : typeof completionReward?.createdAt === 'string'
            ? completionReward.createdAt
            : null,
    stickerBookId:
      typeof pendingReward?.stickerBookId === 'string'
        ? pendingReward.stickerBookId
        : typeof previewReward?.stickerBookId === 'string'
          ? previewReward.stickerBookId
          : typeof completionPayload?.stickerBookId === 'string'
            ? completionPayload.stickerBookId
            : null,
    stickerBookSvgUrl:
      typeof previewReward?.stickerBookSvgUrl === 'string'
        ? previewReward.stickerBookSvgUrl
        : typeof completionPayload?.stickerBookSvgUrl === 'string'
          ? completionPayload.stickerBookSvgUrl
          : null,
  };
};

const getLatestCompletedStickerBookToday = async (
  api: ScoreCardLogicApi,
  studentId?: string,
): Promise<AwardedStickerContext | null> => {
  if (!studentId) return null;

  try {
    const rows = await api.getUserStickerBook(studentId);
    const latestCompleted = rows
      .map((row) => ({
        row,
        collectedStickerIds: normalizeStickerIds(row?.stickers_collected),
      }))
      .filter(
        ({ row, collectedStickerIds }) =>
          row?.status === 'completed' && collectedStickerIds.length > 0,
      )
      .sort((a, b) => {
        const aTime = new Date(a.row?.updated_at ?? 0).getTime();
        const bTime = new Date(b.row?.updated_at ?? 0).getTime();
        return bTime - aTime;
      })[0];

    if (
      !latestCompleted ||
      !isSameCalendarDay(latestCompleted.row?.updated_at ?? null)
    ) {
      return null;
    }

    const awardedStickerId =
      latestCompleted.collectedStickerIds[
        latestCompleted.collectedStickerIds.length - 1
      ];
    if (!awardedStickerId) return null;

    return {
      awardedStickerId,
      createdAt: latestCompleted.row.updated_at ?? null,
      stickerBookId: latestCompleted.row.sticker_book_id ?? null,
      stickerBookSvgUrl: null,
    };
  } catch {
    return null;
  }
};

const getCurrentPathwayStickerProgress = ({
  student,
  completedCourseId,
  completedLessonId,
}: {
  student?: TableTypes<'user'>;
  completedCourseId?: string;
  completedLessonId?: string;
}): number => {
  if (!student) return 1;

  try {
    const learningPath = resolveProgressLearningPath({
      student,
      completedCourseId,
      completedLessonId,
    });
    if (!learningPath) return 1;

    const progressCourse = getProgressCourse({
      completedCourseId,
      completedLessonId,
      learningPath,
    });
    const lessons =
      progressCourse && Array.isArray(progressCourse.path)
        ? progressCourse.path
        : [];
    const playedCount = lessons.filter((lesson) => lesson?.isPlayed).length;
    const completedLessonStillPending = completedLessonId
      ? lessons.some(
          (lesson) =>
            lesson?.lesson_id === completedLessonId &&
            lesson?.isPlayed !== true,
        )
      : false;
    const effectivePlayedCount =
      playedCount + (completedLessonStillPending ? 1 : 0);

    return Math.min(Math.max(effectivePlayedCount, 1), STICKER_PROGRESS_TOTAL);
  } catch {
    return 1;
  }
};

const resolveStickerRowContext = async (
  api: ScoreCardLogicApi,
  studentId: string,
): Promise<StickerRowContext> => {
  const sessionAwardedSticker = getPendingAwardedStickerContext(studentId);
  const currentBook =
    (await api.getCurrentStickerBookWithProgress(studentId))?.book ?? null;
  const completedTodayAwardedSticker = !currentBook?.id
    ? await getLatestCompletedStickerBookToday(api, studentId)
    : null;
  const pendingAwardedSticker =
    sessionAwardedSticker ?? completedTodayAwardedSticker;
  const shouldShowAwardedSticker = Boolean(
    pendingAwardedSticker?.awardedStickerId &&
    isSameCalendarDay(pendingAwardedSticker.createdAt),
  );
  const shouldShowCompletedRow = Boolean(
    !currentBook?.id && shouldShowAwardedSticker,
  );

  return {
    currentBook,
    pendingAwardedSticker,
    shouldShowAwardedSticker,
    shouldShowCompletedRow,
  };
};

const getStickerCompletionAnimationKey = (
  studentId: string,
  awardedSticker: AwardedStickerContext,
) =>
  [
    STICKER_COMPLETION_ANIMATION_SEEN_KEY,
    studentId,
    awardedSticker.stickerBookId ?? 'unknown-book',
    awardedSticker.awardedStickerId,
    getDailyRewardDay(awardedSticker.createdAt) ?? 'unknown-day',
  ].join(':');

const shouldAnimateStickerCompletionRow = (
  studentId: string,
  stickerRowContext: StickerRowContext,
  currentProgress: number,
): boolean => {
  const awardedSticker = stickerRowContext.pendingAwardedSticker;

  if (
    currentProgress !== STICKER_PROGRESS_TOTAL ||
    !stickerRowContext.shouldShowAwardedSticker ||
    !awardedSticker?.awardedStickerId ||
    !isSameCalendarDay(awardedSticker.createdAt)
  ) {
    return false;
  }

  return shouldAnimateOnce(
    getStickerCompletionAnimationKey(studentId, awardedSticker),
  );
};

const resolveStickerIdToDisplay = async ({
  api,
  studentId,
  currentBook,
  pendingAwardedSticker,
  shouldShowAwardedSticker,
}: {
  api: ScoreCardLogicApi;
  studentId: string;
  currentBook: StickerBookSummary;
  pendingAwardedSticker: AwardedStickerContext | null;
  shouldShowAwardedSticker: boolean;
}) => {
  if (shouldShowAwardedSticker) {
    return pendingAwardedSticker?.awardedStickerId ?? null;
  }

  if (!currentBook?.id) return null;
  return api.getNextWinnableSticker(currentBook.id, studentId);
};

const resolveStickerBookSvgUrl = ({
  currentBook,
  pendingAwardedSticker,
  shouldShowAwardedSticker,
}: {
  currentBook: StickerBookSummary;
  pendingAwardedSticker: AwardedStickerContext | null;
  shouldShowAwardedSticker: boolean;
}) => {
  if (!shouldShowAwardedSticker) {
    return currentBook?.svg_url ?? null;
  }

  if (pendingAwardedSticker?.stickerBookId === currentBook?.id) {
    return currentBook?.svg_url ?? null;
  }

  return pendingAwardedSticker?.stickerBookSvgUrl ?? null;
};

const resolveStickerRowIcon = async ({
  api,
  stickerId,
  stickerBookSvgUrl,
}: {
  api: ScoreCardLogicApi;
  stickerId: string | null;
  stickerBookSvgUrl: string | null;
}): Promise<StickerRowIcon> => {
  if (!stickerId) {
    return { iconSrc: undefined, iconAlt: STICKER_ICON_ALT };
  }

  const sticker = (await api.getStickersByIds([stickerId]))?.[0];
  return {
    iconSrc:
      sticker?.image ||
      (await getStickerImageFromBookSvg(stickerBookSvgUrl, stickerId)),
    iconAlt: sticker?.name || STICKER_ICON_ALT,
  };
};

const buildStickerRow = async ({
  api,
  student,
  studentId,
  completedCourseId,
  completedLessonId,
}: BuildScoreCardProgressRowsParams): Promise<ScoreCardProgressRowData | null> => {
  const currentProgress = getCurrentPathwayStickerProgress({
    student,
    completedCourseId,
    completedLessonId,
  });

  if (!studentId) {
    return buildBaseStickerRow(currentProgress);
  }

  try {
    const stickerRowContext = await resolveStickerRowContext(api, studentId);

    if (
      !stickerRowContext.currentBook?.id &&
      !stickerRowContext.shouldShowAwardedSticker
    ) {
      return null;
    }

    const stickerId = await resolveStickerIdToDisplay({
      api,
      studentId,
      currentBook: stickerRowContext.currentBook,
      pendingAwardedSticker: stickerRowContext.pendingAwardedSticker,
      shouldShowAwardedSticker: stickerRowContext.shouldShowAwardedSticker,
    });
    const stickerBookSvgUrl = resolveStickerBookSvgUrl({
      currentBook: stickerRowContext.currentBook,
      pendingAwardedSticker: stickerRowContext.pendingAwardedSticker,
      shouldShowAwardedSticker: stickerRowContext.shouldShowAwardedSticker,
    });
    const { iconSrc, iconAlt } = await resolveStickerRowIcon({
      api,
      stickerId,
      stickerBookSvgUrl,
    });

    const displayedProgress = stickerRowContext.shouldShowCompletedRow
      ? STICKER_PROGRESS_TOTAL
      : currentProgress;

    return buildBaseStickerRow(displayedProgress, {
      iconSrc,
      iconAlt,
      completed: stickerRowContext.shouldShowCompletedRow,
      animateCompletion: shouldAnimateStickerCompletionRow(
        studentId,
        stickerRowContext,
        displayedProgress,
      ),
    });
  } catch {
    return buildBaseStickerRow(currentProgress);
  }
};

export const buildScoreCardProgressRows = async ({
  api,
  student,
  studentId,
  completedCourseId,
  completedLessonId,
  animateDailyReward = false,
}: BuildScoreCardProgressRowsParams): Promise<ScoreCardProgressRowData[]> => {
  const stickerRow = await buildStickerRow({
    api,
    student,
    studentId,
    completedCourseId,
    completedLessonId,
  });

  const shouldAnimateDailyReward = shouldAnimateDailyRewardRow(
    student,
    studentId,
    animateDailyReward,
  );

  return [buildDailyRewardRow(shouldAnimateDailyReward), stickerRow].filter(
    (row): row is ScoreCardProgressRowData => Boolean(row),
  );
};
