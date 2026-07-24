import { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal';
import { Util } from '../utility/util';
import logger from '../utility/logger';
import { getStickerImageFallbackFromBookSvg } from './pathwaySvgAssets';

interface PathwayStickerPayloadApi {
  getCurrentStickerBookWithProgress: (
    studentId: string,
  ) => Promise<{
    book?: {
      id: string;
      title?: string | null;
      svg_url?: string | null;
      total_stickers?: number | null;
      stickers_metadata?: unknown[] | null;
    } | null;
    progress?: {
      stickers_collected?: string[] | null;
      status?: string | null;
    } | null;
  } | null>;
  getNextWinnableSticker: (
    stickerBookId: string,
    studentId: string,
  ) => Promise<string | null>;
  getStickersByIds: (
    stickerIds: string[],
  ) => Promise<{ image?: string | null; name?: string | null }[] | null>;
}

export const getPathwayStickerPreviewPayload = async (
  api: PathwayStickerPayloadApi,
  forcedStickerId?: string,
  preAwardCollectedStickerIds?: string[],
  persistedBookContext?: {
    stickerBookId?: string | null;
    stickerBookTitle?: string | null;
    stickerBookSvgUrl?: string | null;
  } | null,
): Promise<StickerBookModalData | null> => {
  try {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent?.id) return null;

    let book: {
      id: string;
      title?: string | null;
      svg_url?: string | null;
    } | null = null;
    let progress: { stickers_collected?: string[] | null } | null = null;

    if (
      persistedBookContext?.stickerBookId &&
      persistedBookContext.stickerBookSvgUrl
    ) {
      book = {
        id: persistedBookContext.stickerBookId,
        title: persistedBookContext.stickerBookTitle ?? 'Sticker Book',
        svg_url: persistedBookContext.stickerBookSvgUrl,
      };
    } else {
      const currentBookWithProgress =
        await api.getCurrentStickerBookWithProgress(currentStudent.id);
      if (!currentBookWithProgress?.book) return null;
      book = currentBookWithProgress.book;
      progress = currentBookWithProgress.progress ?? null;
    }

    const collectedStickerIds = Array.isArray(preAwardCollectedStickerIds)
      ? preAwardCollectedStickerIds
      : (progress?.stickers_collected ?? []);
    const nextStickerId =
      forcedStickerId ??
      (await api.getNextWinnableSticker(book.id, currentStudent.id));
    if (!nextStickerId) return null;

    const visibleCollectedStickerIds = forcedStickerId
      ? collectedStickerIds.filter((id: string) => id !== forcedStickerId)
      : collectedStickerIds;

    const nextStickerDetails = await api.getStickersByIds([nextStickerId]);
    const nextSticker = nextStickerDetails?.[0];
    let nextStickerImage = nextSticker?.image || undefined;

    if (!nextStickerImage && book.svg_url) {
      try {
        const dataUrl = await getStickerImageFallbackFromBookSvg(
          book.svg_url,
          nextStickerId,
        );
        if (dataUrl) nextStickerImage = dataUrl;
      } catch (err) {
        logger.warn(
          '[StickerBook] Failed to build sticker preview image from book SVG',
          err,
        );
      }
    }

    return {
      source: 'learning_pathway',
      stickerBookId: book.id,
      stickerBookTitle: book.title || 'Sticker Book',
      stickerBookSvgUrl: book.svg_url || '',
      collectedStickerIds: visibleCollectedStickerIds,
      nextStickerId,
      nextStickerName: nextSticker?.name || 'Sticker',
      nextStickerImage,
    };
  } catch (error) {
    logger.error('Failed to build sticker preview payload:', error);
    return null;
  }
};

export async function getPathwayStickerCompletionPayload(
  api: PathwayStickerPayloadApi,
): Promise<StickerBookModalData | null> {
  try {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent?.id) return null;

    const currentBookWithProgress =
      await api.getCurrentStickerBookWithProgress(currentStudent.id);
    if (!currentBookWithProgress?.book) return null;

    const { book, progress } = currentBookWithProgress;
    const collectedStickerIds = progress?.stickers_collected ?? [];
    const totalStickerCount =
      book.total_stickers || book.stickers_metadata?.length || 0;
    const isCompleted =
      progress?.status === 'completed' ||
      (totalStickerCount > 0 && collectedStickerIds.length >= totalStickerCount);

    if (!isCompleted) return null;

    return {
      source: 'learning_pathway',
      stickerBookId: book.id,
      stickerBookTitle: book.title || 'Sticker Book',
      stickerBookSvgUrl: book.svg_url || '',
      collectedStickerIds,
      totalStickerCount,
    };
  } catch (error) {
    logger.error('Failed to build sticker completion payload:', error);
    return null;
  }
}

export function getPersistedPathwayStickerCompletionPayload(
  parsed: any,
): StickerBookModalData | null {
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
  };
}
