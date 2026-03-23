import React from 'react';
// Changes: expanded StickerBook page coverage for paint, navigation, and completion.
import { render, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import StickerBook from './StickerBook';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import {
  ENABLE_PAINT_MODE,
  ENABLE_SAVE_AND_SHARE_STICKER_BOOK,
  EVENTS,
  PAGES,
} from '../common/constants';
import { useHistory } from 'react-router';
import { toBlob } from 'html-to-image';

const replaceMock = jest.fn();
const pushMock = jest.fn();
const goBackMock = jest.fn();
const mockUseFeatureIsOn = jest.fn();

jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div data-testid="ion-page">{children}</div>,
  IonContent: ({ children }: any) => (
    <div data-testid="ion-content">{children}</div>
  ),
}));

jest.mock('react-router', () => ({
  useHistory: jest.fn(),
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: (flag: string) => mockUseFeatureIsOn(flag),
}));

jest.mock('../components/Loading', () => (props: any) => (
  <div data-testid="loading">{props.isLoading ? 'loading' : 'loaded'}</div>
));

const mockStickerBookBoard = jest.fn();
const mockSaveModal = jest.fn();
const mockToast = jest.fn();

jest.mock('../components/stickerBook/StickerBookBoard', () => ({
  __esModule: true,
  default: (props: any) => {
    mockStickerBookBoard(props);
    return (
      <div data-testid="sticker-book-board">
        <svg className="sticker-book-svg">
          <circle cx="5" cy="5" r="5" />
        </svg>
      </div>
    );
  },
}));

jest.mock('../components/stickerBook/StickerBookSaveModal', () => ({
  __esModule: true,
  default: (props: any) => {
    mockSaveModal(props);
    if (!props.open) return null;

    return (
      <div data-testid="sticker-book-save-modal">
        <div id="sticker-book-save-modal-frame">
          <div id="sticker-book-save-blink-overlay" />
        </div>
        <button onClick={props.onClose}>close modal</button>
        <button onClick={props.onAnimationComplete}>finish animation</button>
        <div data-testid="sticker-book-save-modal-markup">
          {props.svgMarkup}
        </div>
      </div>
    );
  },
}));

jest.mock('../components/stickerBook/StickerBookToast', () => ({
  __esModule: true,
  default: (props: any) => {
    mockToast(props);
    return props.isOpen ? (
      <div data-testid="sticker-book-toast">{props.text}</div>
    ) : null;
  },
}));

jest.mock('html-to-image', () => ({
  toBlob: jest.fn(),
}));

jest.mock('../utility/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const getLastProps = () => {
  const calls = mockStickerBookBoard.mock.calls;

  if (!calls || calls.length === 0) return null;

  return calls[calls.length - 1][0];
};
const expectProps = () => {
  const props = getLastProps();
  expect(props).not.toBeNull();
  return props as any;
};
const getLastModalProps = () => {
  const calls = mockSaveModal.mock.calls;

  if (!calls || calls.length === 0) return null;

  return calls[calls.length - 1][0];
};
const getLastToastProps = () => {
  const calls = mockToast.mock.calls;

  if (!calls || calls.length === 0) return null;

  return calls[calls.length - 1][0];
};

jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: jest.fn(),
  },
}));

jest.mock('../utility/util', () => ({
  Util: {
    getCurrentStudent: jest.fn(),
    setPathToBackButton: jest.fn(),
    logEvent: jest.fn(),
    sendContentToAndroidOrWebShare: jest.fn(),
    saveFileToDownloads: jest.fn(),
  },
}));

const makeBook = (overrides: Partial<any> = {}) => ({
  id: 'book-1',
  title: 'Animals',
  svg_url: '/assets/books/book-1.svg',
  sort_index: 1,
  stickers_metadata: [],
  ...overrides,
});

describe('StickerBook page', () => {
  beforeEach(() => {
    mockStickerBookBoard.mockClear();
    mockSaveModal.mockClear();
    mockToast.mockClear();
    replaceMock.mockClear();
    pushMock.mockClear();
    goBackMock.mockClear();
    (Util.logEvent as jest.Mock).mockClear();

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-1' });
    (Util.sendContentToAndroidOrWebShare as jest.Mock).mockResolvedValue(
      undefined,
    );
    (Util.saveFileToDownloads as jest.Mock).mockResolvedValue(undefined);
    mockUseFeatureIsOn.mockImplementation((flag: string) => {
      if (flag === ENABLE_PAINT_MODE) return true;
      if (flag === ENABLE_SAVE_AND_SHARE_STICKER_BOOK) return true;
      return false;
    });
    (toBlob as jest.Mock).mockResolvedValue(
      new Blob(['png'], { type: 'image/png' }),
    );

    (useHistory as jest.Mock).mockReturnValue({
      replace: replaceMock,
      push: pushMock,
      goBack: goBackMock,
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('<svg></svg>'),
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    });
  });

  test('redirects to select mode when no current student', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn(),
        getCurrentStickerBookWithProgress: jest.fn(),
        getUserWonStickerBooks: jest.fn(),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });

  test('loads books and renders StickerBookBoard after loading', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: ['a'] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      expect(mockStickerBookBoard).toHaveBeenCalled();
    });
  });

  test('passes uppercase title to StickerBookBoard', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.title).toBe('ANIMALS');
    });
  });

  test('passes collected stickers when unlocked', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: ['s1', 's2'] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.collectedStickers).toEqual(['s1', 's2']);
      expect(props.isLocked).toBe(false);
    });
  });

  test('sets isLocked true when no progress', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue(null),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.isLocked).toBe(true);
      expect(props.collectedStickers).toEqual([]);
    });
  });

  test('computes nextStickerId correctly', async () => {
    const book = makeBook({
      stickers_metadata: [
        { id: 's1', sequence: 1 },
        { id: 's2', sequence: 2 },
      ],
    });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: ['s1'] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.nextStickerId).toBe('s2');
    });
  });

  test('onNext navigates to next book', async () => {
    const book1 = makeBook({ id: 'b1', title: 'A', sort_index: 1 });
    const book2 = makeBook({ id: 'b2', title: 'B', sort_index: 2 });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book1,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    const props = expectProps();
    act(() => {
      props.onNext();
    });

    await waitFor(() => {
      const updated = expectProps();
      expect(updated.title).toBe('B');
    });
  });

  test('onBack triggers Util.setPathToBackButton', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    const props = expectProps();
    props.onBack();

    expect(Util.setPathToBackButton).toHaveBeenCalledWith(
      PAGES.HOME,
      expect.anything(),
    );
  });

  test('does not render board while loading', () => {
    const slowPromise = new Promise(() => {});

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockReturnValue(slowPromise),
        getCurrentStickerBookWithProgress: jest
          .fn()
          .mockReturnValue(slowPromise),
        getUserWonStickerBooks: jest.fn().mockReturnValue(slowPromise),
        updateRewardAsSeen: jest.fn().mockReturnValue(slowPromise),
      },
    });

    render(<StickerBook />);

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(mockStickerBookBoard).not.toHaveBeenCalled();
  });

  test('fetches svg correctly', async () => {
    const book = makeBook({ svg_url: 'assets/books/rel.svg' });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/assets/books/rel.svg');
    });
  });

  test('onSave is passed and can be invoked', async () => {
    const book = makeBook();

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());
    const props = expectProps();
    expect(typeof props.onSave).toBe('function');
  });

  test('onPrev does not go before first book', async () => {
    const book1 = makeBook({ id: 'b1', title: 'A', sort_index: 1 });
    const book2 = makeBook({ id: 'b2', title: 'B', sort_index: 2 });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book1,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());
    const props = expectProps();
    act(() => {
      props.onPrev();
    });

    await waitFor(() => {
      const updated = expectProps();
      expect(updated.title).toBe('A');
    });
  });

  test('canGoPrev and canGoNext are false when only one book', async () => {
    const book = makeBook({ id: 'b1', title: 'Only', sort_index: 1 });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.canGoPrev).toBe(false);
      expect(props.canGoNext).toBe(false);
    });
  });

  test('collectedStickers uses completed set when book completed', async () => {
    const book = makeBook({
      stickers_metadata: [
        { id: 's1', sequence: 1 },
        { id: 's2', sequence: 2 },
      ],
    });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: ['s1'] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([book]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.collectedStickers).toEqual(['s1', 's2']);
    });
  });

  test('isLocked is false when book is completed', async () => {
    const book = makeBook({
      stickers_metadata: [
        { id: 's1', sequence: 1 },
        { id: 's2', sequence: 2 },
      ],
    });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([book]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.isLocked).toBe(false);
    });
  });

  test('passes the sticker book save feature flag to the board', async () => {
    mockUseFeatureIsOn.mockImplementation((flag: string) => {
      if (flag === ENABLE_PAINT_MODE) return true;
      if (flag === ENABLE_SAVE_AND_SHARE_STICKER_BOOK) return false;
      return false;
    });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.isStickerBookSaveEnabled).toBe(false);
    });
  });

  test('onSave serializes the board SVG and opens the save modal', async () => {
    const book = makeBook();

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([book]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    await act(async () => {
      expectProps().onSave();
    });

    await waitFor(() => {
      const modalProps = getLastModalProps();
      expect(modalProps?.open).toBe(true);
      expect(modalProps?.svgMarkup).toContain('<svg');
      expect(modalProps?.svgMarkup).toContain('<circle');
    });
  });

  test('shares and downloads the generated sticker book snapshot after the modal animation', async () => {
    const book = makeBook({ title: 'My Book!!' });

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([book]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    await act(async () => {
      expectProps().onSave();
    });

    await waitFor(() => expect(getLastModalProps()?.open).toBe(true));

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_SAVE_CLICKED,
      expect.objectContaining({
        user_id: 'student-1',
        book_id: book.id,
        book_title: book.title,
        page_path: window.location.pathname,
      }),
    );

    await act(async () => {
      await getLastModalProps()?.onAnimationComplete();
    });

    const toBlobOptions = (toBlob as jest.Mock).mock.calls[0][1];
    const overlay = document.getElementById('sticker-book-save-blink-overlay');
    const sharedFile = (Util.sendContentToAndroidOrWebShare as jest.Mock).mock
      .calls[0][3][0] as File;

    expect(toBlob).toHaveBeenCalledWith(
      document.getElementById('sticker-book-save-modal-frame'),
      expect.objectContaining({
        cacheBust: true,
        backgroundColor: '#fffdee',
        pixelRatio: 2,
      }),
    );
    expect(toBlobOptions.filter(overlay)).toBe(false);
    expect(toBlobOptions.filter(document.createElement('div'))).toBe(true);
    expect(Util.sendContentToAndroidOrWebShare).toHaveBeenCalledWith(
      'Sticker Book',
      sharedFile.name,
      undefined,
      [expect.any(File)],
    );
    expect(sharedFile.name).toMatch(
      /^Sticker_Book_My_Book_\d{2}_[A-Za-z]{3}_\d{2}:\d{2}\.png$/,
    );
    expect(Util.saveFileToDownloads).toHaveBeenCalledWith(sharedFile);
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_IMAGE_SHARED,
      expect.objectContaining({
        user_id: 'student-1',
        book_id: book.id,
        book_title: book.title,
        file_name: sharedFile.name,
      }),
    );
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_IMAGE_SAVED,
      expect.objectContaining({
        user_id: 'student-1',
        book_id: book.id,
        book_title: book.title,
        file_name: sharedFile.name,
      }),
    );
  });

  test('shows the confirmation toast after the save modal closes', async () => {
    const book = makeBook();

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([book]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    await act(async () => {
      expectProps().onSave();
    });

    await waitFor(() => expect(getLastModalProps()?.open).toBe(true));

    await act(async () => {
      getLastModalProps()?.onClose();
    });

    await waitFor(() => {
      const modalProps = getLastModalProps();
      const toastProps = getLastToastProps();
      expect(modalProps?.open).toBe(false);
      expect(toastProps?.isOpen).toBe(true);
      expect(screen.getByTestId('sticker-book-toast')).toHaveTextContent(
        'Yay! Your creation is saved, share it with your family & friends!',
      );
    });
  });

  test('skips sharing when image conversion returns no blob', async () => {
    const book = makeBook({ title: 'No Blob' });
    (toBlob as jest.Mock).mockResolvedValueOnce(null);

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
        getUserWonStickerBooks: jest.fn().mockResolvedValue([book]),
        updateRewardAsSeen: jest.fn(),
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    await act(async () => {
      expectProps().onSave();
    });

    await waitFor(() => expect(getLastModalProps()?.open).toBe(true));

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_SAVE_CLICKED,
      expect.objectContaining({
        user_id: 'student-1',
        book_id: book.id,
        book_title: book.title,
      }),
    );

    await act(async () => {
      await getLastModalProps()?.onAnimationComplete();
    });

    expect(Util.sendContentToAndroidOrWebShare).not.toHaveBeenCalled();
    expect(Util.saveFileToDownloads).not.toHaveBeenCalled();
    expect(Util.logEvent).not.toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_IMAGE_SHARED,
      expect.anything(),
    );
    expect(Util.logEvent).not.toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_IMAGE_SAVED,
      expect.anything(),
    );
  });
});
