import { IonContent, IonPage } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import {
  ENABLE_PAINT_MODE,
  ENABLE_SAVE_AND_SHARE_STICKER_BOOK,
  EVENTS,
  PAGES,
} from '../common/constants';
import { StickerBook as StickerBookType } from '../interface/modelInterfaces';
import StickerBookBoard from '../components/stickerBook/StickerBookBoard';
import Loading from '../components/Loading';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import './StickerBook.css';
import logger from '../utility/logger';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import StickerBookSaveModal from '../components/stickerBook/StickerBookSaveModal';
import StickerBookToast from '../components/stickerBook/StickerBookToast';
import { toBlob } from 'html-to-image';
import { t } from 'i18next';
import {
  fetchStickerBookSvgText,
  resolveStickerBookSvgUrl,
} from '../utility/stickerBookAssets';

function sanitizeFileName(value: string): string {
  return (
    value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') ||
    'sticker-book'
  );
}

type CurrentProgress = {
  bookId: string;
  stickers: string[];
};

const StickerBook: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const isPaintModeEnabled = useFeatureIsOn(ENABLE_PAINT_MODE);
  const isStickerBookSaveEnabled: boolean = useFeatureIsOn(
    ENABLE_SAVE_AND_SHARE_STICKER_BOOK,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [savedSvgMarkup, setSavedSvgMarkup] = useState<string | null>(null);
  const [books, setBooks] = useState<StickerBookType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentProgress, setCurrentProgress] =
    useState<CurrentProgress | null>(null);
  const [svgCache, setSvgCache] = useState<Record<string, string>>({});
  const [completedBookIds, setCompletedBookIds] = useState<Set<string>>(
    () => new Set(),
  );
  const toastText: string = t(
    'Yay! Your creation is saved, share it with your family & friends!',
  );

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const book = books[selectedIndex];
    if (!book) return;
    if (svgCache[book.id]) return;
    fetchSvgForBook(book);
  }, [books, selectedIndex, svgCache]);

  const init = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    try {
      if (currentStudent?.id) {
        await api.updateRewardAsSeen(currentStudent.id);
      }
      const [allBooks, currentBookResult, completedBooks] = await Promise.all([
        api.getAllStickerBooks(),
        api.getCurrentStickerBookWithProgress(currentStudent.id),
        api.getUserWonStickerBooks(currentStudent.id),
      ]);

      const sortedBooks = [...(allBooks ?? [])].sort(
        (a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0),
      );
      setBooks(sortedBooks);
      setCompletedBookIds(
        new Set((completedBooks ?? []).map((book) => book.id)),
      );

      if (currentBookResult?.book) {
        setCurrentProgress({
          bookId: currentBookResult.book.id,
          stickers: currentBookResult.progress?.stickers_collected ?? [],
        });

        const activeIndex = sortedBooks.findIndex(
          (b) => b.id === currentBookResult.book.id,
        );
        setSelectedIndex(activeIndex >= 0 ? activeIndex : 0);
      } else {
        setSelectedIndex(0);
      }
    } catch (e) {
      logger.error('Failed to load sticker book data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSvgForBook = async (book: StickerBookType) => {
    try {
      const svgText = await fetchStickerBookSvgText(book.svg_url ?? '');
      setSvgCache((prev) => ({ ...prev, [book.id]: svgText }));
    } catch (e) {
      logger.error('Failed to load sticker book svg:', e);
    }
  };

  const selectedBook = books[selectedIndex] ?? null;
  const allStickerIds = useMemo(() => {
    if (!selectedBook) return [];
    return (selectedBook.stickers_metadata ?? [])
      .map((s) => s.id)
      .filter(Boolean);
  }, [selectedBook]);

  const collectedFromProgress = useMemo(() => {
    if (!selectedBook) return [];
    if (currentProgress?.bookId === selectedBook.id) {
      return currentProgress.stickers ?? [];
    }
    return [];
  }, [selectedBook, currentProgress]);

  const isBookCompleted = useMemo(() => {
    if (!selectedBook) return false;
    if (completedBookIds.has(selectedBook.id)) return true;
    if (allStickerIds.length === 0) return false;
    return collectedFromProgress.length >= allStickerIds.length;
  }, [selectedBook, completedBookIds, allStickerIds, collectedFromProgress]);

  const isLocked = useMemo(() => {
    if (!selectedBook) return true;
    if (isBookCompleted) return false;
    return currentProgress?.bookId !== selectedBook.id;
  }, [selectedBook, currentProgress, isBookCompleted]);

  const collectedStickers = useMemo(() => {
    if (!selectedBook) return [];
    if (isBookCompleted) return allStickerIds;
    if (isLocked) return [];
    return collectedFromProgress;
  }, [
    selectedBook,
    isLocked,
    isBookCompleted,
    allStickerIds,
    collectedFromProgress,
  ]);

  const nextStickerId = useMemo(() => {
    if (!selectedBook || isLocked || isBookCompleted) return undefined;
    const collectedSet = new Set(collectedFromProgress);
    const sorted = [...(selectedBook.stickers_metadata ?? [])].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
    const next = sorted.find((s) => !collectedSet.has(s.id));
    return next?.id;
  }, [selectedBook, isLocked, isBookCompleted, collectedFromProgress]);

  const svgRaw = selectedBook ? (svgCache[selectedBook.id] ?? null) : null;

  const saveAnalyticsPayload = useMemo(
    () => ({
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_id: selectedBook?.id ?? null,
      book_title: selectedBook?.title ?? null,
      collected_count: collectedStickers.length,
      total_elements: allStickerIds.length,
      page_path: window.location.pathname,
    }),
    [selectedBook, collectedStickers.length, allStickerIds.length],
  );

  const onBack = () => {
    Util.setPathToBackButton(PAGES.HOME, history);
  };

  const onPrev = () => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  };

  const onNext = () => {
    setSelectedIndex((prev) => Math.min(prev + 1, books.length - 1));
  };

  const onPaint = () => {
    if (!selectedBook) return;
    const svgUrl = resolveStickerBookSvgUrl(selectedBook.svg_url ?? '');
    history.push(PAGES.COLORING_BOARD, {
      svgRaw: svgRaw ?? undefined,
      svgUrl,
      returnTo: PAGES.STICKER_BOOK,
    });
  };

  const onSave = () => {
    Util.logEvent(EVENTS.STICKER_BOOK_SAVE_CLICKED, saveAnalyticsPayload);
    logger.info('save');
    const svgEl = document.querySelector('.sticker-book-svg');
    if (svgEl) {
      // Serialize the rendered board so the export includes the live sticker state,
      // not just the original source SVG fetched from the server.
      const stickerBookSvg = svgEl.cloneNode(true);
      setSavedSvgMarkup(new XMLSerializer().serializeToString(stickerBookSvg));
    }
    setShowSaveModal(true);
  };

  const onSaveModalClose = () => {
    setShowSaveModal(false);
    setShowSaveToast(true);
  };

  // save and share sticker book
  const handleSaveAndShare = async () => {
    if (isSaving || !selectedBook) return;
    setIsSaving(true);
    try {
      const shareTarget = document.getElementById(
        'sticker-book-save-modal-frame',
      );
      if (!shareTarget) return;

      // Capture the styled modal frame instead of the raw board so the saved image
      // matches the branded share card shown to the user.
      const blob = await toBlob(shareTarget, {
        cacheBust: true,
        backgroundColor: '#fffdee',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        filter: (node: HTMLElement) => {
          return node.id !== 'sticker-book-save-blink-overlay';
        },
      });
      if (!blob) return;

      const timestamp = new Date()
        .toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace(',', '')
        .replace(/\s+/g, '_');

      const baseName =
        t('Sticker Book ') + selectedBook.title || t('Sticker Book');

      // sanitize + convert to lowercase + underscores
      const formattedName = sanitizeFileName(baseName);
      const fileName = `${formattedName}_${timestamp}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      await Util.sendContentToAndroidOrWebShare(
        t('Sticker Book'),
        fileName,
        undefined,
        [file],
      );
      Util.logEvent(EVENTS.STICKER_BOOK_IMAGE_SHARED, {
        ...saveAnalyticsPayload,
        file_name: fileName,
      });
      await Util.saveFileToDownloads(file);
      Util.logEvent(EVENTS.STICKER_BOOK_IMAGE_SAVED, {
        ...saveAnalyticsPayload,
        file_name: fileName,
      });
    } catch (error) {
      logger.error('Failed to share sticker book snapshot:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!selectedBook) return;
    const total = allStickerIds.length;
    const colored = collectedStickers.length;
    const uncolored = Math.max(0, total - colored);
    Util.logEvent(EVENTS.STICKER_BOOK_PROGRESS_COUNTS, {
      user_id: Util.getCurrentStudent()?.id ?? null,
      book_id: selectedBook.id,
      book_title: selectedBook.title ?? null,
      total_elements: total,
      colored_elements: colored,
      uncolored_elements: uncolored,
      page_path: window.location.pathname,
    });
  }, [selectedBook, allStickerIds, collectedStickers]);

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
                isStickerBookSaveEnabled={isStickerBookSaveEnabled}
                canGoPrev={selectedIndex > 0}
                canGoNext={selectedIndex < books.length - 1}
                onPrev={onPrev}
                onNext={onNext}
                onBack={onBack}
                onPaint={onPaint}
                onSave={onSave}
                isBookCompleted={isBookCompleted}
              />
            )}
          </div>
        </div>
        <StickerBookSaveModal
          open={showSaveModal}
          svgMarkup={savedSvgMarkup}
          onClose={onSaveModalClose}
          onAnimationComplete={handleSaveAndShare}
        />
        <StickerBookToast
          isOpen={showSaveToast}
          text={toastText}
          image="/assets/icons/Confirmation.svg"
          duration={4000}
          onClose={() => setShowSaveToast(false)}
        />

        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default StickerBook;
