import React, { useEffect, useRef } from 'react';
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
  let hintStartX = 0;
  let hintStartY = 0;
  let hintDeltaX = 0;
  let hintDeltaY = 0;

  if (isDragVariant && showPointerHint && dragStickerPos) {
    hintStartX = dragStickerPos.x + dragStickerSize * 0.58;
    hintStartY = dragStickerPos.y + dragStickerSize * 0.6;
    const slotRect = getSlotRectInFrame();
    if (slotRect) {
      const slotCenterX = slotRect.x + slotRect.width / 2;
      const slotCenterY = slotRect.y + slotRect.height / 2;
      hintDeltaX = slotCenterX - hintStartX;
      hintDeltaY = slotCenterY - hintStartY;
    }
  }

  return (
    <div
      className="StickerBookPreviewModal-book-frame"
      data-testid="StickerBookPreviewModal-book-frame"
      ref={setFrameElement}
    >
      {isDragVariant && (showIntroConfetti || showDropConfetti) && (
        <StickerBookConfetti
          isDropConfetti={showDropConfetti}
          containerPos={
            showDropConfetti && dragStickerPos
              ? {
                  x: dragStickerPos.x,
                  y: dragStickerPos.y,
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
                '--sticker-drop-distance': `${dragStickerPos.y + dragStickerSize + 24}px`,
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
        (() => {
          return (
            <img
              src="/pathwayAssets/touchpointer.svg"
              alt="drag-pointer"
              className="StickerBookPreviewModal-pointer-hint"
              style={
                {
                  left: `${hintStartX}px`,
                  top: `${hintStartY}px`,
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
