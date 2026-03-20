import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import { toBlob } from 'html-to-image';
import {
  applyStickerVisibilityStrict,
  parseSvg,
  type ParsedSvg,
} from '../common/SvgHelpers';
import { EVENTS, PAGES } from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';

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
}

const fallbackStickerBookLayoutUrl =
  'https://aeakbcdznktpsbrfsgys.supabase.co/storage/v1/object/public/sticker-books/newWhole_layout.svg';

function sanitizeFileName(value: string): string {
  return (
    value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') ||
    'sticker-book'
  );
}

export const useStickerBookPreviewModalLogic = ({
  data,
  variant,
  onClose,
  mode,
}: StickerBookPreviewModalLogicParams) => {
  const history = useHistory();
  const stableDataRef = useRef<StickerBookModalData>({
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
  const timersRef = useRef<number[]>([]);
  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);
  const isDragVariant = variant === 'drag_collect';
  const renderData = isDragVariant ? stableDataRef.current : data;

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const shareTargetRef = useRef<HTMLDivElement | null>(null);
  const isCompletionMode = mode === 'completion';

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

  useEffect(() => {
    let mounted = true;
    dragInitializedRef.current = false;
    hasLoggedDragStartRef.current = false;
    setDragStickerPos(null);
    setIsDropSuccessful(false);
    setIsDragging(false);
    setShowPointerHint(false);
    setShowIntroConfetti(false);
    setShowDropConfetti(false);
    setIsFlyingOut(false);

    const loadSvg = async () => {
      setIsLoading(true);
      try {
        // Load the actual sticker-book layout so SVGScene can apply slot states on top.
        const response = await fetch(renderData.stickerBookSvgUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch sticker book SVG: ${response.status}`,
          );
        }
        const text = await response.text();
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

    loadSvg();

    return () => {
      mounted = false;
    };
  }, [renderData.stickerBookSvgUrl]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isDragVariant || isLoading || dragInitializedRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;

    dragInitializedRef.current = true;
    const size = Math.max(56, Math.min(100, frame.clientWidth * 0.19));
    const initialX = frame.clientWidth / 2 - size / 2;
    const initialY = Math.max(56, frame.clientHeight * 0.6);

    setDragStickerSize(size);
    setDragStickerPos({ x: initialX, y: initialY });
    setShowPointerHint(true);
    setShowIntroConfetti(true);
    logDragEvent(EVENTS.STICKER_DRAG_POPUP_EXPANDED);
    logDragEvent(EVENTS.STICKER_DRAG_STICKER_SHOWN);
    logDragEvent(EVENTS.STICKER_DRAG_POINTER_SHOWN);
    logDragEvent(EVENTS.STICKER_DRAG_CONFETTI_SHOWN, { stage: 'intro' });

    addTimer(() => {
      setShowIntroConfetti(false);
    }, 1200);
  }, [isDragVariant, isLoading, logDragEvent]);

  const getSlotRectInFrame = () => {
    const frame = frameRef.current;
    const svg = bookSvgRef.current;
    if (!frame || !svg) return null;
    const slot = svg.querySelector(
      `[data-slot-id="${renderData.nextStickerId}"]`,
    ) as SVGGElement | null;
    if (!slot) return null;
    const frameRect = frame.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    return {
      x: slotRect.left - frameRect.left,
      y: slotRect.top - frameRect.top,
      width: slotRect.width,
      height: slotRect.height,
    };
  };

  const computeDragPosition = (clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const frameRect = frame.getBoundingClientRect();
    const x = clientX - frameRect.left - dragOffsetRef.current.x;
    const y = clientY - frameRect.top - dragOffsetRef.current.y;
    const maxX = Math.max(0, frameRect.width - dragStickerSize);
    const maxY = Math.max(0, frameRect.height - dragStickerSize);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  };

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

  const handleSuccessfulDrop = (position: { x: number; y: number }) => {
    const slotRect = getSlotRectInFrame();
    const nextPos = slotRect
      ? {
          x: slotRect.x + slotRect.width / 2 - dragStickerSize / 2,
          y: slotRect.y + slotRect.height / 2 - dragStickerSize / 2,
        }
      : position;

    setDragStickerPos(nextPos);
    setIsDropSuccessful(true);
    setShowPointerHint(false);
    setShowDropConfetti(true);

    logDragEvent(EVENTS.STICKER_DRAG_DROPPED_SUCCESS);
    logDragEvent(EVENTS.STICKER_DRAG_CONFETTI_SHOWN, { stage: 'drop' });

    addTimer(() => {
      setShowDropConfetti(false);
    }, 800);
    addTimer(() => {
      setIsFlyingOut(true);
      logDragEvent(EVENTS.STICKER_DRAG_POPUP_TO_PROFILE);
    }, 350);
    addTimer(() => {
      onClose('acknowledge_button');
    }, 900);
  };

  const handleDragPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragVariant || isDropSuccessful) return;
    const target = event.currentTarget;
    const targetRect = target.getBoundingClientRect();
    dragPointerIdRef.current = event.pointerId;
    dragOffsetRef.current = {
      x: event.clientX - targetRect.left,
      y: event.clientY - targetRect.top,
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
    setDragStickerPos(nextPos);
  };

  const handleDragPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragPointerIdRef.current !== event.pointerId) return;
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    const nextPos = computeDragPosition(event.clientX, event.clientY);
    const finalPos = nextPos ?? dragStickerPos;
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
    dragPointerIdRef.current = null;
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose('backdrop');
    }
  };

  const sanitizedCollectedStickers = useMemo(() => {
    if (isDragVariant) {
      // Per user request, we now show all previously collected stickers in drag
      // mode, instead of a clean board. The target sticker is still shown as
      // grey until it's successfully placed.
      return renderData.collectedStickerIds;
    }

    // In preview mode, we just show the next sticker on a clean board.
    return [];
  }, [isDragVariant, renderData.collectedStickerIds]);

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

  const handleSave = async () => {
    Util.logEvent(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE_CLICKED,
      analyticsPayload,
    );
    if (!shareTargetRef.current) return;

    setIsSaving(true);
    try {
      const blob = await toBlob(shareTargetRef.current, {
        cacheBust: true,
        backgroundColor: '#bee7de',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      });
      if (!blob) return;

      const file = new File(
        [blob],
        `${sanitizeFileName(data.stickerBookTitle)}.png`,
        { type: 'image/png' },
      );

      await Util.sendContentToAndroidOrWebShare(
        t('STICKER BOOK'),
        data.stickerBookTitle || t('STICKER BOOK'),
        undefined,
        [file],
      );
    } catch (error) {
      logger.error(
        '[StickerBook] Failed to share sticker book snapshot:',
        error,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaint = () => {
    Util.logEvent(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT_CLICKED,
      analyticsPayload,
    );
    history.push(PAGES.COLORING_BOARD, {
      stickerBookId: data.stickerBookId,
      stickerBookSvgUrl: data.stickerBookSvgUrl,
      collectedStickerIds: data.collectedStickerIds,
    });
  };

  const setFrameElement = (element: HTMLDivElement | null) => {
    frameRef.current = element;
    if (isCompletionMode) {
      shareTargetRef.current = element;
    }
  };

  return {
    isDragVariant,
    isCompletionMode,
    isLoading,
    isSaving,
    isFlyingOut,
    showIntroConfetti,
    showDropConfetti,
    showPointerHint,
    isDragging,
    isDropSuccessful,
    dragStickerPos,
    dragStickerSize,
    renderData,
    sceneSvg,
    bookSvgRef,
    setFrameElement,
    handleOverlayClick,
    handleDragPointerDown,
    handleDragPointerMove,
    handleDragPointerUp,
    handleDragPointerCancel,
    handleSave,
    handlePaint,
  };
};
