import { useStickerBookBoard } from '../../hooks/useStickerBookBoard';
import './StickerBookBoard.css';

const StickerBookBoard = (props: Parameters<typeof useStickerBookBoard>[0]) => {
  const viewProps = useStickerBookBoard(props);

  const {
    InlineSvg,
    NewBackButton,
    STICKER_BOOK_CLIP_PATH,
    SVGScene,
    StickerBookActions,
    TITLE_AREA_COORDS,
    boardSvgRef,
    boardViewBox,
    canPaint,
    canSave,
    clipPathId,
    collectedStickers,
    handleBack,
    handlePaint,
    handleSave,
    isLocked,
    nextStickerId,
    onSave,
    parsedBoardSvg,
    parsedSvg,
    sanitizeSvg,
    showLockedSvg,
    svgRef,
    svgUrl,
    t,
    title,
  } = viewProps;

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
                  <path d={STICKER_BOOK_CLIP_PATH} />
                </clipPath>
              </defs>

              {/* Locked skeleton placeholder when SVG is not yet available */}
              {isLocked && (!parsedSvg || !showLockedSvg) && (
                <g clipPath={`url(#${clipPathId})`}>
                  <rect
                    x="92"
                    y="57.8"
                    width="500"
                    height="282.2"
                    fill="rgba(255, 255, 255, 0.9)"
                  />
                </g>
              )}

              {/* Header/Title Area */}
              <foreignObject {...TITLE_AREA_COORDS}>
                <div id="sb-board-title" className="sticker-book-board-title">
                  {t('STICKER BOOK')}: {t(title)}
                </div>
              </foreignObject>

              {/* Place the sticker SVG in the board's coordinate space. */}
              {parsedSvg && (!isLocked || showLockedSvg) && (
                <g clipPath={`url(#${clipPathId})`}>
                  <SVGScene
                    mode={isLocked ? 'color' : 'drag'}
                    svgRefExternal={svgRef}
                    collectedStickers={collectedStickers}
                    nextStickerId={nextStickerId}
                    isDragEnabled={false}
                    stickerVisibilityMode="strict"
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
                        nextStickerId ?? 'nextStickerId'
                      }:${isLocked ? 'locked' : 'open'}:${svgUrl ?? ''}`}
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
                  {isLocked && (
                    <path
                      d={STICKER_BOOK_CLIP_PATH}
                      fill="rgba(255, 255, 255, 0.7)"
                      pointerEvents="none"
                    />
                  )}
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
          paintDisabled={false}
          canSave={canSave}
        />
      </div>
    </div>
  );
};

export default StickerBookBoard;
