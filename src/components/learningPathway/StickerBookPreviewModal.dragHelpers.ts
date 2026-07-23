import { EVENTS } from '../../common/constants';

export const getInitialStickerDragLayout = (frame: HTMLDivElement) => {
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

  return {
    position: { x: initialX, y: initialY },
    size,
  };
};

export const resetStickerDragSessionState = ({
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
}: {
  cancelDragRaf: () => void;
  pendingDragPosRef: { current: { x: number; y: number } | null };
  setDragStickerPos: (value: { x: number; y: number } | null) => void;
  setIsDragging: (value: boolean) => void;
  setIsDropSuccessful: (value: boolean) => void;
  setIsFlyingOut: (value: boolean) => void;
  setShowDragSticker: (value: boolean) => void;
  setShowDropConfetti: (value: boolean) => void;
  setShowIntroConfetti: (value: boolean) => void;
  setShowPointerHint: (value: boolean) => void;
}) => {
  cancelDragRaf();
  pendingDragPosRef.current = null;
  setDragStickerPos(null);
  setShowDragSticker(false);
  setIsDropSuccessful(false);
  setIsDragging(false);
  setShowPointerHint(false);
  setShowIntroConfetti(false);
  setShowDropConfetti(false);
  setIsFlyingOut(false);
};

export const computeStickerDragPosition = ({
  clientX,
  clientY,
  dragOffset,
  dragStickerSize,
  frame,
  scale,
}: {
  clientX: number;
  clientY: number;
  dragOffset: { x: number; y: number };
  dragStickerSize: number;
  frame: HTMLDivElement | null;
  scale: number;
}) => {
  if (!frame) return null;
  const frameRect = frame.getBoundingClientRect();
  const x = (clientX - frameRect.left) / scale - dragOffset.x;
  const y = (clientY - frameRect.top) / scale - dragOffset.y;
  const maxX = Math.max(0, frame.clientWidth - dragStickerSize);
  const maxY = Math.max(0, frame.clientHeight - dragStickerSize * 0.52);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(-dragStickerSize * 0.48, y), maxY),
  };
};

export const isStickerDropValid = ({
  dragStickerSize,
  position,
  slotRect,
}: {
  dragStickerSize: number;
  position: { x: number; y: number };
  slotRect: { x: number; y: number; width: number; height: number } | null;
}) => {
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

export const getSuccessfulStickerDropPosition = ({
  dragStickerSize,
  position,
  slotRect,
}: {
  dragStickerSize: number;
  position: { x: number; y: number };
  slotRect: { x: number; y: number; width: number; height: number } | null;
}) =>
  slotRect
    ? {
        x: slotRect.x + slotRect.width / 2 - dragStickerSize / 2,
        y: slotRect.y + slotRect.height / 2 - dragStickerSize / 2,
      }
    : position;

export const scheduleStickerDragIntroTimers = ({
  addTimer,
  dragPointerRevealDelayMs,
  dragStickerRevealDelayMs,
  introConfettiRevealDelayMs,
  logDragEvent,
  setShowDragSticker,
  setShowIntroConfetti,
  setShowPointerHint,
}: {
  addTimer: (callback: () => void, delayMs: number) => void;
  dragPointerRevealDelayMs: number;
  dragStickerRevealDelayMs: number;
  introConfettiRevealDelayMs: number;
  logDragEvent: (
    eventName: any,
    extra?: Record<string, any>,
  ) => void;
  setShowDragSticker: (value: boolean) => void;
  setShowIntroConfetti: (value: boolean) => void;
  setShowPointerHint: (value: boolean) => void;
}) => {
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
};
