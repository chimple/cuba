import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { t } from 'i18next';
import './StickerBookPreviewModal.css';
import StickerBookPreviewStage from './StickerBookPreviewStage';
import StickerBookPreviewFooter from './StickerBookPreviewFooter';
import {
  useStickerBookPreviewModalLogic,
  type StickerBookModalData,
  type StickerBookPreviewMode,
  type StickerBookPreviewVariant,
} from './StickerBookPreviewModal.logic';

interface StickerBookPreviewModalProps {
  data: StickerBookModalData;
  variant?: StickerBookPreviewVariant;
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
  mode?: StickerBookPreviewMode;
}

const StickerBookPreviewModal: FC<StickerBookPreviewModalProps> = ({
  data,
  variant = 'preview',
  onClose,
  mode = 'preview',
}) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      // Desktop default values: 42.35rem width (~680px), 34rem height (~540px)
      const baseWidth = 680;
      const baseHeight = 540;

      const maxWidth = window.innerWidth * 0.94;
      const maxHeight = window.innerHeight * 0.9;

      const scaleX = maxWidth / baseWidth;
      const scaleY = maxHeight / baseHeight;
      const newScale = Math.min(1, scaleX, scaleY);
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const {
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
  } = useStickerBookPreviewModalLogic({
    data,
    variant,
    onClose,
    mode,
    scale,
  });

  return (
    <div
      className="StickerBookPreviewModal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
      data-testid="StickerBookPreviewModal-overlay"
    >
      <div
        className="StickerBookPreviewModal-scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
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
            aria-label={
              isCompletionMode
                ? String(t('Close'))
                : 'close-sticker-book-preview'
            }
            data-testid="StickerBookPreviewModal-close"
          >
            <img
              src="pathwayAssets/menuCross.svg"
              alt="close-icon"
              data-testid="StickerBookPreviewModal-close-icon"
            />
          </button>

          <StickerBookPreviewStage
            isDragVariant={isDragVariant}
            isLoading={isLoading}
            showIntroConfetti={showIntroConfetti}
            showDropConfetti={showDropConfetti}
            showPointerHint={showPointerHint}
            isDragging={isDragging}
            isDropSuccessful={isDropSuccessful}
            dragStickerPos={dragStickerPos}
            dragStickerSize={dragStickerSize}
            nextStickerImage={renderData.nextStickerImage}
            nextStickerName={renderData.nextStickerName}
            sceneSvg={sceneSvg}
            bookSvgRef={bookSvgRef}
            setFrameElement={setFrameElement}
            onDragPointerDown={handleDragPointerDown}
            onDragPointerMove={handleDragPointerMove}
            onDragPointerUp={handleDragPointerUp}
            onDragPointerCancel={handleDragPointerCancel}
          />

          <StickerBookPreviewFooter
            isCompletionMode={isCompletionMode}
            isDragVariant={isDragVariant}
            isSaving={isSaving}
            nextStickerImage={renderData.nextStickerImage}
            nextStickerName={renderData.nextStickerName}
            onSave={handleSave}
            onPaint={handlePaint}
          />
        </div>
      </div>
    </div>
  );
};

export default StickerBookPreviewModal;

export type { StickerBookModalData };
