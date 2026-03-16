import React from 'react';
// Changes: expanded StickerBook page coverage for paint, navigation, and completion.
import { render, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import StickerBook from './StickerBook';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { PAGES } from '../common/constants';
import { useHistory } from 'react-router';

const replaceMock = jest.fn();
const pushMock = jest.fn();
const goBackMock = jest.fn();

jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div data-testid="ion-page">{children}</div>,
  IonContent: ({ children }: any) => (
    <div data-testid="ion-content">{children}</div>
  ),
}));

jest.mock('react-router', () => ({
  useHistory: jest.fn(),
}));

jest.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: jest.fn(() => true),
}));

jest.mock('../components/Loading', () => (props: any) => (
  <div data-testid="loading">{props.isLoading ? 'loading' : 'loaded'}</div>
));

const mockStickerBookBoard = jest.fn();

jest.mock('../components/stickerBook/StickerBookBoard', () => ({
  __esModule: true,
  default: (props: any) => {
    mockStickerBookBoard(props);
    return <div data-testid="sticker-book-board" />;
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
    replaceMock.mockClear();
    pushMock.mockClear();
    goBackMock.mockClear();

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-1' });

    (useHistory as jest.Mock).mockReturnValue({
      replace: replaceMock,
      push: pushMock,
      goBack: goBackMock,
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('<svg></svg>'),
    });
  });

  test('redirects to select mode when no current student', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn(),
        getCurrentStickerBookWithProgress: jest.fn(),
        getUserWonStickerBooks: jest.fn(),
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
      },
    });

    render(<StickerBook />);

    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());

    const props = expectProps();
    props.onNext();

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
      },
    });

    render(<StickerBook />);

    await waitFor(() => {
      const props = expectProps();
      expect(props.isLocked).toBe(false);
    });
  });
});
