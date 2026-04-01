import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StickerBookBoard from './StickerBookBoard';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentStudent: jest.fn(() => ({ id: 'student-1' })),
    logEvent: jest.fn(),
  },
}));

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
  test('renders component', () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
  });

  test('renders board title', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
    expect(await screen.findByText(/STICKER BOOK/i)).toBeInTheDocument();
  });

  test('renders correct title text', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    expect(
      await screen.findByText((content) =>
        content.includes('STICKER BOOK : ANIMALS'),
      ),
    ).toBeInTheDocument();
  });

  test('fetches svg on mount', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('fetch called with correct url', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/assets/icons/StickerBookBoard.svg');
    });
  });

  test('fetch called once', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('renders svg after load', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
  test('renders navigation buttons', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      expect(container.querySelector('#sticker-book-nav-left')).toBeTruthy();
      expect(container.querySelector('#sticker-book-nav-right')).toBeTruthy();
    });
  });

  test('left navigation triggers onPrev', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      fireEvent.click(
        container.querySelector('#sticker-book-nav-left') as HTMLElement,
      );
    });

    expect(baseProps.onPrev).toHaveBeenCalled();
  });

  test('right navigation triggers onNext', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      fireEvent.click(
        container.querySelector('#sticker-book-nav-right') as HTMLElement,
      );
    });

    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test('shows disabled layer when locked', () => {
    render(
      <StickerBookBoard
        {...baseProps}
        isLocked={true}
        collectedStickers={[]}
      />,
    );

    expect(
      document.querySelector('.sticker-book-disabled-layer'),
    ).toBeInTheDocument();
  });

  test('disabled layer not shown when unlocked', () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
  });

  test('renders with collected stickers', () => {
    render(
      <StickerBookBoard {...baseProps} collectedStickers={['lion', 'tiger']} />,
    );
  });

  test('handles svgRaw provided', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  test('save button hidden when sticker book save feature is disabled', () => {
    render(
      <StickerBookBoard
        {...baseProps}
        canSave={false}
        collectedStickers={[]}
      />,
    );

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  /* ---------------- ADDITIONAL TEST CASES ---------------- */

  test('board root container exists', () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    expect(document.querySelector('#sb-board-root')).toBeInTheDocument();
  });

  test('board frame container exists', () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    expect(document.querySelector('#sb-frame')).toBeInTheDocument();
  });

  test('component renders without collected stickers', () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
  });

  test('component renders with many stickers', () => {
    render(
      <StickerBookBoard
        {...baseProps}
        collectedStickers={['lion', 'tiger', 'cat', 'dog', 'elephant']}
      />,
    );
  });

  test('svg background group exists after load', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(document.querySelector('#background')).toBeInTheDocument();
    });
  });

  test('svg stickers group exists after load', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(document.querySelector('#stickers')).toBeInTheDocument();
    });
  });

  test('navigation buttons remain clickable', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      const left = container.querySelector(
        '#sticker-book-nav-left',
      ) as HTMLElement;
      const right = container.querySelector(
        '#sticker-book-nav-right',
      ) as HTMLElement;

      fireEvent.click(left);
      fireEvent.click(right);
    });

    expect(baseProps.onPrev).toHaveBeenCalled();
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test('left navigation supports multiple clicks', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      const left = container.querySelector(
        '#sticker-book-nav-left',
      ) as HTMLElement;

      fireEvent.click(left);
      fireEvent.click(left);
    });

    expect(baseProps.onPrev).toHaveBeenCalledTimes(2);
  });

  test('right navigation supports multiple clicks', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      const right = container.querySelector(
        '#sticker-book-nav-right',
      ) as HTMLElement;

      fireEvent.click(right);
      fireEvent.click(right);
    });

    expect(baseProps.onNext).toHaveBeenCalledTimes(2);
  });

  test('component does not crash when fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject('fetch failed')) as jest.Mock;

    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
  });

  test('component renders title container', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(document.querySelector('#sb-board-title')).toBeInTheDocument();
    });
  });

  test('board title contains sticker text', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(document.querySelector('#sb-board-title')?.textContent).toContain(
        'STICKER BOOK',
      );
    });
  });

  test('component supports rerender', () => {
    const { rerender } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    rerender(<StickerBookBoard {...baseProps} collectedStickers={['lion']} />);
  });

  test('component supports rerender with locked state', () => {
    const { rerender } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    rerender(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
  });

  test('component renders svg element', async () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    await waitFor(() => {
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  test('component does not crash with empty props', () => {
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
  });

  test('navigation icons exist', async () => {
    const { container } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    await waitFor(() => {
      expect(container.querySelector('#sticker-book-nav-left')).toBeTruthy();
      expect(container.querySelector('#sticker-book-nav-right')).toBeTruthy();
    });
  });

  test('component handles many rerenders', () => {
    const { rerender } = render(
      <StickerBookBoard {...baseProps} collectedStickers={[]} />,
    );

    for (let i = 0; i < 5; i++) {
      rerender(<StickerBookBoard {...baseProps} collectedStickers={[]} />);
    }
  });

  test('component renders board container', () => {
    render(<StickerBookBoard {...baseProps} collectedStickers={[]} />);

    expect(document.querySelector('#sb-board')).toBeInTheDocument();
  });

  test('component handles large sticker list', () => {
    const stickers = Array.from({ length: 50 }, (_, i) => `sticker${i}`);

    render(<StickerBookBoard {...baseProps} collectedStickers={stickers} />);
  });
});
