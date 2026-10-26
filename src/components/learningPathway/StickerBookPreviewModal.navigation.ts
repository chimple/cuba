import { parsePath } from 'history';
import type { History } from 'history';
import { t } from 'i18next';
import type { RefObject } from 'react';
import {
  EVENTS,
  PAGES,
  STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON,
} from '../../common/constants';
import { getAppPathname } from '../../utility/routerLocation';
import { resolveStickerBookSvgUrl } from '../../utility/stickerBookAssets';
import { Util } from '../../utility/util';
import type { StickerBookModalData } from './StickerBookPreviewModal.types';

export const openStickerBookPaintPage = ({
  analyticsPayload,
  bookSvgRef,
  data,
  history,
  isCompletionMode,
  onClose,
  svgMarkup,
}: {
  analyticsPayload: Record<string, any>;
  bookSvgRef: RefObject<SVGSVGElement | null>;
  data: StickerBookModalData;
  history: History;
  isCompletionMode: boolean;
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
  svgMarkup: string;
}) => {
  Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT, analyticsPayload);
  const svgRaw = bookSvgRef.current
    ? new XMLSerializer().serializeToString(bookSvgRef.current)
    : svgMarkup || undefined;

  if (isCompletionMode) {
    onClose(STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON);
  }

  history.push({
    ...parsePath(PAGES.COLORING_BOARD),
    state: {
      stickerBookId: data.stickerBookId,
      svgRaw,
      svgUrl: resolveStickerBookSvgUrl(data.stickerBookSvgUrl),
      artworkTitle: data.stickerBookTitle || t('Sticker Book'),
      returnTo: getAppPathname(),
    },
  });
};

export const openStickerBookSaveModal = ({
  analyticsPayload,
  bookSvgRef,
  openSaveModal,
  saveAnalyticsPayload,
  svgMarkup,
}: {
  analyticsPayload: Record<string, any>;
  bookSvgRef: RefObject<SVGSVGElement | null>;
  openSaveModal: (serializedSvg: string) => void;
  saveAnalyticsPayload: Record<string, any>;
  svgMarkup: string;
}) => {
  Util.logEvent(EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE, analyticsPayload);
  Util.logEvent(EVENTS.STICKER_BOOK_SAVE_CLICKED, saveAnalyticsPayload);

  const stickerBookSvg = bookSvgRef.current?.cloneNode(true);
  const serializedSvg = stickerBookSvg
    ? new XMLSerializer().serializeToString(stickerBookSvg)
    : svgMarkup || null;
  if (!serializedSvg) return;

  openSaveModal(serializedSvg);
};
