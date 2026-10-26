import { useStickerBookPreviewStage } from '../../hooks/useStickerBookPreviewStage';

const StickerBookPreviewStage = (props: Parameters<typeof useStickerBookPreviewStage>[0]) => {
  const viewProps = useStickerBookPreviewStage(props);

  const {
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
  } = viewProps;

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

      <StaticBookScene
        isLoading={isLoading}
        sceneSvg={sceneSvg}
        bookSvgRef={bookSvgRef}
      />

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
                '--sticker-drop-distance': `${Math.max(0, dragStickerPos.y)}px`,
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
              className={`StickerBookPreviewModal-pointer-hint ${
                hintDeltaX > 0
                  ? 'StickerBookPreviewModal-pointer-hint--right'
                  : 'StickerBookPreviewModal-pointer-hint--left'
              }`}
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
