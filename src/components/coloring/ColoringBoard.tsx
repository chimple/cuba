import './ColoringBoard.css';
import React from 'react';
import { SVGScene } from './SVGScene';
import ColorPalette from './ColorPalette';
import PaintTopBar from './PaintTopBar';
import PaintExitPopup from './PaintExitPopup';
import { t } from 'i18next';
import StickerBookActions from '../stickerBook/StickerBookActions';
import StickerBookSaveModal from '../stickerBook/StickerBookSaveModal';
import StickerBookToast from '../stickerBook/StickerBookToast';
import InlineSvg from './InlineSvg';
import { useColoringBoard } from '../../hooks/useColoringBoard';

const ColoringBoard: React.FC = () => {
  const {
    coloring,
    closeExitConfirm,
    closeSaveModal,
    closeSaveToast,
    confirmExit,
    handleSave,
    handleSaveAndShare,
    hasSavedArtwork,
    isLoading,
    isStickerBookSaveEnabled,
    openExitConfirm,
    parsedSvg,
    savedSvgMarkup,
    showExitConfirm,
    showSaveModal,
    showSaveToast,
    stayOnPage,
    svgRef,
    toastText,
  } = useColoringBoard();

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
          onExit={openExitConfirm}
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
          closeExitConfirm();
        }}
        onStay={() => {
          stayOnPage();
        }}
        onExit={() => {
          confirmExit();
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
