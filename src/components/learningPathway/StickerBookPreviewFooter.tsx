import React from 'react';
import { t } from 'i18next';
import cameraIcon from '../../assets/images/camera.svg';

interface StickerBookPreviewFooterProps {
  isCompletionMode: boolean;
  isDragVariant: boolean;
  isSaving: boolean;
  nextStickerImage?: string;
  nextStickerName?: string;
  onSave: () => void;
  onPaint: () => void;
}

const StickerBookPreviewFooter: React.FC<StickerBookPreviewFooterProps> = ({
  isCompletionMode,
  isDragVariant,
  isSaving,
  nextStickerImage,
  nextStickerName,
  onSave,
  onPaint,
}) => {
  return (
    <div
      className={`StickerBookPreviewModal-bottom-strip${
        isCompletionMode
          ? ' StickerBookPreviewModal-bottom-strip--completion'
          : ''
      }`}
      data-testid="StickerBookPreviewModal-bottom-strip"
    >
      {isCompletionMode ? (
        <>
          <button
            type="button"
            className="StickerBookPreviewModal-action StickerBookPreviewModal-action--save"
            onClick={onSave}
            disabled={isSaving}
            data-testid="StickerBookPreviewModal-save"
          >
            <img src={cameraIcon} alt="" aria-hidden="true" />
            <span>{t('Save')}</span>
          </button>
          <button
            type="button"
            className="StickerBookPreviewModal-action StickerBookPreviewModal-action--paint"
            onClick={onPaint}
            data-testid="StickerBookPreviewModal-paint"
          >
            <img src="assets/icons/PaintBucket.svg" alt="" aria-hidden="true" />
            <span>{t('Paint')}</span>
          </button>
        </>
      ) : (
        <>
          <p
            className="StickerBookPreviewModal-helper-text"
            data-testid="StickerBookPreviewModal-helper-text"
          >
            {isDragVariant ? (
              <>
                <img
                  className="StickerBookPreviewModal-celebration-icon"
                  src="assets/3starconfetti.svg"
                  alt="celebrate"
                  style={{
                    width: '1.4em',
                    height: '1.4em',
                    verticalAlign: 'middle',
                    display: 'inline-block',
                  }}
                />
                {t('Yay! You have earned a sticker!')}
                <img
                  className="StickerBookPreviewModal-celebration-icon"
                  src="assets/3starconfetti.svg"
                  alt="celebrate"
                  style={{
                    width: '1.4em',
                    height: '1.4em',
                    verticalAlign: 'middle',
                    display: 'inline-block',
                    transform: 'scaleX(-1)',
                  }}
                />
              </>
            ) : (
              t('Finish the pathway & collect this')
            )}
          </p>

          {!isDragVariant && (
            <>
              <img
                src={nextStickerImage || 'assets/icons/DefaultIcon.png'}
                alt={nextStickerName || 'Sticker'}
                className="StickerBookPreviewModal-next-image"
                data-testid="StickerBookPreviewModal-next-image"
              />
              <p
                className="StickerBookPreviewModal-next-name"
                data-testid="StickerBookPreviewModal-next-name"
              >
                {nextStickerName || t('Sticker')}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StickerBookPreviewFooter;
