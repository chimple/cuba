import './ColoringBoard.css';
// Changes: added unique ids, prefixed svg frame class, localized UI strings.
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { App } from '@capacitor/app';
import { useHistory, useLocation } from 'react-router-dom';
import { useSvgColoring } from './useSvgColoring';
import { SVGScene } from './SVGScene';
import ColorPalette from './ColorPalette';
import PaintTopBar from './PaintTopBar';
// import { ReactComponent as SceneSvg } from "../../assets/images/tinyfriends_original.svg";
import logger from '../../utility/logger';
import { parseSvg, ParsedSvg, sanitizeSvg } from '../common/SvgHelpers';
import { Util } from '../../utility/util';
import {
  ENABLE_SAVE_AND_SHARE_STICKER_BOOK,
  EVENTS,
  PAGES,
} from '../../common/constants';
import PaintExitPopup from './PaintExitPopup';
import { t } from 'i18next';
import StickerBookActions from '../stickerBook/StickerBookActions';
import StickerBookSaveModal from '../stickerBook/StickerBookSaveModal';
import StickerBookToast from '../stickerBook/StickerBookToast';
import { useStickerBookSave } from '../../hooks/useStickerBookSave';
import {
  loadPaintedStickerBook,
  savePaintedStickerBook,
} from '../../utility/stickerBookPaintStorage';
import { useFeatureIsOn } from '@growthbook/growthbook-react';

const AUTOSAVE_DEBOUNCE_MS = 1000;

type ColoringBoardRouteState = {
  stickerBookId?: string;
  svgUrl?: string;
  svgRaw?: string;
  artworkTitle?: string;
  stickerBookTitle?: string;
  returnTo?: string;
};

type PaintSavePayload = {
  serializedSvg: string;
  studentId: string;
  stickerBookId: string;
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
    el.setAttribute('preserveAspectRatio', 'none');
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
  const [hasSavedArtwork, setHasSavedArtwork] = useState<boolean>(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const isSaveInFlightRef = useRef(false);
  const pendingPaintSaveRef = useRef<PaintSavePayload | null>(null);
  const saveQueuePromiseRef = useRef<Promise<void> | null>(null);
  const hasPaintChangesRef = useRef(false);
  const hasHydratedPersistenceRef = useRef(false);
  const lastPersistedPaintSaveRef = useRef<PaintSavePayload | null>(null);
  const isStickerBookSaveEnabled: boolean = useFeatureIsOn(
    ENABLE_SAVE_AND_SHARE_STICKER_BOOK,
  );

  const parsedSvg = useMemo(() => parseSvg(svgMarkup), [svgMarkup]);
  const currentStudentId = Util.getCurrentStudent()?.id ?? null;
  const stickerBookId = location.state?.stickerBookId ?? null;
  const canPersistPaintState = !!currentStudentId && !!stickerBookId;
  const toastText = t(
    'Yay! Your creation is saved, share it with your family & friends!',
  );
  const artworkTitle =
    location.state?.artworkTitle ?? location.state?.stickerBookTitle ?? null;
  const saveAnalyticsPayload = useMemo(
    () => ({
      user_id: Util.getCurrentStudent()?.id ?? null,
      page_path: window.location.pathname,
      source: PAGES.COLORING_BOARD,
      artwork_title: artworkTitle,
      return_to: location.state?.returnTo ?? null,
    }),
    [artworkTitle, location.state],
  );
  const {
    showSaveModal,
    showSaveToast,
    savedSvgMarkup,
    openSaveModal,
    closeSaveModal,
    closeSaveToast,
    handleSaveAndShare,
  } = useStickerBookSave({
    fileBaseName: 'Colored Sticker Book',
    shareText: 'Colored Sticker Book',
    backgroundColor: '#fffdee',
    onSaveSuccess: async (fileName: string) => {
      setHasSavedArtwork(true);
      Util.logEvent(EVENTS.PAINT_IMAGE_SAVED, {
        ...saveAnalyticsPayload,
        file_name: fileName,
      });
    },
  });

  const serializeLiveSvg = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return null;

    const coloringSvg = svgEl.cloneNode(true) as SVGSVGElement;
    return new XMLSerializer().serializeToString(coloringSvg);
  }, []);

  const drainPaintSaveQueue = useCallback(async () => {
    if (isSaveInFlightRef.current)
      return saveQueuePromiseRef.current ?? undefined;
    if (!pendingPaintSaveRef.current) return;

    const processQueue = async () => {
      while (pendingPaintSaveRef.current) {
        const nextPaintSave = pendingPaintSaveRef.current;
        pendingPaintSaveRef.current = null;

        const isDuplicateSave =
          !!lastPersistedPaintSaveRef.current &&
          nextPaintSave.studentId ===
            lastPersistedPaintSaveRef.current.studentId &&
          nextPaintSave.stickerBookId ===
            lastPersistedPaintSaveRef.current.stickerBookId &&
          nextPaintSave.serializedSvg ===
            lastPersistedPaintSaveRef.current.serializedSvg;

        if (isDuplicateSave) {
          continue;
        }

        isSaveInFlightRef.current = true;

        try {
          await savePaintedStickerBook(
            nextPaintSave.studentId,
            nextPaintSave.stickerBookId,
            nextPaintSave.serializedSvg,
          );
          lastPersistedPaintSaveRef.current = nextPaintSave;
          hasPaintChangesRef.current = false;
        } catch (error) {
          logger.warn(
            '[StickerBookPaint] Failed to persist painted sticker book.',
            {
              error,
              userId: nextPaintSave.studentId,
              stickerBookId: nextPaintSave.stickerBookId,
            },
          );
        } finally {
          isSaveInFlightRef.current = false;
        }
      }
    };

    const savePromise = processQueue().finally(() => {
      saveQueuePromiseRef.current = null;
    });

    saveQueuePromiseRef.current = savePromise;
    return savePromise;
  }, []);

  const queuePaintSave = useCallback(
    async (serializedSvg: string | null) => {
      if (!serializedSvg || !currentStudentId || !stickerBookId) return;

      pendingPaintSaveRef.current = {
        serializedSvg,
        studentId: currentStudentId,
        stickerBookId,
      };
      await drainPaintSaveQueue();
    },
    [currentStudentId, drainPaintSaveQueue, stickerBookId],
  );

  const flushPaintSave = useCallback(async () => {
    if (!canPersistPaintState || !hasPaintChangesRef.current) return;

    const serializedSvg = serializeLiveSvg();
    if (!serializedSvg) return;

    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    await queuePaintSave(serializedSvg);
  }, [canPersistPaintState, queuePaintSave, serializeLiveSvg]);

  useEffect(() => {
    let mounted = true;
    const state = location.state;

    const loadSvg = async () => {
      setIsLoading(true);
      try {
        if (canPersistPaintState && currentStudentId && stickerBookId) {
          const persistedSvg = await loadPaintedStickerBook(
            currentStudentId,
            stickerBookId,
          );

          if (persistedSvg) {
            lastPersistedPaintSaveRef.current = {
              serializedSvg: persistedSvg,
              studentId: currentStudentId,
              stickerBookId,
            };
            hasHydratedPersistenceRef.current = true;
            hasPaintChangesRef.current = false;

            if (mounted) setSvgMarkup(persistedSvg);
            return;
          }
        }

        if (state?.svgRaw) {
          lastPersistedPaintSaveRef.current =
            currentStudentId && stickerBookId
              ? {
                  serializedSvg: state.svgRaw,
                  studentId: currentStudentId,
                  stickerBookId,
                }
              : null;
          hasHydratedPersistenceRef.current = true;
          hasPaintChangesRef.current = false;
          if (mounted) setSvgMarkup(state.svgRaw);
          return;
        }

        if (state?.svgUrl) {
          const res = await fetch(state.svgUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch svg: ${res.status}`);
          }
          const text = await res.text();
          lastPersistedPaintSaveRef.current =
            currentStudentId && stickerBookId
              ? {
                  serializedSvg: text,
                  studentId: currentStudentId,
                  stickerBookId,
                }
              : null;
          hasHydratedPersistenceRef.current = true;
          hasPaintChangesRef.current = false;
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
  }, [canPersistPaintState, currentStudentId, location.state, stickerBookId]);

  useEffect(() => {
    Util.logEvent(EVENTS.PAINT_MODE_PAGE_VIEW, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      page_path: window.location.pathname,
      return_to: location.state?.returnTo ?? null,
    });
  }, [location.state]);

  useEffect(() => {
    if (!canPersistPaintState || !hasHydratedPersistenceRef.current) return;
    if (!Object.keys(coloring.coloredRegions).length) return;

    hasPaintChangesRef.current = true;

    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      autosaveTimeoutRef.current = null;
      void flushPaintSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [canPersistPaintState, coloring.coloredRegions, flushPaintSave]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushPaintSave();
      }
    };

    const handlePageHide = () => {
      void flushPaintSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    const appStateListener = App.addListener(
      'appStateChange',
      ({ isActive }) => {
        if (!isActive) {
          void flushPaintSave();
        }
      },
    );

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);

      void Promise.resolve(appStateListener).then((listener) =>
        listener?.remove?.(),
      );
    };
  }, [flushPaintSave]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current !== null) {
        window.clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }

      void flushPaintSave();
    };
  }, [flushPaintSave]);

  const handleExit = async () => {
    await flushPaintSave();

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
    Util.logEvent(EVENTS.STICKER_BOOK_SAVE_CLICKED, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      page_path: window.location.pathname,
      source: PAGES.COLORING_BOARD,
    });
    logger.info('save');

    const serializedSvg = serializeLiveSvg();
    if (!serializedSvg) return;

    openSaveModal(serializedSvg);
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
              colorModeUncolouredColor="#202020"
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
          canSave={isStickerBookSaveEnabled}
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
        variant={hasSavedArtwork ? 'post-save-exit' : 'default'}
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
          void handleExit();
        }}
      />
      <StickerBookSaveModal
        open={showSaveModal}
        svgMarkup={savedSvgMarkup}
        onClose={closeSaveModal}
        onAnimationComplete={handleSaveAndShare}
      />
      <StickerBookToast
        isOpen={showSaveToast}
        text={toastText}
        image="/assets/icons/Confirmation.svg"
        duration={4000}
        onClose={closeSaveToast}
      />
    </div>
  );
};

export default ColoringBoard;
