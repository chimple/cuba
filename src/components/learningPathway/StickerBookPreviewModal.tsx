import React, { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'i18next';
import fallbackStickerBookLayout from '../../assets/images/newWhole_layout.svg';
import { EVENTS } from '../../common/constants';
import { Util } from '../../utility/util';
import {
  ParsedSvg,
  applyStickerVisibilityStrict,
  parseSvg,
} from '../common/SvgHelpers';
import './StickerBookPreviewModal.css';

export interface StickerBookPreviewData {
  source: 'learning_pathway' | 'homework_pathway';
  stickerBookId: string;
  stickerBookTitle: string;
  stickerBookSvgUrl: string;
  collectedStickerIds: string[];
  nextStickerId: string;
  nextStickerName: string;
  nextStickerImage?: string;
}

interface StickerBookPreviewModalProps {
  data: StickerBookPreviewData;
  variant?: 'preview' | 'drag_collect';
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
}

const InlineSvg = React.forwardRef<
  SVGSVGElement,
  { svg: ParsedSvg; className?: string; onReady?: () => void }
>(({ svg, className, onReady }, ref) => {
  const localRef = useRef<SVGSVGElement | null>(null);

  React.useImperativeHandle(ref, () => localRef.current as SVGSVGElement, []);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (className) el.setAttribute('class', className);
    Object.entries(svg.attrs).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
    // Keep popup rendering stable across sources: always fit frame.
    el.setAttribute('width', '100%');
    el.setAttribute('height', '100%');
    el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    onReady?.();
  }, [svg, className]);

  return <svg ref={localRef} dangerouslySetInnerHTML={{ __html: svg.inner }} />;
});

InlineSvg.displayName = 'InlineSvg';

const CONFETTI_PIECES = [
  { left: '6%', top: '18%', rotate: '-18deg', delay: '0ms', color: '#f2488f' },
  {
    left: '12%',
    top: '42%',
    rotate: '22deg',
    delay: '120ms',
    color: '#16c7d9',
  },
  {
    left: '18%',
    top: '62%',
    rotate: '-34deg',
    delay: '60ms',
    color: '#f7c436',
  },
  {
    left: '24%',
    top: '28%',
    rotate: '16deg',
    delay: '200ms',
    color: '#a348ff',
  },
  {
    left: '31%',
    top: '54%',
    rotate: '-12deg',
    delay: '80ms',
    color: '#69bf34',
  },
  {
    left: '38%',
    top: '16%',
    rotate: '28deg',
    delay: '140ms',
    color: '#f26122',
  },
  {
    left: '44%',
    top: '38%',
    rotate: '-24deg',
    delay: '40ms',
    color: '#f2488f',
  },
  {
    left: '49%',
    top: '68%',
    rotate: '12deg',
    delay: '160ms',
    color: '#16c7d9',
  },
  {
    left: '56%',
    top: '24%',
    rotate: '-30deg',
    delay: '20ms',
    color: '#f7c436',
  },
  {
    left: '61%',
    top: '48%',
    rotate: '18deg',
    delay: '180ms',
    color: '#a348ff',
  },
  {
    left: '67%',
    top: '14%',
    rotate: '-16deg',
    delay: '70ms',
    color: '#69bf34',
  },
  {
    left: '72%',
    top: '60%',
    rotate: '26deg',
    delay: '130ms',
    color: '#f26122',
  },
  {
    left: '78%',
    top: '30%',
    rotate: '-20deg',
    delay: '110ms',
    color: '#16c7d9',
  },
  {
    left: '84%',
    top: '50%',
    rotate: '14deg',
    delay: '170ms',
    color: '#f2488f',
  },
  {
    left: '89%',
    top: '22%',
    rotate: '-28deg',
    delay: '90ms',
    color: '#f7c436',
  },
  { left: '8%', top: '74%', rotate: '18deg', delay: '150ms', color: '#69bf34' },
  {
    left: '16%',
    top: '8%',
    rotate: '-22deg',
    delay: '210ms',
    color: '#16c7d9',
  },
  {
    left: '27%',
    top: '70%',
    rotate: '12deg',
    delay: '240ms',
    color: '#f26122',
  },
  {
    left: '35%',
    top: '46%',
    rotate: '-14deg',
    delay: '100ms',
    color: '#f7c436',
  },
  {
    left: '42%',
    top: '78%',
    rotate: '30deg',
    delay: '260ms',
    color: '#a348ff',
  },
  {
    left: '53%',
    top: '10%',
    rotate: '-18deg',
    delay: '70ms',
    color: '#f2488f',
  },
  {
    left: '58%',
    top: '58%',
    rotate: '24deg',
    delay: '190ms',
    color: '#69bf34',
  },
  {
    left: '65%',
    top: '74%',
    rotate: '-10deg',
    delay: '230ms',
    color: '#16c7d9',
  },
  { left: '74%', top: '8%', rotate: '16deg', delay: '250ms', color: '#f26122' },
  {
    left: '82%',
    top: '68%',
    rotate: '-26deg',
    delay: '140ms',
    color: '#a348ff',
  },
  {
    left: '92%',
    top: '42%',
    rotate: '20deg',
    delay: '220ms',
    color: '#69bf34',
  },
];

const CONFETTI_CLOUDS = [
  { left: '18%', top: '16%', size: '4.8rem', rotate: '-12deg' },
  { left: '52%', top: '25%', size: '5.6rem', rotate: '18deg' },
  { left: '78%', top: '18%', size: '5.2rem', rotate: '-8deg' },
  { left: '70%', top: '58%', size: '6rem', rotate: '10deg' },
  { left: '12%', top: '60%', size: '4.6rem', rotate: '14deg' },
];

const StickerBookPreviewModal: React.FC<StickerBookPreviewModalProps> = ({
  data,
  variant = 'preview',
  onClose,
}) => {
  const stableDataRef = useRef<StickerBookPreviewData>({
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

  const addTimer = (callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    timersRef.current.push(timeoutId);
  };

  const logDragEvent = (eventName: EVENTS, extra: Record<string, any> = {}) => {
    void Util.logEvent(eventName, {
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: renderData.source,
      sticker_book_id: renderData.stickerBookId,
      sticker_id: renderData.nextStickerId,
      ...extra,
    });
  };

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
        console.warn('Failed to load sticker book SVG. Falling back.', error);
        const fallbackResponse = await fetch(fallbackStickerBookLayout);
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
  }, [isDragVariant, isLoading]);

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

  const handleDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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

  const handleDragPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragPointerIdRef.current !== event.pointerId) return;
    const nextPos = computeDragPosition(event.clientX, event.clientY);
    if (!nextPos) return;
    setDragStickerPos(nextPos);
  };

  const handleDragPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
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

  const handleDragPointerCancel = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    dragPointerIdRef.current = null;
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
        new Set([...sanitizedCollectedStickers, renderData.nextStickerId]),
      );
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
  const sceneSvg = useMemo(() => {
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
      console.error('Failed to prepare sticker preview scene SVG:', error);
      return parsedSvg;
    }
  }, [parsedSvg, sceneCollectedStickers, sceneNextStickerId, svgMarkup]);

  return (
    <div
      className="StickerBookPreviewModal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
      data-testid="StickerBookPreviewModal-overlay"
    >
      <div
        className={`StickerBookPreviewModal-modal ${
          isDragVariant ? 'StickerBookPreviewModal-modal--drag' : ''
        } ${isFlyingOut ? 'StickerBookPreviewModal-modal--flyout' : ''}`}
        role="dialog"
        aria-modal="true"
        data-testid="StickerBookPreviewModal-modal"
      >
        <button
          className="StickerBookPreviewModal-close"
          onClick={() => onClose('close_button')}
          aria-label="close-sticker-book-preview"
          data-testid="StickerBookPreviewModal-close"
        >
          <img
            src="pathwayAssets/menuCross.svg"
            alt="close-icon"
            data-testid="StickerBookPreviewModal-close-icon"
          />
        </button>

        <div
          className="StickerBookPreviewModal-book-frame"
          ref={frameRef}
          data-testid="StickerBookPreviewModal-book-frame"
        >
          {isDragVariant && (showIntroConfetti || showDropConfetti) && (
            <div
              className={`StickerBookPreviewModal-confetti ${
                showDropConfetti ? 'StickerBookPreviewModal-confetti--drop' : ''
              }`}
              data-testid="StickerBookPreviewModal-confetti"
            >
              {CONFETTI_CLOUDS.map((cloud, index) => (
                <span
                  key={`cloud-${index}`}
                  className="StickerBookPreviewModal-confetti-cloud"
                  style={
                    {
                      '--cloud-left': cloud.left,
                      '--cloud-top': cloud.top,
                      '--cloud-size': cloud.size,
                      '--cloud-rotate': cloud.rotate,
                    } as React.CSSProperties
                  }
                />
              ))}
              {CONFETTI_PIECES.map((piece, index) => (
                <span
                  key={`piece-${index}`}
                  className="StickerBookPreviewModal-confetti-piece"
                  style={
                    {
                      '--piece-left': piece.left,
                      '--piece-top': piece.top,
                      '--piece-rotate': piece.rotate,
                      '--piece-delay': piece.delay,
                      '--piece-color': piece.color,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
          {isLoading ? (
            <div
              className="StickerBookPreviewModal-loading"
              data-testid="StickerBookPreviewModal-loading"
            >
              {t('Loading...')}
            </div>
          ) : (
            <div
              className="StickerBookPreviewModal-book"
              data-testid="StickerBookPreviewModal-book"
            >
              {sceneSvg && (
                <InlineSvg
                  svg={sceneSvg}
                  ref={bookSvgRef}
                  className="StickerBookPreviewModal-book-svg"
                />
              )}
            </div>
          )}

          {isDragVariant && dragStickerPos && !isDropSuccessful && (
            <div
              className={`StickerBookPreviewModal-draggable-sticker ${
                isDragging
                  ? 'StickerBookPreviewModal-draggable-sticker--active'
                  : ''
              }`}
              style={{
                width: `${dragStickerSize}px`,
                height: `${dragStickerSize}px`,
                transform: `translate(${dragStickerPos.x}px, ${dragStickerPos.y}px)`,
              }}
              onPointerDown={handleDragPointerDown}
              onPointerMove={handleDragPointerMove}
              onPointerUp={handleDragPointerUp}
              onPointerCancel={handleDragPointerCancel}
              data-testid="StickerBookPreviewModal-draggable-sticker"
            >
              <img
                src={
                  renderData.nextStickerImage || 'assets/icons/DefaultIcon.png'
                }
                alt={renderData.nextStickerName}
              />
            </div>
          )}

          {isDragVariant && showPointerHint && dragStickerPos && (
            <img
              src="/pathwayAssets/touchpointer.svg"
              alt="drag-pointer"
              className="StickerBookPreviewModal-pointer-hint"
              style={{
                left: `${dragStickerPos.x + dragStickerSize * 0.58}px`,
                top: `${dragStickerPos.y + dragStickerSize * 0.6}px`,
              }}
              data-testid="StickerBookPreviewModal-pointer-hint"
            />
          )}
        </div>

        <div
          className="StickerBookPreviewModal-bottom-strip"
          data-testid="StickerBookPreviewModal-bottom-strip"
        >
          <p
            className="StickerBookPreviewModal-helper-text"
            data-testid="StickerBookPreviewModal-helper-text"
          >
            {isDragVariant ? (
              <>
                <span className="StickerBookPreviewModal-celebration-icon">
                  🎉
                </span>
                {t('Yay! You have earned a sticker!')}
                <span className="StickerBookPreviewModal-celebration-icon">
                  🎉
                </span>
              </>
            ) : (
              t('Finish the pathway & collect this')
            )}
          </p>
          {!isDragVariant && (
            <>
              <img
                src={
                  renderData.nextStickerImage || 'assets/icons/DefaultIcon.png'
                }
                alt={renderData.nextStickerName}
                className="StickerBookPreviewModal-next-image"
                data-testid="StickerBookPreviewModal-next-image"
              />
              <p
                className="StickerBookPreviewModal-next-name"
                data-testid="StickerBookPreviewModal-next-name"
              >
                {t('sticker')}.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickerBookPreviewModal;
