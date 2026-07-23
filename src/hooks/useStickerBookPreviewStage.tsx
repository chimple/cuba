import React, { useEffect, useRef, useState } from 'react';
import { ParsedSvg } from '../components/common/SvgHelpers';
import StickerBookConfetti from '../components/learningPathway/StickerBookConfetti';
import { StaticBookScene } from '../components/learningPathway/StickerBookPreviewStaticBookScene';

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

export const useStickerBookPreviewStage = ({
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
}: StickerBookPreviewStageProps) => {
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
      // Target the nearest sensible point inside the placeholder while keeping
      // the guide stable even if the draggable sticker overlaps its bounds.
      const slotLeft = stableSlotRect.x;
      const slotRight = stableSlotRect.x + stableSlotRect.width;
      const slotTop = stableSlotRect.y;
      const slotBottom = stableSlotRect.y + stableSlotRect.height;
      const slotCenterX = stableSlotRect.x + stableSlotRect.width * 0.5;
      const slotCenterY = stableSlotRect.y + stableSlotRect.height * 0.54;
      const stickerGuideX = dragStickerPos.x + dragStickerSize * 0.5;
      const stickerGuideY = dragStickerPos.y + dragStickerSize * 0.38;
      const clampedGuideX = Math.min(
        Math.max(stickerGuideX, slotLeft),
        slotRight,
      );
      const clampedGuideY = Math.min(
        Math.max(stickerGuideY, slotTop),
        slotBottom,
      );
      const sideCandidates = [
        {
          x: slotLeft,
          y: clampedGuideY,
          distance: Math.abs(stickerGuideX - slotLeft),
        },
        {
          x: slotRight,
          y: clampedGuideY,
          distance: Math.abs(stickerGuideX - slotRight),
        },
        {
          x: clampedGuideX,
          y: slotTop,
          distance: Math.abs(stickerGuideY - slotTop),
        },
        {
          x: clampedGuideX,
          y: slotBottom,
          distance: Math.abs(stickerGuideY - slotBottom),
        },
      ];
      const horizontalOutside =
        stickerGuideX < slotLeft ? -1 : stickerGuideX > slotRight ? 1 : 0;
      const verticalOutside =
        stickerGuideY < slotTop ? -1 : stickerGuideY > slotBottom ? 1 : 0;
      let nearestSide = sideCandidates.reduce((best, candidate) =>
        candidate.distance < best.distance ? candidate : best,
      );

      if (horizontalOutside === 0 && verticalOutside === 0) {
        nearestSide = {
          x: slotCenterX,
          y: slotBottom,
          distance: Math.abs(stickerGuideY - slotBottom),
        };
      } else if (horizontalOutside !== 0 && verticalOutside === 0) {
        nearestSide =
          horizontalOutside < 0
            ? {
                x: slotLeft,
                y: slotCenterY,
                distance: Math.abs(stickerGuideX - slotLeft),
              }
            : {
                x: slotRight,
                y: slotCenterY,
                distance: Math.abs(stickerGuideX - slotRight),
              };
      } else if (verticalOutside !== 0 && horizontalOutside === 0) {
        nearestSide =
          verticalOutside < 0
            ? {
                x: slotCenterX,
                y: slotTop,
                distance: Math.abs(stickerGuideY - slotTop),
              }
            : {
                x: slotCenterX,
                y: slotBottom,
                distance: Math.abs(stickerGuideY - slotBottom),
              };
      }
      const slotGap = nearestSide.distance;
      const insetProgress = Math.min(
        1,
        slotGap /
          Math.max(Math.min(stableSlotRect.width, stableSlotRect.height), 1),
      );
      const slotAnchorInset = 0.64 + insetProgress * 0.2;
      const slotAnchorX =
        slotCenterX + (nearestSide.x - slotCenterX) * slotAnchorInset;
      const slotAnchorY =
        slotCenterY + (nearestSide.y - slotCenterY) * slotAnchorInset;

      const pointerTipOffsetX = pointerHintSize * 0.46;
      const pointerTipOffsetY = pointerHintSize * 0.76;

      // Start the autoplay loop on the draggable sticker and animate toward
      // the placeholder target.
      hintStartX = stickerGuideX - pointerTipOffsetX;
      hintStartY = stickerGuideY - pointerTipOffsetY;
      hintDeltaX = slotAnchorX - stickerGuideX;
      hintDeltaY = slotAnchorY - stickerGuideY;
    } else {
      hintStartX = dragStickerPos.x + dragStickerSize * 0.08;
      hintStartY = dragStickerPos.y - dragStickerSize * 0.72;
    }
  }
  return {
    StaticBookScene,
    StickerBookConfetti,
    bookSvgRef,
    dragStickerPos,
    dragStickerSize,
    hasPointerGuidePath,
    hintDeltaX,
    hintDeltaY,
    hintStartX,
    hintStartY,
    isDragVariant,
    isDragging,
    isDropSuccessful,
    isLoading,
    nextStickerImage,
    nextStickerName,
    onDragPointerCancel,
    onDragPointerDown,
    onDragPointerMove,
    onDragPointerUp,
    pointerHintSize,
    sceneSvg,
    setFrameElement,
    showDragSticker,
    showDropConfetti,
    showIntroConfetti,
    showPointerHint,
  };
};
