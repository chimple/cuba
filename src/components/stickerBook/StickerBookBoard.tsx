import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import { t } from 'i18next';
import { EVENTS } from '../../common/constants';
import { Util } from '../../utility/util';
import { SVGScene } from '../coloring/SVGScene';
import {
  ParsedSvg,
  parseSvg,
  ensureNavImage,
  sanitizeSvg,
} from '../common/SvgHelpers';
import NewBackButton from '../common/NewBackButton';
import './StickerBookBoard.css';
import logger from '../../utility/logger';
import StickerBookActions from './StickerBookActions';

type Props = {
  title: string;
  svgRaw: string | null;
  svgUrl?: string;
  collectedStickers: string[];
  nextStickerId?: string;
  isLocked: boolean;
  canPaint?: boolean;
  isStickerBookSaveEnabled: boolean;
  onSave?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onPaint?: () => void;
  isBookCompleted: boolean;
};

// Renders raw SVG markup inline so we can manipulate the DOM later.
const InlineSvg = React.forwardRef<
  SVGSVGElement,
  {
    svg: ParsedSvg;
    className?: string;
    style?: React.CSSProperties;
    hideUntilReady?: boolean;
    overrideAttrs?: Record<string, string>;
  }
>(({ svg, className, style, hideUntilReady, overrideAttrs }, ref) => {
  const localRef = useRef<SVGSVGElement | null>(null);

  // Expose the SVG element to parent components.
  React.useImperativeHandle(ref, () => localRef.current as SVGSVGElement, []);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    // Apply base attrs, but allow overrides (and skip inline styles).
    if (className) el.setAttribute('class', className);
    const overrideKeys = new Set(Object.keys(overrideAttrs ?? {}));
    Object.entries(svg.attrs).forEach(([name, value]) => {
      if (name === 'style') return;
      if (overrideKeys.has(name)) return;
      el.setAttribute(name, value);
    });
    Object.entries(overrideAttrs ?? {}).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
  }, [svg]);
  const safeSvg = sanitizeSvg(svg.inner);
  // Allow the caller to temporarily hide the SVG until styling is applied.
  const mergedStyle: React.CSSProperties = hideUntilReady
    ? { visibility: 'hidden', ...style }
    : style || {};
  return (
    <svg
      ref={localRef}
      className="sticker-book-svg"
      style={mergedStyle}
      dangerouslySetInnerHTML={{ __html: safeSvg }}
    />
  );
});

InlineSvg.displayName = 'InlineSvg';

const StickerBookBoard: React.FC<Props> = ({
  title,
  svgRaw,
  svgUrl,
  collectedStickers,
  nextStickerId,
  isLocked,
  canPaint = false,
  isStickerBookSaveEnabled,
  onSave,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onBack,
  onPaint,
  isBookCompleted,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boardSvgRef = useRef<SVGSVGElement | null>(null);
  const clipPathId = useId();
  const [boardSvgRaw, setBoardSvgRaw] = useState<string | null>(null);
  const [fallbackSvgRaw, setFallbackSvgRaw] = useState<string | null>(null);

  const logPayload = {
    user_id: Util.getCurrentStudent()?.id ?? null,
    book_title: title,
    collected_count: collectedStickers.length,
    next_sticker_id: nextStickerId ?? null,
  };

  const handlePrev = () => {
    Util.logEvent(EVENTS.STICKER_BOOK_PAGE_PREV, logPayload);
    onPrev();
  };

  const handleNext = () => {
    Util.logEvent(EVENTS.STICKER_BOOK_PAGE_NEXT, logPayload);
    onNext();
  };

  const handleBack = () => {
    Util.logEvent(EVENTS.STICKER_BOOK_PAGE_BACK, logPayload);
    onBack();
  };

  const handlePaint = () => {
    Util.logEvent(EVENTS.PAINT_MODE_BUTTON_TAP, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_title: title,
      page_path: window.location.pathname,
      source: 'sticker_book',
    });
    if (onPaint) onPaint();
  };

  const handleSave = () => {
    Util.logEvent(EVENTS.PAINT_SAVE_TAP, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_title: title,
      page_path: window.location.pathname,
      source: 'sticker_book',
    });
    Util.logEvent(EVENTS.PAINT_IMAGE_SAVED, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_title: title,
      page_path: window.location.pathname,
      source: 'sticker_book',
    });
    if (onSave) onSave();
  };

  const effectiveSvgRaw = svgRaw ?? fallbackSvgRaw;
  const parsedSvg = useMemo(() => {
    if (!effectiveSvgRaw) return null;
    return parseSvg(effectiveSvgRaw);
  }, [effectiveSvgRaw]);

  const parsedBoardSvg = useMemo(() => {
    if (!boardSvgRaw) return null;
    return parseSvg(boardSvgRaw);
  }, [boardSvgRaw]);
  const boardViewBox = parsedBoardSvg?.attrs?.viewBox;

  // Load board frame SVG once.
  useEffect(() => {
    let isMounted = true;
    fetch('/assets/icons/StickerBookBoard.svg')
      .then((res) => res.text())
      .then((text) => {
        if (isMounted) setBoardSvgRaw(text);
      })
      .catch((e) => logger.error('Failed to load board svg:', e));
    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback: ensure we have an SVG for locked mode even if parent hasn't cached it yet.
  useEffect(() => {
    let isMounted = true;
    if (svgRaw || !svgUrl) return;
    fetch(svgUrl)
      .then((res) => res.text())
      .then((text) => {
        if (isMounted) setFallbackSvgRaw(text);
      })
      .catch((e) => logger.error('Failed to load sticker book svg:', e));
    return () => {
      isMounted = false;
    };
  }, [svgRaw, svgUrl]);

  // Inject navigation arrows into the board SVG.
  useEffect(() => {
    const svg = boardSvgRef.current;
    if (!svg || !parsedBoardSvg) return;

    ensureNavImage(
      svg,
      'sticker-book-nav-left',
      canGoPrev
        ? '/assets/icons/StickerBookBackward.svg'
        : '/assets/icons/InactiveStickerBookBackward.svg',
      26,
      180,
      48,
      48,
      canGoPrev,
      handlePrev,
    );

    ensureNavImage(
      svg,
      'sticker-book-nav-right',
      canGoNext
        ? '/assets/icons/StickerBookForward.svg'
        : '/assets/icons/InactiveStickerBookForward.svg',
      609,
      180,
      48,
      48,
      canGoNext,
      handleNext,
    );
  }, [canGoPrev, canGoNext, handlePrev, handleNext, parsedBoardSvg]);

  return (
    <div id="sb-board-root" className="sticker-book-board-root">
      <div className="sticker-book-col sticker-book-col-left">
        <NewBackButton onClick={handleBack} />
      </div>

      <div id="sb-frame" className="sticker-book-frame sticker-book-col-middle">
        <div id="sb-board" className="sticker-book-board">
          {parsedBoardSvg && (
            <svg
              ref={boardSvgRef}
              className="sticker-book-board-canvas"
              viewBox={boardViewBox}
              preserveAspectRatio="xMidYMid meet"
            >
              <g
                className="sticker-book-board-bg"
                dangerouslySetInnerHTML={{
                  __html: sanitizeSvg(parsedBoardSvg.inner),
                }}
              />
              {/* Clip the sticker SVG to the board's inner window path. */}
              <defs>
                <clipPath id={clipPathId}>
                  <path d="M 587 57 C 590.314 57 593 59.6863 593 63 V 340.2 H 91 V 63 C 91 59.6863 93.6863 57 97 57 H 587 Z" />
                </clipPath>
              </defs>

              {/* Header/Title Area */}
              <foreignObject x="68" y="1" width="547" height="56">
                <div id="sb-board-title" className="sticker-book-board-title">
                  {t('STICKER BOOK')}: {title}
                </div>
              </foreignObject>

              {/* Place the sticker SVG in the board's coordinate space. */}
              {parsedSvg && (
                <g clipPath={`url(#${clipPathId})`}>
                  <SVGScene
                    mode={isLocked ? 'color' : 'drag'}
                    svgRefExternal={svgRef}
                    collectedStickers={collectedStickers}
                    nextStickerId={nextStickerId}
                    isDragEnabled={false}
                    stickerVisibilityMode={isLocked ? 'legacy' : 'strict'}
                    stickerVisibilityUseFilters={false}
                    colorModeUncolouredColor="#FFFFFF"
                    colorModeUncolouredStyle="outline"
                    lockedStickerOutline={isLocked}
                    // Match locked overlay tone with the board background.
                    lockedBackgroundColor={isLocked ? '#C0C0C0' : undefined}
                    showUncollectedStickers={true}
                  >
                    <InlineSvg
                      key={`${title}:${collectedStickers.join(',')}:${
                        nextStickerId ?? ''
                      }`}
                      svg={parsedSvg}
                      overrideAttrs={{
                        x: '92',
                        y: '57.8',
                        width: '500',
                        height: '282.2',
                        viewBox: '0 0 500 282.2',
                        preserveAspectRatio: 'xMidYMid meet',
                      }}
                      style={{ background: '#FFF' }}
                    />
                  </SVGScene>
                </g>
              )}
            </svg>
          )}

          {isLocked && (
            <div
              id="sb-disabled-layer"
              className="sticker-book-disabled-layer"
            />
          )}

          {isLocked && (
            <div id="sb-lock-overlay" className="sticker-book-lock-overlay">
              <div id="sb-lock-card" className="sticker-book-lock-card">
                <img
                  src="/assets/icons/LockIconStickerBook.svg"
                  alt="LockIconStickerBook"
                />
                <div id="sb-lock-text" className="sticker-book-lock-text">
                  {t('Complete the previous page to unlock this one.')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticker-book-col sticker-book-col-right">
        <StickerBookActions
          showPaint={canPaint}
          onSave={handleSave}
          onPaint={handlePaint}
          saveDisabled={!onSave}
          paintDisabled={!svgRaw || !onPaint}
          isStickerBookSaveEnabled={isStickerBookSaveEnabled}
          isBookCompleted={isBookCompleted}
        />
      </div>
    </div>
  );
};

export default StickerBookBoard;
