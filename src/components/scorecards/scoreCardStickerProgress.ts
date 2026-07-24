import {
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  STICKER_COMPLETION_ANIMATION_SEEN_KEY,
  STICKER_ICON_ALT,
  STICKER_PROGRESS_TOTAL,
  STICKER_ROW_ID,
  STICKER_ROW_LABEL,
} from '../../common/constants';
import { extractStickerSvg } from '../common/SvgHelpers';
import { fetchStickerBookSvgText } from '../../utility/stickerBookAssets';
import type { ScoreCardProgressRowData } from './ScoreCardProgressRows';
import { getDailyRewardDay, shouldAnimateOnce } from './scoreCardDailyReward';
import { getCurrentPathwayStickerProgress } from './scoreCardLearningPathProgress';
import type {
  AwardedStickerContext,
  BuildScoreCardProgressRowsParams,
  ScoreCardLogicApi,
  StickerBookSummary,
  StickerRowContext,
  StickerRowIcon,
} from './scoreCardTypes';

const stickerImageCache: Record<string, string> = {};

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

const appendUniqueStickerId = (stickerIds: string[], stickerId?: string) => {
  if (!stickerId || stickerIds.includes(stickerId)) return stickerIds;
  return [...stickerIds, stickerId];
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
  const completionCollectedStickerIds = normalizeStickerIds(
    completionPayload?.collectedStickerIds,
  );
  const previewCollectedStickerIds = appendUniqueStickerId(
    normalizeStickerIds(previewReward?.preAwardCollectedStickerIds),
    awardedStickerId,
  );
  const collectedStickerIds =
    completionCollectedStickerIds.length > 0
      ? completionCollectedStickerIds
      : previewCollectedStickerIds.length > 0
        ? previewCollectedStickerIds
        : undefined;
  const totalStickerCount =
    typeof completionPayload?.totalStickerCount === 'number'
      ? completionPayload.totalStickerCount
      : null;

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
    collectedStickerIds,
    totalStickerCount,
    completed: Boolean(
      totalStickerCount &&
      collectedStickerIds &&
      collectedStickerIds.length >= totalStickerCount,
    ),
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

    const stickerBookId = latestCompleted.row.sticker_book_id ?? null;
    let stickerBookSvgUrl: string | null = null;

    if (stickerBookId && typeof api.getAllStickerBooks === 'function') {
      try {
        const allBooks = await api.getAllStickerBooks();
        const matchedBook = allBooks.find((b) => b.id === stickerBookId);
        if (matchedBook?.svg_url) {
          stickerBookSvgUrl = matchedBook.svg_url;
        }
      } catch {
        // Ignore fetch errors, fallback to null
      }
    }

    return {
      awardedStickerId,
      createdAt: latestCompleted.row.updated_at ?? null,
      stickerBookId,
      stickerBookSvgUrl,
      collectedStickerIds: latestCompleted.collectedStickerIds,
      totalStickerCount: latestCompleted.collectedStickerIds.length,
      completed: true,
    };
  } catch {
    return null;
  }
};

const resolveStickerRowContext = async (
  api: ScoreCardLogicApi,
  studentId: string,
): Promise<StickerRowContext> => {
  const sessionAwardedSticker = getPendingAwardedStickerContext(studentId);
  const currentBookWithProgress =
    await api.getCurrentStickerBookWithProgress(studentId);
  const currentBook = currentBookWithProgress?.book ?? null;
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
    shouldShowAwardedSticker &&
    (!currentBook?.id ||
      pendingAwardedSticker?.completed ||
      (pendingAwardedSticker?.stickerBookId &&
        currentBook.id !== pendingAwardedSticker.stickerBookId)),
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
  totalProgress: number,
): boolean => {
  const awardedSticker = stickerRowContext.pendingAwardedSticker;

  if (
    currentProgress !== totalProgress ||
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

const resolveStickerBookProgressCounts = (
  _stickerRowContext: StickerRowContext,
  pathwayProgress: { current: number; total: number },
) => {
  if (_stickerRowContext.shouldShowCompletedRow) {
    return {
      current: pathwayProgress.total,
      total: pathwayProgress.total,
    };
  }

  return pathwayProgress;
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

export const buildStickerRow = async ({
  api,
  student,
  studentId,
  completedCourseId,
  completedLessonId,
  completedHomeworkIndex,
  showStickerProgress = true,
  countCompletedLessonTowardStickerProgress = true,
  allowZeroStickerProgress = false,
  stickerProgressCurrentOverride,
}: BuildScoreCardProgressRowsParams): Promise<ScoreCardProgressRowData | null> => {
  if (!showStickerProgress) return null;

  const pathwayProgress = getCurrentPathwayStickerProgress({
    student,
    completedCourseId,
    completedLessonId,
    completedHomeworkIndex,
    countCompletedLessonTowardStickerProgress,
    allowZeroStickerProgress,
    stickerProgressCurrentOverride,
  });

  if (!studentId) {
    return buildBaseStickerRow(pathwayProgress.current, {
      total: pathwayProgress.total,
    });
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

    const displayedProgress = resolveStickerBookProgressCounts(
      stickerRowContext,
      pathwayProgress,
    );

    return buildBaseStickerRow(displayedProgress.current, {
      total: displayedProgress.total,
      iconSrc,
      iconAlt,
      completed: stickerRowContext.shouldShowCompletedRow,
      animateCompletion: shouldAnimateStickerCompletionRow(
        studentId,
        stickerRowContext,
        displayedProgress.current,
        displayedProgress.total,
      ),
    });
  } catch {
    return buildBaseStickerRow(pathwayProgress.current, {
      total: pathwayProgress.total,
    });
  }
};
