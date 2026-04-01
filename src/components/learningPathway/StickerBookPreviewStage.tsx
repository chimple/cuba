import React, { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import { ParsedSvg } from '../common/SvgHelpers';
import StickerBookConfetti from './StickerBookConfetti';

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
    el.setAttribute('width', '100%');
    el.setAttribute('height', '100%');
    el.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    onReady?.();
  }, [svg, className, onReady]);

  return <svg ref={localRef} dangerouslySetInnerHTML={{ __html: svg.inner }} />;
});

InlineSvg.displayName = 'InlineSvg';

function areRectsClose(
  a: { x: number; y: number; width: number; height: number } | null,
  b: { x: number; y: number; width: number; height: number } | null,
) {
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

interface StickerBookPreviewStageProps {
  isDragVariant: boolean;
  isLoading: boolean;
  showIntroConfetti: boolean;
  showDropConfetti: boolean;
  showPointerHint: boolean;
  showDragSticker?: boolean;
  isDragging: boolean;
  isDropSuccessful: boolean;
  dragStickerPos: { x: number; y: number } | null;
  dragStickerSize: number;
  nextStickerImage?: string;
  nextStickerName?: string;
  sceneSvg: ParsedSvg | null;
  bookSvgRef: React.RefObject<SVGSVGElement | null>;
  setFrameElement: (element: HTMLDivElement | null) => void;
  getSlotRectInFrame?: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  onDragPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onDragPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onDragPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onDragPointerCancel: React.PointerEventHandler<HTMLDivElement>;
}

const StickerBookPreviewStage: React.FC<StickerBookPreviewStageProps> = ({
  isDragVariant,
  isLoading,
  showIntroConfetti,
  showDropConfetti,
  showPointerHint,
  showDragSticker = true,
  isDragging,
  isDropSuccessful,
  dragStickerPos,
  dragStickerSize,
  nextStickerImage,
  nextStickerName,
  sceneSvg,
  bookSvgRef,
  setFrameElement,
  getSlotRectInFrame = () => null,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerUp,
  onDragPointerCancel,
}) => {
  const pointerHintSize = Math.max(36, Math.min(52, dragStickerSize * 0.58));
  const [stableSlotRect, setStableSlotRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const pointerMeasureRunRef = useRef(0);
  let hintStartX = 0;
  let hintStartY = 0;
  let hintDeltaX = 0;
  let hintDeltaY = 0;

  useEffect(() => {
    if (!isDragVariant || !showPointerHint || !dragStickerPos) {
      setStableSlotRect(null);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let frameCount = 0;
    let stableCount = 0;
    let previousRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = null;
    const runId = pointerMeasureRunRef.current + 1;
    pointerMeasureRunRef.current = runId;
    setStableSlotRect(null);

    const measure = () => {
      if (cancelled || pointerMeasureRunRef.current !== runId) return;
      const nextRect = getSlotRectInFrame();
      frameCount += 1;

      if (nextRect && areRectsClose(previousRect, nextRect)) {
        stableCount += 1;
      } else {
        stableCount = 0;
      }

      previousRect = nextRect;

      if (nextRect && stableCount >= 1) {
        setStableSlotRect(nextRect);
        return;
      }

      if (frameCount >= 12) {
        setStableSlotRect(nextRect);
        return;
      }

      rafId = window.requestAnimationFrame(measure);
    };

    rafId = window.requestAnimationFrame(measure);

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [dragStickerPos, getSlotRectInFrame, isDragVariant, showPointerHint]);

  const hasPointerGuidePath = Boolean(stableSlotRect && dragStickerPos);

  if (isDragVariant && showPointerHint && dragStickerPos) {
    if (stableSlotRect) {
      // Anchor the hint to the actual slot center so every sticker points to
      // its own placeholder instead of relying on a generic top-left bias.
      const slotAnchorX = stableSlotRect.x + stableSlotRect.width * 0.5;
      const slotAnchorY = stableSlotRect.y + stableSlotRect.height * 0.54;
      const stickerGuideX = dragStickerPos.x + dragStickerSize * 0.5;
      const stickerGuideY = dragStickerPos.y + dragStickerSize * 0.38;
      const pointerTipOffsetX = pointerHintSize * 0.46;
      const pointerTipOffsetY = pointerHintSize * 0.76;

      hintStartX = slotAnchorX - pointerTipOffsetX;
      hintStartY = slotAnchorY - pointerTipOffsetY;
      hintDeltaX = stickerGuideX - slotAnchorX;
      hintDeltaY = stickerGuideY - slotAnchorY;
    } else {
      hintStartX = dragStickerPos.x + dragStickerSize * 0.08;
      hintStartY = dragStickerPos.y - dragStickerSize * 0.72;
    }
  }

  return (
    <div
      className="StickerBookPreviewModal-book-frame"
      data-testid="StickerBookPreviewModal-book-frame"
      ref={setFrameElement}
    >
      {isDragVariant && showIntroConfetti && (
        <StickerBookConfetti isDropConfetti={false} />
      )}

      {isDragVariant && showDropConfetti && (
        <StickerBookConfetti
          isDropConfetti={true}
          containerPos={
            dragStickerPos
              ? {
                  x: dragStickerPos.x + dragStickerSize * 0.5,
                  y: dragStickerPos.y + dragStickerSize,
                  size: dragStickerSize,
                }
              : undefined
          }
        />
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

      {isDragVariant &&
        showDragSticker &&
        dragStickerPos &&
        !isDropSuccessful && (
          <div
            className={`StickerBookPreviewModal-draggable-sticker ${
              isDragging
                ? 'StickerBookPreviewModal-draggable-sticker--active'
                : showPointerHint
                  ? 'StickerBookPreviewModal-draggable-sticker--hinting'
                  : ''
            }`}
            style={
              {
                width: `${dragStickerSize}px`,
                height: `${dragStickerSize}px`,
                transform: `translate(${dragStickerPos.x}px, ${dragStickerPos.y}px)${isDragging ? ' scale(1.06)' : ''}`,
                '--sticker-drop-distance': `${Math.max(48, dragStickerSize * 0.72)}px`,
                '--target-x': `${hintDeltaX}px`,
                '--target-y': `${hintDeltaY}px`,
              } as React.CSSProperties
            }
            onPointerDown={onDragPointerDown}
            onPointerMove={onDragPointerMove}
            onPointerUp={onDragPointerUp}
            onPointerCancel={onDragPointerCancel}
            data-testid="StickerBookPreviewModal-draggable-sticker"
          >
            <img
              src={nextStickerImage || 'assets/icons/DefaultIcon.png'}
              alt={nextStickerName}
            />
          </div>
        )}

      {isDragVariant &&
        showPointerHint &&
        dragStickerPos &&
        hasPointerGuidePath &&
        (() => {
          return (
            <img
              key={`${Math.round(hintStartX)}-${Math.round(hintStartY)}-${Math.round(hintDeltaX)}-${Math.round(hintDeltaY)}`}
              src="/pathwayAssets/touchpointer.svg"
              alt="drag-pointer"
              className="StickerBookPreviewModal-pointer-hint"
              style={
                {
                  left: `${hintStartX}px`,
                  top: `${hintStartY}px`,
                  '--pointer-size': `${pointerHintSize}px`,
                  '--target-x': `${hintDeltaX}px`,
                  '--target-y': `${hintDeltaY}px`,
                } as React.CSSProperties
              }
              data-testid="StickerBookPreviewModal-pointer-hint"
            />
          );
        })()}
    </div>
  );
};

export default StickerBookPreviewStage;
