import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { getAppPathname } from '../../utility/routerLocation';

type Props = {
  title: string;
  svgRaw: string | null;
  collectedStickers: string[];
  nextStickerId?: string;
  isLocked: boolean;
  canPaint?: boolean;
  onSave?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onPaint?: () => void;
};

// Renders raw SVG markup inline so we can manipulate the DOM later.
const InlineSvg = React.forwardRef<
  SVGSVGElement,
  { svg: ParsedSvg; className?: string }
>(({ svg, className }, ref) => {
  const localRef = useRef<SVGSVGElement | null>(null);

  // Expose the SVG element to parent components.
  React.useImperativeHandle(ref, () => localRef.current as SVGSVGElement, []);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    if (className) el.setAttribute('class', className);
    Object.entries(svg.attrs).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });
  }, [svg]);
  const safeSvg = sanitizeSvg(svg.inner);
  return (
    <svg
      ref={localRef}
      className="sticker-book-svg"
      dangerouslySetInnerHTML={{ __html: safeSvg }}
    />
  );
});

InlineSvg.displayName = 'InlineSvg';

const StickerBookBoard: React.FC<Props> = ({
  title,
  svgRaw,
  collectedStickers,
  nextStickerId,
  isLocked,
  canPaint = false,
  onSave,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onBack,
  onPaint,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boardSvgRef = useRef<SVGSVGElement | null>(null);
  const [boardSvgRaw, setBoardSvgRaw] = useState<string | null>(null);

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
      page_path: getAppPathname(),
      source: 'sticker_book',
    });
    if (onPaint) onPaint();
  };

  const handleSave = () => {
    Util.logEvent(EVENTS.PAINT_SAVE_TAP, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_title: title,
      page_path: getAppPathname(),
      source: 'sticker_book',
    });
    Util.logEvent(EVENTS.PAINT_IMAGE_SAVED, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_title: title,
      page_path: getAppPathname(),
      source: 'sticker_book',
    });
    if (onSave) onSave();
  };

  const parsedSvg = useMemo(() => {
    if (!svgRaw) return null;
    return parseSvg(svgRaw);
  }, [svgRaw]);

  const parsedBoardSvg = useMemo(() => {
    if (!boardSvgRaw) return null;
    return parseSvg(boardSvgRaw);
  }, [boardSvgRaw]);

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
      606,
      180,
      48,
      48,
      canGoNext,
      handleNext,
    );
  }, [canGoPrev, canGoNext, handlePrev, handleNext, parsedBoardSvg]);

  return (
    <div id="sb-board-root" className="sticker-book-board-root">
      <div id="sb-top-row" className="sticker-book-top-row">
        <NewBackButton onClick={handleBack} />
      </div>

      <div id="sb-frame" className="sticker-book-frame">
        <div id="sb-board" className="sticker-book-board">
          <StickerBookActions
            showPaint={canPaint}
            onSave={handleSave}
            onPaint={handlePaint}
            saveDisabled={!onSave}
            paintDisabled={!svgRaw || !onPaint}
          />
          {parsedBoardSvg && (
            <InlineSvg
              svg={parsedBoardSvg}
              ref={boardSvgRef}
              className="sticker-book-board-bg"
            />
          )}
          <div id="sb-board-title" className="sticker-book-board-title">
            {t('STICKER BOOK')}: {title}
          </div>
          <div
            id="sb-board-content"
            className={`sticker-book-board-content ${
              isLocked ? 'sticker-book-board-content-disabled' : ''
            }`}
          >
            {isLocked && (
              <div
                id="sb-disabled-layer"
                className="sticker-book-disabled-layer"
              />
            )}
            {parsedSvg && (
              <SVGScene
                mode={isLocked ? 'color' : 'drag'}
                svgRefExternal={svgRef}
                collectedStickers={
                  isLocked
                    ? collectedStickers
                    : [...collectedStickers, nextStickerId].filter(
                        (id): id is string => Boolean(id),
                      )
                }
                nextStickerId={isLocked ? nextStickerId : undefined}
                isDragEnabled={false}
                stickerVisibilityMode={isLocked ? 'legacy' : 'strict'}
                colorModeUncolouredColor="#FFFFFF"
                colorModeUncolouredStyle="outline"
                lockedStickerOutline={isLocked}
                lockedBackgroundColor={isLocked ? '#C0C0C0' : undefined}
                showUncollectedStickers={true}
              >
                <InlineSvg
                  key={`${collectedStickers.join(',')}:${nextStickerId ?? ''}`}
                  svg={parsedSvg}
                />
              </SVGScene>
            )}
          </div>

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
    </div>
  );
};

export default StickerBookBoard;
