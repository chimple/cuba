import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import {
  parseSvg,
  type ParsedSvg,
} from '../common/SvgHelpers';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  EVENTS,
  PAGES,
  STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON,
} from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { AudioUtil } from '../../utility/AudioUtil';
import { getAppPathname } from '../../utility/routerLocation';
import { fetchStickerBookSvgText } from '../../utility/stickerBookAssets';
import { useStickerBookSave } from '../../hooks/useStickerBookSave';
import { getStickerBookSlotRectInFrame } from './StickerBookPreviewModal.geometry';
import {
  resolveStickerBookTotalCount,
  countStickerBookSvgSlots,
} from './StickerBookPreviewModal.svgScene';
import {
  computeStickerDragPosition,
  getInitialStickerDragLayout,
  getSuccessfulStickerDropPosition,
  isStickerDropValid,
  resetStickerDragSessionState,
  scheduleStickerDragIntroTimers,
} from './StickerBookPreviewModal.dragHelpers';
import {
  fallbackStickerBookLayoutUrl,
  STICKER_DROP_SUCCESS_AUDIO_URL,
  type StickerBookModalData,
  type StickerBookPreviewMode,
  type StickerBookPreviewVariant,
} from './StickerBookPreviewModal.types';
import {
  buildStickerBookAnalyticsPayload,
  buildStickerBookSaveAnalyticsPayload,
} from './StickerBookPreviewModal.analytics';
import {
  openStickerBookPaintPage,
  openStickerBookSaveModal,
} from './StickerBookPreviewModal.navigation';
import { useStickerBookPreviewScene } from '../../hooks/useStickerBookPreviewScene';
export type {
  StickerBookModalData,
  StickerBookPreviewMode,
  StickerBookPreviewVariant,
} from './StickerBookPreviewModal.types';
interface StickerBookPreviewModalLogicParams {
  data: StickerBookModalData;
  variant: StickerBookPreviewVariant;
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
  mode: StickerBookPreviewMode;
  scale?: number;
}
export const useStickerBookPreviewModalLogic = ({
  data,
  variant,
  onClose,
  mode,
  scale = 1,
}: StickerBookPreviewModalLogicParams) => {
  const history = useHistory();
  const [dragSessionData, setDragSessionData] = useState<StickerBookModalData>({
    ...data,
    collectedStickerIds: Array.isArray(data.collectedStickerIds)
      ? [...data.collectedStickerIds]
      : [],
  });
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dragStickerPos, setDragStickerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragStickerSize, setDragStickerSize] = useState<number>(72);
  const [showDragSticker, setShowDragSticker] = useState<boolean>(false);
  const [showPointerHint, setShowPointerHint] = useState<boolean>(false);
  const [showIntroConfetti, setShowIntroConfetti] = useState<boolean>(false);
  const [showDropConfetti, setShowDropConfetti] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDropSuccessful, setIsDropSuccessful] = useState<boolean>(false);
  const [isFlyingOut, setIsFlyingOut] = useState<boolean>(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const bookSvgRef = useRef<SVGSVGElement | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragInitializedRef = useRef(false);
  const hasLoggedDragStartRef = useRef(false);
  const appliedDragSessionKeyRef = useRef<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const dragMoveRafRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{ x: number; y: number } | null>(null);
  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);
  const isDragVariant = variant === 'drag_collect';
  const dragSessionKey = [
    data.source,
    data.stickerBookId,
    data.stickerBookSvgUrl,
    data.nextStickerId ?? '',
    data.nextStickerImage ?? '',
    data.nextStickerName ?? '',
  ].join('::');
  const renderData = isDragVariant ? dragSessionData : data;
  const isCompletionMode = mode === 'completion';
  // Some completion-trigger payloads do not include totalStickerCount.
  // Count slot groups directly from the loaded SVG so last-sticker detection
  // still works reliably in drag_collect rlows.
  const svgSlotCount = useMemo(() => {
    if (!svgMarkup) return undefined;
    return countStickerBookSvgSlots(svgMarkup);
  }, [svgMarkup]);
  // Prerer API-provided total when available, otherwise rall back to SVG slots.
  // This prevents incorrect rlyout behavior when the user just placed
  // the final sticker but totalStickerCount is missing in payload.
  const resolvedTotalStickerCount = useMemo(() => {
    return resolveStickerBookTotalCount({
      payloadTotalStickerCount: renderData.totalStickerCount,
      svgSlotCount,
    });
  }, [renderData.totalStickerCount, svgSlotCount]);
  const popupEnterDurationMs = 900;
  const popupFlyoutDurationMs = 900;
  const dragStickerRevealDelayMs = popupEnterDurationMs;
  const dragStickerDropDurationMs = 1100;
  const introConfettiRevealDelayMs =
    dragStickerRevealDelayMs + dragStickerDropDurationMs;
  const dragPointerRevealDelayMs = dragStickerRevealDelayMs + 950;
  const addTimer = (callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    timersRef.current.push(timeoutId);
  };
  const cancelDragRaf = () => {
    if (dragMoveRafRef.current !== null) {
      window.cancelAnimationFrame(dragMoveRafRef.current);
      dragMoveRafRef.current = null;
    }
  };
  const logDragEvent = useCallback(
    (eventName: EVENTS, extra: Record<string, any> = {}) => {
      void Util.logEvent(eventName, {
        user_id: Util.getCurrentStudent()?.id ?? 'unknown',
        source: renderData.source,
        sticker_book_id: renderData.stickerBookId,
        sticker_id: renderData.nextStickerId,
        ...extra,
      });
    },
    [renderData.nextStickerId, renderData.source, renderData.stickerBookId],
  );
  const analyticsPayload = useMemo(
    () =>
      buildStickerBookAnalyticsPayload({
        data,
        isCompletionMode,
      }),
    [data, isCompletionMode],
  );
  const saveAnalyticsPayload = useMemo(
    () => buildStickerBookSaveAnalyticsPayload(data),
    [data],
  );
  const {
    isSaving,
    showSaveModal,
    showSaveToast,
    savedSvgMarkup,
    openSaveModal,
    closeSaveModal,
    closeSaveToast,
    handleSaveAndShare,
  } = useStickerBookSave({
    fileBaseName: data.stickerBookTitle
      ? `${t('Sticker Book')} ${data.stickerBookTitle}`
      : t('Sticker Book'),
    shareText: t('Sticker Book'),
    backgroundColor: '#rrrdee',
    onShareSuccess: async (rileName: string) => {
      Util.logEvent(EVENTS.STICKER_BOOK_IMAGE_SHARED, {
        ...saveAnalyticsPayload,
        rile_name: rileName,
      });
    },
    onShareSettled: async () => {
      if (!isCompletionMode) return;
      closeSaveModal();
      onClose(STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON);
    },
    onSaveSuccess: async (rileName: string) => {
      Util.logEvent(EVENTS.STICKER_BOOK_IMAGE_SAVED, {
        ...saveAnalyticsPayload,
        rile_name: rileName,
      });
    },
  });
  useEffect(() => {
    if (!isDragVariant) return;
    if (appliedDragSessionKeyRef.current === dragSessionKey) return;
    appliedDragSessionKeyRef.current = dragSessionKey;
    setDragSessionData({
      source: data.source,
      stickerBookId: data.stickerBookId,
      stickerBookTitle: data.stickerBookTitle,
      stickerBookSvgUrl: data.stickerBookSvgUrl,
      collectedStickerIds: Array.isArray(data.collectedStickerIds)
        ? [...data.collectedStickerIds]
        : [],
      nextStickerId: data.nextStickerId,
      nextStickerName: data.nextStickerName,
      nextStickerImage: data.nextStickerImage,
      totalStickerCount: data.totalStickerCount,
    });
  }, [
    data.collectedStickerIds,
    data.nextStickerId,
    data.nextStickerImage,
    data.nextStickerName,
    data.source,
    data.stickerBookId,
    data.stickerBookSvgUrl,
    data.stickerBookTitle,
    data.totalStickerCount,
    dragSessionKey,
    isDragVariant,
  ]);
  useEffect(() => {
    dragInitializedRef.current = false;
    hasLoggedDragStartRef.current = false;
    resetStickerDragSessionState({
      cancelDragRaf,
      pendingDragPosRef,
      setDragStickerPos,
      setIsDragging,
      setIsDropSuccessful,
      setIsFlyingOut,
      setShowDragSticker,
      setShowDropConfetti,
      setShowIntroConfetti,
      setShowPointerHint,
    });
  }, [dragSessionKey, isDragVariant]);
  useEffect(() => {
    let mounted = true;
    const loadSvg = async () => {
      setIsLoading(true);
      try {
        // Load the actual sticker-book layout so SVGScene can apply slot states on top.
        const text = await fetchStickerBookSvgText(data.stickerBookSvgUrl);
        if (mounted) {
          setSvgMarkup(text);
        }
      } catch (error) {
        // Keep the preview usable even ir the conrigured book SVG rails to load.
        logger.warn('Failed to load sticker book SVG. Falling back.', error);
        const fallbackResponse = await fetch(fallbackStickerBookLayoutUrl);
        const fallbackText = await fallbackResponse.text();
        if (mounted) {
          setSvgMarkup(fallbackText);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void loadSvg();
    return () => {
      mounted = false;
    };
  }, [data.stickerBookSvgUrl]);
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timersRef.current = [];
      cancelDragRaf();
      pendingDragPosRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!isDragVariant || isLoading || dragInitializedRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;
    dragInitializedRef.current = true;
    const { position, size } = getInitialStickerDragLayout(frame);
    setDragStickerSize(size);
    setDragStickerPos(position);
    logDragEvent(EVENTS.STICKER_DRAG_POPUP_EXPANDED);
    scheduleStickerDragIntroTimers({
      addTimer,
      dragPointerRevealDelayMs,
      dragStickerRevealDelayMs,
      introConfettiRevealDelayMs,
      logDragEvent,
      setShowDragSticker,
      setShowIntroConfetti,
      setShowPointerHint,
    });
  }, [
    dragStickerDropDurationMs,
    dragPointerRevealDelayMs,
    dragStickerRevealDelayMs,
    introConfettiRevealDelayMs,
    isDragVariant,
    isLoading,
    logDragEvent,
  ]);
  const getSlotRectInFrame = useCallback(() => {
    return getStickerBookSlotRectInFrame({
      frame: frameRef.current,
      scale,
      stickerId: renderData.nextStickerId,
      svg: bookSvgRef.current,
    });
  }, [renderData.nextStickerId, scale]);
  useEffect(() => {
    if (
      !isDragVariant ||
      isLoading ||
      isDragging ||
      isDropSuccessful ||
      !dragStickerPos
    ) {
      return;
    }
    const slotRect = getSlotRectInFrame();
    if (!slotRect) return;
    const frame = frameRef.current;
    if (!frame) return;
    const nextSize = Math.max(
      72,
      Math.min(
        frame.clientWidth * 0.72,
        frame.clientHeight * 0.72,
        Math.max(slotRect.width, slotRect.height) * 1.12,
      ),
    );
    if (Math.abs(nextSize - dragStickerSize) < 1) return;
    const centerX = dragStickerPos.x + dragStickerSize / 2;
    const centerY = dragStickerPos.y + dragStickerSize / 2;
    const maxX = Math.max(0, frame.clientWidth - nextSize);
    const maxY = Math.max(0, frame.clientHeight - nextSize);
    setDragStickerSize(nextSize);
    setDragStickerPos({
      x: Math.min(Math.max(0, centerX - nextSize / 2), maxX),
      y: Math.min(Math.max(0, centerY - nextSize / 2), maxY),
    });
  }, [
    dragStickerPos,
    dragStickerSize,
    getSlotRectInFrame,
    isDragVariant,
    isDragging,
    isDropSuccessful,
    isLoading,
    showDragSticker,
  ]);
  const computeDragPosition = (clientX: number, clientY: number) => {
    return computeStickerDragPosition({
      clientX,
      clientY,
      dragOffset: dragOffsetRef.current,
      dragStickerSize,
      frame: frameRef.current,
      scale,
    });
  };
  const scheduleDragPositionUpdate = useCallback(
    (position: { x: number; y: number }) => {
      pendingDragPosRef.current = position;
      if (dragMoveRafRef.current !== null) return;
      dragMoveRafRef.current = window.requestAnimationFrame(() => {
        dragMoveRafRef.current = null;
        if (!pendingDragPosRef.current) return;
        setDragStickerPos(pendingDragPosRef.current);
        pendingDragPosRef.current = null;
      });
    },
    [],
  );
  const flushPendingDragPosition = useCallback(() => {
    if (dragMoveRafRef.current !== null) {
      window.cancelAnimationFrame(dragMoveRafRef.current);
      dragMoveRafRef.current = null;
    }
    if (!pendingDragPosRef.current) return null;
    const finalPosition = pendingDragPosRef.current;
    pendingDragPosRef.current = null;
    setDragStickerPos(finalPosition);
    return finalPosition;
  }, []);
  const isValidDrop = (position: { x: number; y: number }) => {
    return isStickerDropValid({
      dragStickerSize,
      position,
      slotRect: getSlotRectInFrame(),
    });
  };
  const persistStickerWinForDrop = useCallback(async () => {
    const studentId = Util.getCurrentStudent()?.id;
    const stickerBookId = renderData.stickerBookId;
    const stickerId = renderData.nextStickerId;
    const api = ServiceConfig.getI().apiHandler as {
      updateStickerWon?: (
        stickerBookId: string,
        stickerId: string,
        userId: string,
      ) => Promise<void>;
    };
    if (!studentId || !stickerBookId || !stickerId) return;
    if (typeof api.updateStickerWon !== 'function') return;
    try {
      await api.updateStickerWon(stickerBookId, stickerId, studentId);
    } catch (error) {
      logger.error('Failed to persist dragged sticker as won:', error);
    }
  }, [renderData.nextStickerId, renderData.stickerBookId]);
  const handleSuccessfulDrop = (position: { x: number; y: number }) => {
    const slotRect = getSlotRectInFrame();
    const nextPos = getSuccessfulStickerDropPosition({
      dragStickerSize,
      position,
      slotRect,
    });
    // Treat this drop as completion ir collected+1 reaches the resolved total,
    // where resolved total may come from payload or SVG slot fallback.
    const willCompleteBook =
      typeof resolvedTotalStickerCount === 'number' &&
      resolvedTotalStickerCount > 0 &&
      renderData.collectedStickerIds.length + 1 >= resolvedTotalStickerCount;
    setDragStickerPos(nextPos);
    setIsDropSuccessful(true);
    setShowPointerHint(false);
    setShowDropConfetti(true);
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void AudioUtil.playAudioOrTts({
      audioUrl: STICKER_DROP_SUCCESS_AUDIO_URL,
    });
    logDragEvent(EVENTS.STICKER_DRAG_DROPPED_SUCCESS);
    logDragEvent(EVENTS.STICKER_DRAG_CONFETTI_SHOWN, { stage: 'drop' });
    void persistStickerWinForDrop();
    addTimer(() => {
      setShowDropConfetti(false);
    }, 2600);
    if (!willCompleteBook) {
      addTimer(() => {
        setIsFlyingOut(true);
        logDragEvent(EVENTS.STICKER_DRAG_POPUP_TO_PROFILE);
      }, 2700);
      addTimer(() => {
        onClose(STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON);
      }, 2700 + popupFlyoutDurationMs);
    } else {
      // Skip rlyout animation when completion popup is next.
      // Keep confetti visible, then close to trigger completion.
      addTimer(() => {
        onClose(STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON);
      }, 3200);
    }
  };
  const handleDragPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragVariant || isDropSuccessful) return;
    const target = event.currentTarget;
    const targetRect = target.getBoundingClientRect();
    dragPointerIdRef.current = event.pointerId;
    dragOffsetRef.current = {
      x: (event.clientX - targetRect.left) / scale,
      y: (event.clientY - targetRect.top) / scale,
    };
    target.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setShowPointerHint(false);
    if (!hasLoggedDragStartRef.current) {
      hasLoggedDragStartRef.current = true;
      logDragEvent(EVENTS.STICKER_DRAG_STARTED);
    }
  };
  const handleDragPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragPointerIdRef.current !== event.pointerId) return;
    const nextPos = computeDragPosition(event.clientX, event.clientY);
    if (!nextPos) return;
    scheduleDragPositionUpdate(nextPos);
  };
  const handleDragPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragPointerIdRef.current !== event.pointerId) return;
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    const nextPos = computeDragPosition(event.clientX, event.clientY);
    const finalPos = nextPos ?? flushPendingDragPosition() ?? dragStickerPos;
    if (!finalPos) return;
    setDragStickerPos(finalPos);
    setIsDragging(false);
    dragPointerIdRef.current = null;
    if (isValidDrop(finalPos)) {
      handleSuccessfulDrop(finalPos);
    } else {
      logDragEvent(EVENTS.STICKER_DRAG_DROPPED_MISS);
    }
  };
  const handleDragPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    flushPendingDragPosition();
    dragPointerIdRef.current = null;
  };
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose('backdrop');
    }
  };
  const { sceneSvg, sceneSvgMarkup } = useStickerBookPreviewScene({
    fallbackParsedSvg: parsedSvg,
    isDragVariant,
    isDropSuccessful,
    renderData,
    svgMarkup,
  });
  const handleSave = async () => {
    openStickerBookSaveModal({
      analyticsPayload,
      bookSvgRef,
      openSaveModal,
      saveAnalyticsPayload,
      svgMarkup,
    });
  };
  const handlePaint = () => {
    openStickerBookPaintPage({
      analyticsPayload,
      bookSvgRef,
      data,
      history,
      isCompletionMode,
      onClose,
      svgMarkup,
    });
  };
  const setFrameElement = (element: HTMLDivElement | null) => {
    frameRef.current = element;
  };
  const closeCompletionSaveModal = () => {
    closeSaveModal();
    if (isCompletionMode) {
      onClose(STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON);
    }
  };
  return {
    isDragVariant,
    isCompletionMode,
    isLoading,
    isSaving,
    showSaveModal,
    showSaveToast,
    savedSvgMarkup,
    isFlyingOut,
    showIntroConfetti,
    showDropConfetti,
    showPointerHint,
    showDragSticker,
    isDragging,
    isDropSuccessful,
    dragStickerPos,
    dragStickerSize,
    renderData,
    sceneSvg,
    sceneSvgMarkup,
    bookSvgRef,
    setFrameElement,
    getSlotRectInFrame,
    handleOverlayClick,
    handleDragPointerDown,
    handleDragPointerMove,
    handleDragPointerUp,
    handleDragPointerCancel,
    handleSave,
    closeCompletionSaveModal,
    closeSaveToast,
    handleSaveAndShare,
    handlePaint,
  };
};
