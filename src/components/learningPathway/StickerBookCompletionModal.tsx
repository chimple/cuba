import React, { useEffect, useRef } from 'react';
import './StickerBookCompletionModal.css';
import '../stickerBook/StickerBookActions.css';
import StickerBookCompletionFooter from './StickerBookCompletionFooter';
import { t } from 'i18next';

interface Props {
  svgMarkup: string | null;
  isSaving: boolean;
  bookSvgRef: React.MutableRefObject<SVGSVGElement | null>;
  onClose: () => void;
  onBackdropClose?: () => void;
  onSave: () => void;
  onPaint: () => void;
}

export default function StickerBookCompletionModal({
  svgMarkup,
  isSaving,
  bookSvgRef,
  onClose,
  onBackdropClose,
  onSave,
  onPaint,
}: Props) {
  const svgAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bookSvgRef.current =
      (svgAreaRef.current?.querySelector('svg') as SVGSVGElement | null) ??
      null;

    return () => {
      bookSvgRef.current = null;
    };
  }, [bookSvgRef, svgMarkup]);

  return (
    <div
      className="StickerBookCompletionModal-overlay"
      onClick={onBackdropClose ?? onClose}
    >
      <div
        className="StickerBookCompletionModal-wrapper"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="StickerBookCompletionModal-container">
          <button
            className="StickerBookCompletionModal-close"
            onClick={onClose}
            aria-label={t('Close') || 'Close'}
            data-testid="StickerBookPreviewModal-close"
          >
            <img src="pathwayAssets/menuCross.svg" alt={t('Close') || ''} />
          </button>

          <div className="StickerBookCompletionModal-content">
            <div
              className="StickerBookCompletionModal-svg-area"
              ref={svgAreaRef}
              dangerouslySetInnerHTML={{ __html: svgMarkup || '' }}
            />

            <div className="StickerBookCompletionModal-footer">
              <StickerBookCompletionFooter
                isSaving={isSaving}
                onSave={onSave}
                onPaint={onPaint}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
