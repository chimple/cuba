import { useStickerBook } from '../hooks/useStickerBook';
import './StickerBook.css';

const StickerBook = () => {
  const viewProps = useStickerBook();

  const {
    IonContent,
    IonPage,
    Loading,
    NewBackButton,
    StickerBookBoard,
    StickerBookSaveModal,
    StickerBookToast,
    books,
    closeSaveModal,
    closeSaveToast,
    collectedStickers,
    handleSaveAndShare,
    isBookCompleted,
    isLoading,
    isLocked,
    isPaintModeEnabled,
    isStickerBookSaveEnabled,
    nextStickerId,
    onBack,
    onNext,
    onPaint,
    onPrev,
    onSave,
    resolveStickerBookSvgUrl,
    savedSvgMarkup,
    selectedBook,
    selectedIndex,
    showSaveModal,
    showSaveToast,
    svgRaw,
    t,
    toastText,
  } = viewProps;

  return (
    <IonPage>
      <IonContent>
        <div
          id="sb-page"
          className="sticker-book-page"
          style={{
            background:
              'url("/pathwayAssets/pathwayBackground.svg") no-repeat center/cover',
          }}
        >
          <div id="sb-container" className="sticker-book-container">
            {!isLoading && selectedBook && (
              <StickerBookBoard
                title={(selectedBook.title ?? '').toUpperCase()}
                svgRaw={svgRaw}
                svgUrl={resolveStickerBookSvgUrl(selectedBook.svg_url ?? '')}
                collectedStickers={collectedStickers}
                nextStickerId={nextStickerId}
                isLocked={isLocked}
                canPaint={isBookCompleted && isPaintModeEnabled}
                canSave={isBookCompleted && isStickerBookSaveEnabled}
                canGoPrev={selectedIndex > 0}
                canGoNext={selectedIndex < books.length - 1}
                onPrev={onPrev}
                onNext={onNext}
                onBack={onBack}
                onPaint={onPaint}
                onSave={onSave}
              />
            )}
            {!isLoading && !selectedBook && (
              <div className="sticker-book-fallback">
                <div className="sticker-book-fallback-back">
                  <NewBackButton onClick={onBack} />
                </div>
                <div className="sticker-book-fallback-loading" role="status">
                  <img
                    src="assets/loading.gif"
                    alt="loading"
                    className="sticker-book-fallback-loading-img"
                  />
                  <div className="sticker-book-fallback-loading-text">
                    {t('Loading sticker book...')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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

        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default StickerBook;
