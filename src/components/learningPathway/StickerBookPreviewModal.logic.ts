import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import {
  applyStickerVisibilityStrict,
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
import { fetchStickerBookSvgText } from '../../utility/stickerBookAssets';
import { useStickerBookSave } from '../../hooks/useStickerBookSave';
import { resolveStickerBookSvgUrl } from '../../utility/stickerBookAssets';

export interface StickerBookModalData {
  source: 'learning_pathway' | 'homework_pathway';
  stickerBookId: string;
  stickerBookTitle: string;
  stickerBookSvgUrl: string;
  collectedStickerIds: string[];
  nextStickerId?: string;
  nextStickerName?: string;
  nextStickerImage?: string;
  totalStickerCount?: number;
}

export type StickerBookPreviewVariant = 'preview' | 'drag_collect';
export type StickerBookPreviewMode = 'preview' | 'completion';

interface StickerBookPreviewModalLogicParams {
  data: StickerBookModalData;
  variant: StickerBookPreviewVariant;
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
  mode: StickerBookPreviewMode;
  scale?: number;
}

const fallbackStickerBookLayoutUrl =
  'https://aeakbcdznktpsbrfsgys.supabase.co/storage/v1/object/public/sticker-books/newWhole_layout.svg';

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
  // still works reliably in drag_collect flows.
  const svgSlotCount = useMemo(() => {
    if (!svgMarkup) return undefined;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
      return doc.querySelectorAll('[data-slot-id]').length || undefined;
    } catch (error) {
      logger.warn('Failed to count sticker slots from SVG.', error);
      return undefined;
    }
  }, [svgMarkup]);
  // Prefer API-provided total when available, otherwise fall back to SVG slots.
  // This prevents incorrect flyout behavior when the user just placed
  // the final sticker but totalStickerCount is missing in payload.
  const resolvedTotalStickerCount = useMemo(() => {
    if (
      typeof renderData.totalStickerCount === 'number' &&
      renderData.totalStickerCount > 0
    ) {
      return renderData.totalStickerCount;
    }
    if (svgSlotCount && svgSlotCount > 0) {
      return svgSlotCount;
    }
    return undefined;
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
    () => ({
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: data.source,
      sticker_book_id: data.stickerBookId,
      sticker_book_title: data.stickerBookTitle,
      collected_count: data.collectedStickerIds.length,
      total_stickers: isCompletionMode
        ? (data.totalStickerCount ?? data.collectedStickerIds.length)
        : data.collectedStickerIds.length,
    }),
    [data, isCompletionMode],
  );
  const saveAnalyticsPayload = useMemo(
    () => ({
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_id: data.stickerBookId,
      book_title: data.stickerBookTitle,
      collected_count: data.collectedStickerIds.length,
      total_elements: data.totalStickerCount ?? data.collectedStickerIds.length,
      page_path: window.location.pathname,
    }),
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
    backgroundColor: '#fffdee',
    onShareSuccess: async (fileName: string) => {
      Util.logEvent(EVENTS.STICKER_BOOK_IMAGE_SHARED, {
        ...saveAnalyticsPayload,
        file_name: fileName,
      });
    },
    onShareSettled: async () => {
      if (!isCompletionMode) return;
      closeSaveModal();
      onClose(STICKER_BOOK_PREVIEW_ACKNOWLEDGE_CLOSE_REASON);
    },
    onSaveSuccess: async (fileName: string) => {
      Util.logEvent(EVENTS.STICKER_BOOK_IMAGE_SAVED, {
        ...saveAnalyticsPayload,
        file_name: fileName,
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
    if (dragMoveRafRef.current !== null) {
      window.cancelAnimationFrame(dragMoveRafRef.current);
      dragMoveRafRef.current = null;
    }
    pendingDragPosRef.current = null;
    setDragStickerPos(null);
    setShowDragSticker(false);
    setIsDropSuccessful(false);
    setIsDragging(false);
    setShowPointerHint(false);
    setShowIntroConfetti(false);
    setShowDropConfetti(false);
    setIsFlyingOut(false);
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
        // Keep the preview usable even if the configured book SVG fails to load.
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
      if (dragMoveRafRef.current !== null) {
        window.cancelAnimationFrame(dragMoveRafRef.current);
        dragMoveRafRef.current = null;
      }
      pendingDragPosRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isDragVariant || isLoading || dragInitializedRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;

    dragInitializedRef.current = true;
    const size = Math.max(72, Math.min(140, frame.clientWidth * 0.28));
    const maxX = Math.max(0, frame.clientWidth - size);
    const maxY = Math.max(0, frame.clientHeight - size);
    const initialX = Math.min(
      Math.max(frame.clientWidth * 0.5 - size / 2, 0),
      maxX,
    );
    const initialY = Math.min(
      Math.max(frame.clientHeight - size - frame.clientHeight * 0.08, 0),
      maxY,
    );

    setDragStickerSize(size);
    setDragStickerPos({ x: initialX, y: initialY });
    logDragEvent(EVENTS.STICKER_DRAG_POPUP_EXPANDED);

    addTimer(() => {
      setShowDragSticker(true);
      logDragEvent(EVENTS.STICKER_DRAG_STICKER_SHOWN);
    }, dragStickerRevealDelayMs);

    addTimer(() => {
      setShowIntroConfetti(true);
      logDragEvent(EVENTS.STICKER_DRAG_CONFETTI_SHOWN, { stage: 'intro' });
    }, introConfettiRevealDelayMs);

    addTimer(() => {
      setShowPointerHint(true);
      logDragEvent(EVENTS.STICKER_DRAG_POINTER_SHOWN);
    }, dragPointerRevealDelayMs);

    addTimer(() => {
      setShowIntroConfetti(false);
    }, introConfettiRevealDelayMs + 3800);
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
    const frame = frameRef.current;
    const svg = bookSvgRef.current;
    if (!frame || !svg) return null;
    const slot = svg.querySelector(
      `[data-slot-id="${renderData.nextStickerId}"]`,
    ) as SVGGElement | null;
    if (!slot) return null;

    const candidateElements = [
      slot,
      ...Array.from(slot.querySelectorAll('*')),
    ].filter(
      (element): element is SVGGraphicsElement =>
        element instanceof SVGGraphicsElement &&
        typeof element.getBBox === 'function',
    );
    const measuredElement =
      candidateElements.find((element) => {
        try {
          const box = element.getBBox();
          return box.width > 0 || box.height > 0;
        } catch (error) {
          return false;
        }
      }) ?? (slot as SVGGraphicsElement);

    const fallbackRectForElement = (element: Element) => {
      const fallbackRect = element.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      return {
        x: (fallbackRect.left - frameRect.left) / scale,
        y: (fallbackRect.top - frameRect.top) / scale,
        width: fallbackRect.width / scale,
        height: fallbackRect.height / scale,
      };
    };

    if (
      !(measuredElement instanceof SVGGraphicsElement) ||
      typeof measuredElement.getScreenCTM !== 'function'
    ) {
      return fallbackRectForElement(slot);
    }

    let box: DOMRect | SVGRect;
    try {
      box = measuredElement.getBBox();
    } catch (error) {
      return fallbackRectForElement(slot);
    }

    const ctm = measuredElement.getScreenCTM();
    if (!ctm) {
      return fallbackRectForElement(measuredElement);
    }

    const point = svg.createSVGPoint();
    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x, y: box.y + box.height },
      { x: box.x + box.width, y: box.y + box.height },
    ].map(({ x, y }) => {
      point.x = x;
      point.y = y;
      const transformed = point.matrixTransform(ctm);
      return { x: transformed.x, y: transformed.y };
    });

    const frameRect = frame.getBoundingClientRect();
    const left = Math.min(...corners.map((corner) => corner.x));
    const right = Math.max(...corners.map((corner) => corner.x));
    const top = Math.min(...corners.map((corner) => corner.y));
    const bottom = Math.max(...corners.map((corner) => corner.y));

    return {
      x: (left - frameRect.left) / scale,
      y: (top - frameRect.top) / scale,
      width: (right - left) / scale,
      height: (bottom - top) / scale,
    };
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
    const frame = frameRef.current;
    if (!frame) return null;
    const frameRect = frame.getBoundingClientRect();
    const x = (clientX - frameRect.left) / scale - dragOffsetRef.current.x;
    const y = (clientY - frameRect.top) / scale - dragOffsetRef.current.y;
    const maxX = Math.max(0, frame.clientWidth - dragStickerSize);
    const maxY = Math.max(0, frame.clientHeight - dragStickerSize * 0.52);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(-dragStickerSize * 0.48, y), maxY),
    };
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
    const slotRect = getSlotRectInFrame();
    if (!slotRect) return false;

    const stickerCenterX = position.x + dragStickerSize / 2;
    const stickerCenterY = position.y + dragStickerSize / 2;
    const slotCenterX = slotRect.x + slotRect.width / 2;
    const slotCenterY = slotRect.y + slotRect.height / 2;
    const deltaX = stickerCenterX - slotCenterX;
    const deltaY = stickerCenterY - slotCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const threshold =
      Math.max(slotRect.width, slotRect.height) * 0.5 + dragStickerSize * 0.2;

    return distance <= threshold;
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
    const nextPos = slotRect
      ? {
          x: slotRect.x + slotRect.width / 2 - dragStickerSize / 2,
          y: slotRect.y + slotRect.height / 2 - dragStickerSize / 2,
        }
      : position;
    // Treat this drop as completion if collected+1 reaches the resolved total,
    // where resolved total may come from payload or SVG slot fallback.
    const willCompleteBook =
      typeof resolvedTotalStickerCount === 'number' &&
      resolvedTotalStickerCount > 0 &&
      renderData.collectedStickerIds.length + 1 >= resolvedTotalStickerCount;

    setDragStickerPos(nextPos);
    setIsDropSuccessful(true);
    setShowPointerHint(false);
    setShowDropConfetti(true);

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
      // Skip flyout animation when completion popup is next.
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

  const sanitizedCollectedStickers = useMemo(() => {
    // Keep previously collected stickers visible in both preview and drag
    // variants. The next sticker still renders as grey until collected.
    return renderData.collectedStickerIds;
  }, [renderData.collectedStickerIds]);

  const sceneCollectedStickers = useMemo(() => {
    if (isDragVariant && isDropSuccessful) {
      return Array.from(
        new Set(
          [...sanitizedCollectedStickers, renderData.nextStickerId].filter(
            Boolean,
          ),
        ),
      ) as string[];
    }
    return sanitizedCollectedStickers;
  }, [
    isDragVariant,
    isDropSuccessful,
    sanitizedCollectedStickers,
    renderData.nextStickerId,
  ]);
  const sceneNextStickerId =
    isDragVariant && isDropSuccessful ? undefined : renderData.nextStickerId;
  const sceneSvg = useMemo<ParsedSvg | null>(() => {
    if (!svgMarkup) return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
      const svg = doc.querySelector('svg') as SVGSVGElement | null;
      if (!svg) return null;

      applyStickerVisibilityStrict(
        svg,
        sceneCollectedStickers,
        sceneNextStickerId,
        true,
      );

      const serializedSvg = new XMLSerializer().serializeToString(svg);
      return parseSvg(serializedSvg);
    } catch (error) {
      logger.error('Failed to prepare sticker preview scene SVG:', error);
      return parsedSvg;
    }
  }, [parsedSvg, sceneCollectedStickers, sceneNextStickerId, svgMarkup]);

  const sceneSvgMarkup = useMemo<string | null>(() => {
    if (!svgMarkup) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
      const svg = doc.querySelector('svg') as SVGSVGElement | null;
      if (!svg) return null;

      applyStickerVisibilityStrict(
        svg,
        sceneCollectedStickers,
        sceneNextStickerId,
        true,
      );

      return new XMLSerializer().serializeToString(svg);
    } catch (error) {
      logger.error('Failed to serialize completion SVG:', error);
      return svgMarkup;
    }
  }, [sceneCollectedStickers, sceneNextStickerId, svgMarkup]);

  const handleSave = async () => {
    Util.logEvent(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE_CLICKED,
      analyticsPayload,
    );
    Util.logEvent(EVENTS.STICKER_BOOK_SAVE_CLICKED, saveAnalyticsPayload);

    const stickerBookSvg = bookSvgRef.current?.cloneNode(true);
    const serializedSvg = stickerBookSvg
      ? new XMLSerializer().serializeToString(stickerBookSvg)
      : svgMarkup || null;
    if (!serializedSvg) return;

    openSaveModal(serializedSvg);
  };

  const handlePaint = () => {
    Util.logEvent(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT_CLICKED,
      analyticsPayload,
    );
    const svgRaw = bookSvgRef.current
      ? new XMLSerializer().serializeToString(bookSvgRef.current)
      : svgMarkup || undefined;

    history.push(PAGES.COLORING_BOARD, {
      svgRaw,
      svgUrl: resolveStickerBookSvgUrl(data.stickerBookSvgUrl),
      artworkTitle: data.stickerBookTitle || t('Sticker Book'),
      returnTo: window.location.pathname,
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
