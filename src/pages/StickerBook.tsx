import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { t } from "i18next";
import { PAGES } from "../common/constants";
import { StickerBook as StickerBookType } from "../interface/modelInterfaces";
import StickerBookBoard from "../components/stickerBook/StickerBookBoard";
import Loading from "../components/Loading";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";
import "./StickerBook.css";

type CurrentProgress = {
  bookId: string;
  stickers: string[];
};

function resolveSvgUrl(url: string): string {
  if (!url) return "/assets/icons/StickerBookBoard.svg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

const StickerBook: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<StickerBookType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentProgress, setCurrentProgress] =
    useState<CurrentProgress | null>(null);
  const [svgCache, setSvgCache] = useState<Record<string, string>>({});

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
      const [allBooks, currentBookResult] = await Promise.all([
        api.getAllStickerBooks(),
        api.getCurrentStickerBookWithProgress(currentStudent.id),
      ]);

      const sortedBooks = [...(allBooks ?? [])].sort(
        (a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0),
      );
      setBooks(sortedBooks);

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
      console.error("Failed to load sticker book data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSvgForBook = async (book: StickerBookType) => {
    const svgUrl = resolveSvgUrl(book.svg_url ?? "");
    try {
      const response = await fetch(svgUrl);
      const svgText = await response.text();
      setSvgCache((prev) => ({ ...prev, [book.id]: svgText }));
    } catch (e) {
      console.error("Failed to load sticker book svg:", e);
    }
  };

  const selectedBook = books[selectedIndex] ?? null;
  const isLocked = useMemo(() => {
    if (!selectedBook) return true;
    return currentProgress?.bookId !== selectedBook.id;
  }, [selectedBook, currentProgress]);

  const collectedStickers = useMemo(() => {
    if (!selectedBook || isLocked) return [];
    if (currentProgress?.bookId === selectedBook.id) {
      return currentProgress.stickers ?? [];
    }
    return [];
  }, [selectedBook, isLocked, currentProgress]);

  const nextStickerId = useMemo(() => {
    if (!selectedBook || isLocked) return undefined;
    const collectedSet = new Set(collectedStickers);
    const sorted = [...(selectedBook.stickers_metadata ?? [])].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
    const next = sorted.find((s) => !collectedSet.has(s.id));
    return next?.id;
  }, [selectedBook, isLocked, collectedStickers]);

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
                title={(selectedBook.title ?? "").toUpperCase()}
                svgRaw={svgRaw}
                collectedStickers={collectedStickers}
                nextStickerId={nextStickerId}
                isLocked={isLocked}
                canGoPrev={selectedIndex > 0}
                canGoNext={selectedIndex < books.length - 1}
                onPrev={onPrev}
                onNext={onNext}
                onBack={onBack}
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
