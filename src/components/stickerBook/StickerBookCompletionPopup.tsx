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
import './StickerBookCompletionPopup.css';

export interface StickerBookCompletionData {
  source: 'learning_pathway' | 'homework_pathway';
  stickerBookId: string;
  stickerBookTitle: string;
  stickerBookSvgUrl: string;
  collectedStickerIds: string[];
  totalStickerCount: number;
}

interface StickerBookCompletionPopupProps {
  data: StickerBookCompletionData;
  onClose: (reason: 'backdrop' | 'close_button') => void;
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

const StickerBookCompletionPopup: React.FC<StickerBookCompletionPopupProps> = ({
  data,
  onClose,
}) => {
  const history = useHistory();
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const bookSvgRef = useRef<SVGSVGElement | null>(null);
  const shareTargetRef = useRef<HTMLDivElement | null>(null);
  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);

  const analyticsPayload = useMemo(
    () => ({
      user_id: Util.getCurrentStudent()?.id ?? 'unknown',
      source: data.source,
      sticker_book_id: data.stickerBookId,
      sticker_book_title: data.stickerBookTitle,
      collected_count: data.collectedStickerIds.length,
      total_stickers: data.totalStickerCount,
    }),
    [data],
  );

  useEffect(() => {
    let mounted = true;

    const loadSvg = async () => {
      setIsLoading(true);
      try {
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
        console.warn(
          'Failed to load completion sticker book SVG. Falling back.',
          error,
        );
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
      className="StickerBookCompletionPopup-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="StickerBookCompletionPopup-modal"
        role="dialog"
        aria-modal="true"
        aria-label={data.stickerBookTitle}
      >
        <button
          type="button"
          className="StickerBookCompletionPopup-close"
          onClick={() => onClose('close_button')}
          aria-label={String(t('Close'))}
        >
          <img src="pathwayAssets/menuCross.svg" alt="close-icon" />
        </button>

        <div
          ref={shareTargetRef}
          className="StickerBookCompletionPopup-book-frame"
        >
          {isLoading ? (
            <div className="StickerBookCompletionPopup-loading">
              {t('loading')}
            </div>
          ) : (
            <div className="StickerBookCompletionPopup-book">
              {parsedSvg && (
                <SVGScene
                  mode="preview"
                  sceneWidth="100%"
                  svgRefExternal={bookSvgRef}
                  collectedStickers={data.collectedStickerIds}
                  isDragEnabled={false}
                  stickerVisibilityMode="strict"
                  showUncollectedStickers={false}
                >
                  <InlineSvg svg={parsedSvg} />
                </SVGScene>
              )}
            </div>
          )}
        </div>

        <div className="StickerBookCompletionPopup-bottom-strip">
          <button
            type="button"
            className="StickerBookCompletionPopup-action StickerBookCompletionPopup-action--save"
            onClick={handleSave}
            disabled={isSaving}
          >
            <img src={cameraIcon} alt="" aria-hidden="true" />
            <span>{t('Save')}</span>
          </button>

          <button
            type="button"
            className="StickerBookCompletionPopup-action StickerBookCompletionPopup-action--paint"
            onClick={handlePaint}
          >
            <img src="assets/icons/PaintBucket.svg" alt="" aria-hidden="true" />
            <span>{t('Paint')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickerBookCompletionPopup;
