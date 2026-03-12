import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
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

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../components/Loading', () => (props: any) => (
  <div data-testid="loading">{props.isLoading ? 'loading' : 'loaded'}</div>
));

const mockStickerBookBoard = jest.fn<React.ReactElement, [any]>(() => (
  <div data-testid="sticker-book-board" />
));

jest.mock('../components/stickerBook/StickerBookBoard', () => ({
  __esModule: true,
  default: (props: any) => mockStickerBookBoard(props),
}));

const getLastProps = () => {
  const calls = mockStickerBookBoard.mock.calls;
  return (calls[calls.length - 1]?.[0] ?? null) as any | null;
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
    (Util.setPathToBackButton as jest.Mock).mockClear();
    (useHistory as jest.Mock).mockReturnValue({
      replace: replaceMock,
      push: pushMock,
      goBack: goBackMock,
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: async () => '<svg></svg>',
    });
  });

  test('redirects to select mode when no current student', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn(),
        getCurrentStickerBookWithProgress: jest.fn(),
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
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.title).toBe('ANIMALS');
    });
  });

  test('passes collected stickers when book is unlocked', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: ['s1', 's2'] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.collectedStickers).toEqual(['s1', 's2']);
      expect(props.isLocked).toBe(false);
    });
  });

  test('sets isLocked true when current progress is missing', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue(null),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.isLocked).toBe(true);
      expect(props.collectedStickers).toEqual([]);
    });
  });

  test('computes nextStickerId from metadata sequence', async () => {
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
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.nextStickerId).toBe('s2');
    });
  });

  test('sets canGoPrev and canGoNext correctly for first book', async () => {
    const book1 = makeBook({ id: 'b1', sort_index: 1 });
    const book2 = makeBook({ id: 'b2', sort_index: 2, title: 'Sea' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book1,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.canGoPrev).toBe(false);
      expect(props.canGoNext).toBe(true);
    });
  });

  test('sets canGoPrev true when not on first book', async () => {
    const book1 = makeBook({ id: 'b1', sort_index: 1 });
    const book2 = makeBook({ id: 'b2', sort_index: 2, title: 'Sea' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book2,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.canGoPrev).toBe(true);
      expect(props.canGoNext).toBe(false);
    });
  });

  test('onNext advances the selected book', async () => {
    const book1 = makeBook({ id: 'b1', sort_index: 1, title: 'A' });
    const book2 = makeBook({ id: 'b2', sort_index: 2, title: 'B' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book1,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());
    const firstProps = expectProps();
    firstProps.onNext();
    await waitFor(() => {
      const props = expectProps();
      expect(props.title).toBe('B');
    });
  });

  test('onPrev does not go below first book', async () => {
    const book1 = makeBook({ id: 'b1', sort_index: 1, title: 'A' });
    const book2 = makeBook({ id: 'b2', sort_index: 2, title: 'B' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book1,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => expect(mockStickerBookBoard).toHaveBeenCalled());
    const firstProps = expectProps();
    firstProps.onPrev();
    await waitFor(() => {
      const props = expectProps();
      expect(props.title).toBe('A');
    });
  });

  test('resolves relative svg_url correctly', async () => {
    const book = makeBook({ svg_url: 'assets/books/rel.svg' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/assets/books/rel.svg');
    });
  });

  test('uses default SVG when svg_url is empty', async () => {
    const book = makeBook({ svg_url: '' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/assets/icons/StickerBookBoard.svg',
      );
    });
  });

  test('passes svgRaw to StickerBookBoard after fetch', async () => {
    const book = makeBook({ svg_url: '/assets/books/book.svg' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.svgRaw).toBe('<svg></svg>');
    });
  });

  test('does not render board while loading', async () => {
    const slowPromise = new Promise(() => {});
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockReturnValue(slowPromise),
        getCurrentStickerBookWithProgress: jest
          .fn()
          .mockReturnValue(slowPromise),
      },
    });
    render(<StickerBook />);
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(mockStickerBookBoard).not.toHaveBeenCalled();
  });

  test('renders board when loading completes', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });
    await waitFor(() => {
      expect(mockStickerBookBoard).toHaveBeenCalled();
    });
  });

  test('uses sorted books by sort_index', async () => {
    const book1 = makeBook({ id: 'b1', sort_index: 2, title: 'B' });
    const book2 = makeBook({ id: 'b2', sort_index: 1, title: 'A' });
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([book1, book2]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: book2,
          progress: { stickers_collected: [] },
        }),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      const props = expectProps();
      expect(props.title).toBe('A');
    });
  });

  test('onBack wires to Util.setPathToBackButton', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([makeBook()]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
          book: makeBook(),
          progress: { stickers_collected: [] },
        }),
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

  test('handles missing books gracefully', async () => {
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: {
        getAllStickerBooks: jest.fn().mockResolvedValue([]),
        getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue(null),
      },
    });
    render(<StickerBook />);
    await waitFor(() => {
      expect(mockStickerBookBoard).not.toHaveBeenCalled();
    });
  });
});
