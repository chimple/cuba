import { IonContent, IonPage } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import { ENABLE_PAINT_MODE, EVENTS, PAGES } from '../common/constants';
import { StickerBook as StickerBookType } from '../interface/modelInterfaces';
import StickerBookBoard from '../components/stickerBook/StickerBookBoard';
import Loading from '../components/Loading';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import './StickerBook.css';
import logger from '../utility/logger';
import { useFeatureIsOn } from '@growthbook/growthbook-react';

type CurrentProgress = {
  bookId: string;
  stickers: string[];
};

function resolveSvgUrl(url: string): string {
  if (!url) return '/assets/icons/StickerBookBoard.svg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}

const StickerBook: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const isPaintModeEnabled = useFeatureIsOn(ENABLE_PAINT_MODE);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<StickerBookType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentProgress, setCurrentProgress] =
    useState<CurrentProgress | null>(null);
  const [svgCache, setSvgCache] = useState<Record<string, string>>({});
  const [completedBookIds, setCompletedBookIds] = useState<Set<string>>(
    () => new Set(),
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
    const svgUrl = resolveSvgUrl(book.svg_url ?? '');
    try {
      const response = await fetch(svgUrl);
      const svgText = await response.text();
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
    const svgUrl = resolveSvgUrl(selectedBook.svg_url ?? '');
    history.push(PAGES.COLORING_BOARD, {
      svgRaw: svgRaw ?? undefined,
      svgUrl,
      returnTo: PAGES.STICKER_BOOK,
    });
  };

  const onSave = () => {
    logger.info('save');
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
                collectedStickers={collectedStickers}
                nextStickerId={nextStickerId}
                isLocked={isLocked}
                canPaint={isBookCompleted && isPaintModeEnabled}
                canGoPrev={selectedIndex > 0}
                canGoNext={selectedIndex < books.length - 1}
                onPrev={onPrev}
                onNext={onNext}
                onBack={onBack}
                onPaint={onPaint}
                onSave={onSave}
              />
            )}
          </div>
        </div>

        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default StickerBook;
