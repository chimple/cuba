import './ColoringBoard.css';
// Changes: added unique ids, prefixed svg frame class, localized UI strings.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSvgColoring } from './useSvgColoring';
import { SVGScene } from './SVGScene';
import ColorPalette from './ColorPalette';
import PaintTopBar from './PaintTopBar';
// import { ReactComponent as SceneSvg } from "../../assets/images/tinyfriends_original.svg";
import logger from '../../utility/logger';
import { parseSvg, ParsedSvg, sanitizeSvg } from '../common/SvgHelpers';
import { Util } from '../../utility/util';
import { EVENTS, PAGES } from '../../common/constants';
import PaintExitPopup from './PaintExitPopup';
import { t } from 'i18next';
import StickerBookActions from '../stickerBook/StickerBookActions';

type ColoringBoardRouteState = {
  svgUrl?: string;
  svgRaw?: string;
  returnTo?: string;
};

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

  const safeSvg = sanitizeSvg(svg.inner);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    // Avoid React reapplying innerHTML on every render which can wipe painted fills.
    el.innerHTML = safeSvg;
  }, [safeSvg]);

  return <svg ref={localRef} />;
});

InlineSvg.displayName = 'InlineSvg';

const ColoringBoard: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const coloring = useSvgColoring(svgRef);
  const history = useHistory();
  const location = useLocation<ColoringBoardRouteState | undefined>();

  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);

  useEffect(() => {
    let mounted = true;
    const state = location.state;

    const loadSvg = async () => {
      setIsLoading(true);
      try {
        if (state?.svgRaw) {
          if (mounted) setSvgMarkup(state.svgRaw);
          return;
        }

        if (state?.svgUrl) {
          const res = await fetch(state.svgUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch svg: ${res.status}`);
          }
          const text = await res.text();
          if (mounted) setSvgMarkup(text);
          return;
        }
      } catch (error) {
        logger.warn('Failed to load paint svg from navigation state.', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSvg();

    return () => {
      mounted = false;
    };
  }, [location.state]);

  useEffect(() => {
    Util.logEvent(EVENTS.PAINT_MODE_PAGE_VIEW, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      page_path: window.location.pathname,
      return_to: location.state?.returnTo ?? null,
    });
  }, [location.state]);

  const handleExit = () => {
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      history.replace(returnTo);
    } else {
      history.goBack();
    }
  };

  const handleSave = () => {
    Util.logEvent(EVENTS.PAINT_SAVE_TAP, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      page_path: window.location.pathname,
      source: PAGES.COLORING_BOARD,
    });
    Util.logEvent(EVENTS.PAINT_IMAGE_SAVED, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      page_path: window.location.pathname,
      source: PAGES.COLORING_BOARD,
    });
    logger.info('save');
  };

  return (
    <div
      id="coloring-board-root"
      className="coloring-board-paint-layout"
      style={{
        background:
          'url("/pathwayAssets/pathwayBackground.svg") no-repeat center/cover',
      }}
    >
      {/* 1) Close button */}
      <div id="coloring-board-top" className="coloring-board-top">
        <PaintTopBar
          onExit={() => {
            Util.logEvent(EVENTS.PAINT_EXIT_TAP, {
              user_id: Util.getCurrentStudent()?.id ?? null,
              page_path: window.location.pathname,
            });
            setShowExitConfirm(true);
          }}
        />
      </div>

      {/* 2) SVG frame */}
      <div
        id="coloring-board-frame-row-id"
        className="coloring-board-frame-row"
      >
        <div
          id="coloring-board-svg-frame-id"
          className="coloring-board-svg-frame"
        >
          {isLoading ? (
            <div
              id="coloring-board-loading"
              className="coloring-board-paint-loading"
            >
              {t('Loading...')}
            </div>
          ) : parsedSvg ? (
            <SVGScene
              mode="color"
              svgRefExternal={svgRef}
              colorModeUncolouredStyle="fill"
              colorModeUncolouredColor="#000000"
              sceneWidth="100%"
            >
              <InlineSvg svg={parsedSvg} />
            </SVGScene>
          ) : (
            <div
              id="coloring-board-empty"
              className="coloring-board-paint-loading"
            >
              {t('No paint artwork selected.')}
            </div>
          )}
        </div>
      </div>

      {/* 3) Save + Color palette */}
      <div id="coloring-board-controls" className="coloring-board-controls">
        <StickerBookActions
          showPaint={false}
          onSave={handleSave}
          onPaint={() => {}}
          paintDisabled={true}
        />

        <div id="coloring-board-tray" className="coloring-board-tray">
          <ColorPalette
            selected={coloring.selectedColor}
            onSelect={coloring.setSelectedColor}
          />
        </div>
      </div>

      <PaintExitPopup
        isOpen={showExitConfirm}
        onClose={() => {
          Util.logEvent(EVENTS.PAINT_EXIT_CLOSE_TAP, {
            user_id: Util.getCurrentStudent()?.id ?? null,
            page_path: window.location.pathname,
          });
          setShowExitConfirm(false);
        }}
        onStay={() => {
          Util.logEvent(EVENTS.PAINT_EXIT_STAY_TAP, {
            user_id: Util.getCurrentStudent()?.id ?? null,
            page_path: window.location.pathname,
          });
          setShowExitConfirm(false);
        }}
        onExit={() => {
          Util.logEvent(EVENTS.PAINT_EXIT_CONFIRM_TAP, {
            user_id: Util.getCurrentStudent()?.id ?? null,
            page_path: window.location.pathname,
          });
          handleExit();
        }}
      />
    </div>
  );
};

export default ColoringBoard;
