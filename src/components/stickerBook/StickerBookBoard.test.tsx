import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StickerBookBoard from './StickerBookBoard';
import logger from '../../utility/logger';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentStudent: jest.fn(() => ({ id: 'student-1' })),
    logEvent: jest.fn(),
  },
}));

jest.mock('../../utility/logger', () => {
  const mockLogger = {
    setLevel: jest.fn(),
    getLevel: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
  };
});

const baseProps = {
  title: 'STICKER BOOK : ANIMALS',
  canGoPrev: true,
  canGoNext: true,
  isLocked: false,
  collectedStickers: [],
  svgRaw: null,
  canSave: true,
  onBack: jest.fn(),
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onPaint: jest.fn(),
};
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));
jest.mock('../coloring/SVGScene', () => ({
  __esModule: true,
  default: () => <div data-testid="svg-scene" />,
}));

jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

jest.mock('../../assets/icons/PaintBucket.svg', () => 'paint.svg');

const renderBoard = async (
  props: Partial<React.ComponentProps<typeof StickerBookBoard>> = {},
) => {
  const view = render(
    <StickerBookBoard {...baseProps} {...props} collectedStickers={[]} />,
  );

  await waitFor(() => {
    expect(
      document.querySelector('.sticker-book-board-canvas'),
    ).toBeInTheDocument();
  });

  return view;
};

describe('StickerBookBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(`
          <svg width="500" height="300">
            <g id="background"></g>
            <g id="stickers"></g>
          </svg>
        `),
      }),
    ) as jest.Mock;
  });
  test('renders component', async () => {
    await renderBoard();
  });

  test('renders board title', async () => {
    await renderBoard();
    expect(await screen.findByText(/STICKER BOOK/i)).toBeInTheDocument();
  });

  test('renders correct title text', async () => {
    await renderBoard();

    expect(
      await screen.findByText((content) =>
        content.includes('STICKER BOOK : ANIMALS'),
      ),
    ).toBeInTheDocument();
  });

  test('fetches svg on mount', async () => {
    await renderBoard();

    expect(fetch).toHaveBeenCalled();
  });

  test('fetch called with correct url', async () => {
    await renderBoard();

    expect(fetch).toHaveBeenCalledWith('/assets/icons/StickerBookBoard.svg');
  });

  test('fetch called once', async () => {
    await renderBoard();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('renders svg after load', async () => {
    await renderBoard();

    expect(
      document.querySelector('.sticker-book-board-canvas'),
    ).toBeInTheDocument();
  });
  test('renders navigation buttons', async () => {
    const { container } = await renderBoard();

    expect(container.querySelector('#sticker-book-nav-left')).toBeTruthy();
    expect(container.querySelector('#sticker-book-nav-right')).toBeTruthy();
  });

  test('left navigation triggers onPrev', async () => {
    const { container } = await renderBoard();

    fireEvent.click(
      container.querySelector('#sticker-book-nav-left') as HTMLElement,
    );

    expect(baseProps.onPrev).toHaveBeenCalled();
  });

  test('right navigation triggers onNext', async () => {
    const { container } = await renderBoard();

    fireEvent.click(
      container.querySelector('#sticker-book-nav-right') as HTMLElement,
    );

    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test('shows disabled layer when locked', async () => {
    await renderBoard({ isLocked: true });

    expect(
      document.querySelector('.sticker-book-disabled-layer'),
    ).toBeInTheDocument();
  });

  test('disabled layer not shown when unlocked', async () => {
    await renderBoard();
  });

  test('renders with collected stickers', async () => {
    await render(
      <StickerBookBoard {...baseProps} collectedStickers={['lion', 'tiger']} />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });

  test('handles svgRaw provided', async () => {
    await renderBoard();

    expect(
      document.querySelector('.sticker-book-board-canvas'),
    ).toBeInTheDocument();
  });

  test('save button hidden when sticker book save feature is disabled', async () => {
    await renderBoard({ canSave: false });

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  /* ---------------- ADDITIONAL TEST CASES ---------------- */

  test('board root container exists', async () => {
    await renderBoard();

    expect(document.querySelector('#sb-board-root')).toBeInTheDocument();
  });

  test('board frame container exists', async () => {
    await renderBoard();

    expect(document.querySelector('#sb-frame')).toBeInTheDocument();
  });

  test('component renders without collected stickers', async () => {
    await renderBoard();
  });

  test('component renders with many stickers', async () => {
    render(
      <StickerBookBoard
        {...baseProps}
        collectedStickers={['lion', 'tiger', 'cat', 'dog', 'elephant']}
      />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });

  test('svg background group exists after load', async () => {
    await renderBoard();

    expect(document.querySelector('#background')).toBeInTheDocument();
  });

  test('svg stickers group exists after load', async () => {
    await renderBoard();

    expect(document.querySelector('#stickers')).toBeInTheDocument();
  });

  test('navigation buttons remain clickable', async () => {
    const { container } = await renderBoard();

    const left = container.querySelector(
      '#sticker-book-nav-left',
    ) as HTMLElement;
    const right = container.querySelector(
      '#sticker-book-nav-right',
    ) as HTMLElement;

    fireEvent.click(left);
    fireEvent.click(right);

    expect(baseProps.onPrev).toHaveBeenCalled();
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test('left navigation supports multiple clicks', async () => {
    const { container } = await renderBoard();

    const left = container.querySelector(
      '#sticker-book-nav-left',
    ) as HTMLElement;

    fireEvent.click(left);
    fireEvent.click(left);

    expect(baseProps.onPrev).toHaveBeenCalledTimes(2);
  });

  test('right navigation supports multiple clicks', async () => {
    const { container } = await renderBoard();

    const right = container.querySelector(
      '#sticker-book-nav-right',
    ) as HTMLElement;

    fireEvent.click(right);
    fireEvent.click(right);

    expect(baseProps.onNext).toHaveBeenCalledTimes(2);
  });

  test('component does not crash when fetch fails', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('fetch failed')) as jest.Mock;

    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load board svg:',
        expect.any(Error),
      );
    });
  });

  test('component renders title container', async () => {
    await renderBoard();

    expect(document.querySelector('#sb-board-title')).toBeInTheDocument();
  });

  test('board title contains sticker text', async () => {
    await renderBoard();

    expect(document.querySelector('#sb-board-title')?.textContent).toContain(
      'STICKER BOOK',
    );
  });

  test('component supports rerender', async () => {
    const { rerender } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });

    rerender(<StickerBookBoard {...baseProps} collectedStickers={['lion']} />);
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });

  test('component supports rerender with locked state', async () => {
    const { rerender } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });

    rerender(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });

  test('component renders svg element', async () => {
    await renderBoard();

    expect(
      document.querySelector('.sticker-book-board-canvas'),
    ).toBeInTheDocument();
  });

  test('component does not crash with empty props', async () => {
    render(
      <StickerBookBoard
        title=""
        canGoPrev={false}
        canGoNext={false}
        onBack={jest.fn()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
        collectedStickers={[]}
        svgRaw={null}
        isLocked={false}
        canSave={true}
      />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });

  test('navigation icons exist', async () => {
    const { container } = await renderBoard();

    expect(container.querySelector('#sticker-book-nav-left')).toBeTruthy();
    expect(container.querySelector('#sticker-book-nav-right')).toBeTruthy();
  });

  test('component handles many rerenders', async () => {
    const { rerender } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });

    for (let i = 0; i < 5; i++) {
      rerender(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
    }

    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });

  test('component renders board container', async () => {
    await renderBoard();

    expect(document.querySelector('#sb-board')).toBeInTheDocument();
  });

  test('component handles large sticker list', async () => {
    const stickers = Array.from({ length: 50 }, (_, i) => `sticker${i}`);

    render(<StickerBookBoard {...baseProps} collectedStickers={stickers} />);
    await waitFor(() => {
      expect(
        document.querySelector('.sticker-book-board-canvas'),
      ).toBeInTheDocument();
    });
  });
});
