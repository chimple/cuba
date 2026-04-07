import React, { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { t } from 'i18next';
import './StickerBookPreviewModal.css';
import StickerBookPreviewStage from './StickerBookPreviewStage';
import StickerBookPreviewFooter from './StickerBookPreviewFooter';
import StickerBookSaveModal from '../stickerBook/StickerBookSaveModal';
import StickerBookToast from '../stickerBook/StickerBookToast';
import StickerBookCompletionModal from './StickerBookCompletionModal';
import AudioButton from '../common/AudioButton';
import { AudioUtil } from '../../utility/AudioUtil';
import {
  useStickerBookPreviewModalLogic,
  type StickerBookModalData,
  type StickerBookPreviewMode,
  type StickerBookPreviewVariant,
} from './StickerBookPreviewModal.logic';

const STICKER_BOOK_POPUP_SOUND_EFFECT_URL =
  '/assets/audios/common/generic_sound_effect.mp3';

async function playStickerBookPopupAudio(
  folder: string,
  clipName: string,
  fallbackText: string,
) {
  const audioUrl = await AudioUtil.getLocalizedAudioUrl(folder, clipName);

  return AudioUtil.playAudioOrTts({
    audioUrl,
    text: fallbackText,
  });
}

function getStickerBookAudioConfig(
  mode: StickerBookPreviewMode,
  variant: StickerBookPreviewVariant,
) {
  if (mode === 'completion') {
    return {
      folder: 'stickerbookThirdPopup',
      clipName: 'popup_all_stickers_collected',
    };
  }

  if (variant === 'drag_collect') {
    return {
      folder: 'stickerbookSecondPopup',
      clipName: 'popup_sticker_collected',
    };
  }

  return {
    folder: 'stickerbookFirstPopup',
    clipName: 'popup_current_sticker',
  };
}

interface StickerBookPreviewModalProps {
  data: StickerBookModalData;
  variant?: StickerBookPreviewVariant;
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
  mode?: StickerBookPreviewMode;
  launchMotion?: {
    offsetX: number;
    offsetY: number;
    startScale: number;
  } | null;
}

const StickerBookPreviewModal: FC<StickerBookPreviewModalProps> = ({
  data,
  variant = 'preview',
  onClose,
  mode = 'preview',
  launchMotion = null,
}) => {
  const [scale, setScale] = useState(1);
  const audioConfig = useMemo(
    () => getStickerBookAudioConfig(mode, variant),
    [mode, variant],
  );

  const fallbackText = useMemo(() => {
    if (mode === 'completion') {
      return t(
        'Congratulations! Your Stickerbook Page is complete! You can either save & share this page with your family & friends or start coloring this page.',
      );
    }

    if (variant === 'drag_collect') {
      return t('Yay! You have earned a sticker!');
    }

    return `${t('Finish the pathway & collect this')} ${
      data.nextStickerName || t('Sticker')
    }.`;
  }, [data.nextStickerName, mode, variant]);

  useEffect(() => {
    void AudioUtil.playAudioOrTts({
      audioUrl: STICKER_BOOK_POPUP_SOUND_EFFECT_URL,
      delayMs: 300,
      onCompleteDelayMs: 300,
      onComplete: () => {
        void playStickerBookPopupAudio(
          audioConfig.folder,
          audioConfig.clipName,
          fallbackText,
        );
      },
    });

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [audioConfig.clipName, audioConfig.folder, fallbackText]);

  const handleReplayAudio = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void playStickerBookPopupAudio(
      audioConfig.folder,
      audioConfig.clipName,
      fallbackText,
    );
  };

  const handleClose = (
    reason: 'close_button' | 'backdrop' | 'acknowledge_button',
  ) => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onClose(reason);
  };

  useEffect(() => {
    const calculateScale = () => {
      //Desktop default values: 46rem width (736px), 39rem height (~624px)

      const baseWidth = 736;
      const baseHeight = 624;

      const maxWidth = window.innerWidth * 0.96;
      const maxHeight = window.innerHeight * 0.92;

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
  } = useStickerBookPreviewModalLogic({
    data,
    variant,
    onClose,
    mode,
    scale,
  });

  if (isCompletionMode) {
    return (
      <>
        {!showSaveModal && !isSaving && (
          <StickerBookCompletionModal
            svgMarkup={sceneSvgMarkup}
            isSaving={isSaving}
            bookSvgRef={bookSvgRef}
            onClose={() => handleClose('close_button')}
            onBackdropClose={() => handleClose('backdrop')}
            onReplayAudio={handleReplayAudio}
            onSave={handleSave}
            onPaint={handlePaint}
          />
        )}
        <StickerBookSaveModal
          open={showSaveModal}
          svgMarkup={savedSvgMarkup}
          onClose={closeCompletionSaveModal}
          onAnimationComplete={handleSaveAndShare}
          autoClose={false}
        />
        <StickerBookToast
          isOpen={showSaveToast}
          text={t(
            'Yay! Your creation is saved, share it with your family & friends!',
          )}
          image="/assets/icons/Confirmation.svg"
          duration={4000}
          onClose={closeSaveToast}
        />
      </>
    );
  }

  return (
    <div
      className="StickerBookPreviewModal-overlay"
      onClick={(event) => {
        handleOverlayClick(event);
        if (event.target === event.currentTarget) {
          void AudioUtil.stopAudioUrlOrTtsPlayback();
        }
      }}
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
        <div className="StickerBookPreviewModal-shell">
          <div
            className={`StickerBookPreviewModal-modal ${
              isDragVariant ? 'StickerBookPreviewModal-modal--drag' : ''
            } ${isFlyingOut ? 'StickerBookPreviewModal-modal--flyout' : ''}`}
            style={
              launchMotion
                ? ({
                    '--launch-offset-x': `${launchMotion.offsetX / scale}px`,
                    '--launch-offset-y': `${launchMotion.offsetY / scale}px`,
                    '--launch-start-scale': `${launchMotion.startScale / scale}`,
                  } as React.CSSProperties)
                : undefined
            }
            role="dialog"
            aria-modal="true"
            data-testid="StickerBookPreviewModal-modal"
          >
            <div className="StickerBookPreviewModal-audio-button">
              <AudioButton
                className="StickerBookPreviewModal-audio-button-control"
                backgroundColor="#ffffff"
                onClick={handleReplayAudio}
                ariaLabel={String(t('Replay audio'))}
                size="3.6rem"
              />
            </div>
            <button
              className="StickerBookPreviewModal-close"
              onClick={() => handleClose('close_button')}
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
              showDragSticker={showDragSticker}
              isDragging={isDragging}
              isDropSuccessful={isDropSuccessful}
              dragStickerPos={dragStickerPos}
              dragStickerSize={dragStickerSize}
              nextStickerImage={renderData.nextStickerImage}
              nextStickerName={renderData.nextStickerName}
              sceneSvg={sceneSvg}
              bookSvgRef={bookSvgRef}
              setFrameElement={setFrameElement}
              getSlotRectInFrame={getSlotRectInFrame}
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
      <StickerBookSaveModal
        open={showSaveModal}
        svgMarkup={savedSvgMarkup}
        onClose={closeCompletionSaveModal}
        onAnimationComplete={handleSaveAndShare}
      />
      <StickerBookToast
        isOpen={showSaveToast}
        text={t(
          'Yay! Your creation is saved, share it with your family & friends!',
        )}
        image="/assets/icons/Confirmation.svg"
        duration={4000}
        onClose={closeSaveToast}
      />
    </div>
  );
};

export default StickerBookPreviewModal;

export type { StickerBookModalData };
