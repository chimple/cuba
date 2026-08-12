import { getAppPathname } from '../../utility/routerLocation';
import { Util } from '../../utility/util';
import type { StickerBookModalData } from './StickerBookPreviewModal.types';

export const buildStickerBookAnalyticsPayload = ({
  data,
  isCompletionMode,
}: {
  data: StickerBookModalData;
  isCompletionMode: boolean;
}) => ({
  user_id: Util.getCurrentStudent()?.id ?? 'unknown',
  source: data.source,
  sticker_book_id: data.stickerBookId,
  sticker_book_title: data.stickerBookTitle,
  collected_count: data.collectedStickerIds.length,
  total_stickers: isCompletionMode
    ? (data.totalStickerCount ?? data.collectedStickerIds.length)
    : data.collectedStickerIds.length,
});

export const buildStickerBookSaveAnalyticsPayload = (
  data: StickerBookModalData,
) => ({
  user_id: Util.getCurrentStudent()?.id ?? null,
  book_id: data.stickerBookId,
  book_title: data.stickerBookTitle,
  collected_count: data.collectedStickerIds.length,
  total_elements: data.totalStickerCount ?? data.collectedStickerIds.length,
  page_path: getAppPathname(),
});
