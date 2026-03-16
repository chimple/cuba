import React, { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import { toBlob } from 'html-to-image';
import fallbackStickerBookLayout from '../../assets/images/newWhole_layout.svg';
import cameraIcon from '../../assets/images/camera.svg';
import { EVENTS, PAGES } from '../../common/constants';
import { Util } from '../../utility/util';
import { SVGScene } from '../coloring/SVGScene';
import { ParsedSvg, parseSvg } from '../common/SvgHelpers';
import './StickerBookPreviewModal.css';

export interface StickerBookModalData {
  source: 'learning_pathway' | 'homework_pathway';
  stickerBookId: string;
  stickerBookTitle: string;
  stickerBookSvgUrl: string;
  collectedStickerIds: string[];
  nextStickerId?: string;
  nextStickerName?: string;
  nextStickerImage?: string;
  totalStickerCount?: number;
}

interface StickerBookPreviewModalProps {
  data: StickerBookModalData;
  onClose: (reason: 'close_button' | 'backdrop' | 'acknowledge_button') => void;
  mode?: 'preview' | 'completion';
}

const InlineSvg = React.forwardRef<
  SVGSVGElement,
  { svg: ParsedSvg; className?: string }
>(({ svg, className }, ref) => {
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
  }, [svg, className]);

  return <svg ref={localRef} dangerouslySetInnerHTML={{ __html: svg.inner }} />;
});

InlineSvg.displayName = 'InlineSvg';

function sanitizeFileName(value: string): string {
  return (
    value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') ||
    'sticker-book'
  );
}

const StickerBookPreviewModal: React.FC<StickerBookPreviewModalProps> = ({
  data,
  onClose,
  mode = 'preview',
}) => {
  const history = useHistory();
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const bookSvgRef = useRef<SVGSVGElement | null>(null);
  const shareTargetRef = useRef<HTMLDivElement | null>(null);
  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);
  const isCompletionMode = mode === 'completion';

  const analyticsPayload = useMemo(
    () => ({
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: data.source,
      sticker_book_id: data.stickerBookId,
      sticker_book_title: data.stickerBookTitle,
      collected_count: data.collectedStickerIds.length,
      total_stickers: isCompletionMode
        ? (data.totalStickerCount ?? data.collectedStickerIds.length)
        : data.collectedStickerIds.length,
    }),
    [data, isCompletionMode],
  );

  useEffect(() => {
    let mounted = true;

    const loadSvg = async () => {
      setIsLoading(true);
      try {
        // Load the actual sticker-book layout so SVGScene can apply slot states on top.
        const response = await fetch(data.stickerBookSvgUrl);
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
  }, [data.stickerBookSvgUrl]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose('backdrop');
    }
  };

  const handleSave = async () => {
    Util.logEvent(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE_CLICKED,
      analyticsPayload,
    );
    if (!shareTargetRef.current) return;

    setIsSaving(true);
    try {
      const blob = await toBlob(shareTargetRef.current, {
        cacheBust: true,
        backgroundColor: '#bee7de',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      });
      if (!blob) return;

      const file = new File(
        [blob],
        `${sanitizeFileName(data.stickerBookTitle)}.png`,
        { type: 'image/png' },
      );

      await Util.sendContentToAndroidOrWebShare(
        t('STICKER BOOK'),
        data.stickerBookTitle || t('STICKER BOOK'),
        undefined,
        [file],
      );
    } catch (error) {
      console.error(
        '[StickerBook] Failed to share sticker book snapshot:',
        error,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaint = () => {
    Util.logEvent(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT_CLICKED,
      analyticsPayload,
    );
    history.push(PAGES.COLORING_BOARD, {
      stickerBookId: data.stickerBookId,
      stickerBookSvgUrl: data.stickerBookSvgUrl,
      collectedStickerIds: data.collectedStickerIds,
    });
  };

  return (
    <div
      className="StickerBookPreviewModal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
      data-testid="StickerBookPreviewModal-overlay"
    >
      <div
        className="StickerBookPreviewModal-modal"
        role="dialog"
        aria-modal="true"
        data-testid="StickerBookPreviewModal-modal"
      >
        <button
          className="StickerBookPreviewModal-close"
          onClick={() => onClose('close_button')}
          aria-label={
            isCompletionMode ? String(t('Close')) : 'close-sticker-book-preview'
          }
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
          data-testid="StickerBookPreviewModal-book-frame"
          ref={isCompletionMode ? shareTargetRef : undefined}
        >
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
              {parsedSvg && (
                <SVGScene
                  mode="preview"
                  sceneWidth="100%"
                  svgRefExternal={bookSvgRef}
                  collectedStickers={data.collectedStickerIds}
                  nextStickerId={
                    isCompletionMode ? undefined : data.nextStickerId
                  }
                  isDragEnabled={false}
                  stickerVisibilityMode="strict"
                  showUncollectedStickers={!isCompletionMode}
                >
                  <InlineSvg svg={parsedSvg} />
                </SVGScene>
              )}
            </div>
          )}
        </div>

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
                onClick={handleSave}
                disabled={isSaving}
                data-testid="StickerBookPreviewModal-save"
              >
                <img src={cameraIcon} alt="" aria-hidden="true" />
                <span>{t('Save')}</span>
              </button>
              <button
                type="button"
                className="StickerBookPreviewModal-action StickerBookPreviewModal-action--paint"
                onClick={handlePaint}
                data-testid="StickerBookPreviewModal-paint"
              >
                <img
                  src="assets/icons/PaintBucket.svg"
                  alt=""
                  aria-hidden="true"
                />
                <span>{t('Paint')}</span>
              </button>
            </>
          ) : (
            <>
              <p
                className="StickerBookPreviewModal-helper-text"
                data-testid="StickerBookPreviewModal-helper-text"
              >
                {t('Finish the pathway & collect this')}
              </p>
              <img
                src={data.nextStickerImage || 'assets/icons/DefaultIcon.png'}
                alt={data.nextStickerName || 'Sticker'}
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
