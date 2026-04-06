import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
// Changes: expanded ColoringBoard tests for loading, events, and navigation.
import '@testing-library/jest-dom';
import ColoringBoard from './ColoringBoard';
import { Util } from '../../utility/util';

/* -------------------- MOCK SVG -------------------- */

jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

/* -------------------- MOCK I18N -------------------- */

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

/* -------------------- MOCK ROUTER -------------------- */

const mockReplace = jest.fn();
const mockGoBack = jest.fn();

const mockLocation: any = {
  state: undefined,
};

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    replace: mockReplace,
    goBack: mockGoBack,
  }),
  useLocation: () => mockLocation,
}));

/* -------------------- MOCK UTIL -------------------- */

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
    getCurrentStudent: () => ({ id: 'student1' }),
    sendContentToAndroidOrWebShare: jest.fn(),
    saveImage: jest.fn(),
  },
}));

/* -------------------- MOCK SVG HELPERS -------------------- */

const mockParseSvg = jest.fn();

jest.mock('../common/SvgHelpers', () => ({
  parseSvg: (...args: any[]) => mockParseSvg(...args),
  sanitizeSvg: (svg: string) => svg,
}));

jest.mock('../../utility/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

/* -------------------- MOCK CHILD COMPONENTS -------------------- */

jest.mock('./SVGScene', () => ({
  SVGScene: ({ children, svgRefExternal }: any) => {
    const mockReact = require('react');
    return (
      <div data-testid="svg-scene">
        {mockReact.cloneElement(children, { ref: svgRefExternal })}
      </div>
    );
  },
}));

jest.mock('./ColorPalette', () => (props: any) => (
  <div data-testid="color-palette">ColorPalette</div>
));

jest.mock('./PaintTopBar', () => (props: any) => (
  <button data-testid="exit-btn" onClick={props.onExit}>
    Exit
  </button>
));

jest.mock(
  './PaintExitPopup',
  () => (props: any) =>
    props.isOpen ? (
      <div data-testid="exit-popup" data-variant={props.variant ?? 'default'}>
        <button onClick={props.onExit}>confirm-exit</button>
        <button onClick={props.onStay}>stay</button>
        <button onClick={props.onClose}>close</button>
      </div>
    ) : null,
);

jest.mock('./useSvgColoring', () => ({
  useSvgColoring: () => ({
    selectedColor: '#000',
    setSelectedColor: jest.fn(),
  }),
}));

const mockSaveModal = jest.fn();
const mockToast = jest.fn();

jest.mock('../stickerBook/StickerBookSaveModal', () => ({
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

jest.mock('../stickerBook/StickerBookToast', () => ({
  __esModule: true,
  default: (props: any) => {
    mockToast(props);
    return props.isOpen ? (
      <div data-testid="sticker-book-toast">{props.text}</div>
    ) : null;
  },
}));

const mockOpenSaveModal = jest.fn();
const mockCloseSaveModal = jest.fn();
const mockCloseSaveToast = jest.fn();
const mockHandleSaveAndShare = jest.fn();

let mockHookState = {
  showSaveModal: false,
  showSaveToast: false,
  savedSvgMarkup: null as string | null,
  modalAriaLabel: 'Colored Sticker Book Saved',
  isSaving: false,
  openSaveModal: mockOpenSaveModal,
  closeSaveModal: mockCloseSaveModal,
  closeSaveToast: mockCloseSaveToast,
  handleSaveAndShare: mockHandleSaveAndShare,
};

let lastUseStickerBookSaveOptions: any = null;

jest.mock('../../hooks/useStickerBookSave', () => ({
  useStickerBookSave: (options: any) => {
    lastUseStickerBookSaveOptions = options;
    return mockHookState;
  },
}));

jest.mock('html-to-image', () => ({
  toBlob: jest.fn(),
  toPng: jest.fn(),
}));

/* -------------------- MOCK FETCH -------------------- */

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<svg></svg>'),
  }),
) as jest.Mock;

/* -------------------- TEST HELPER -------------------- */

const renderBoard = (state: any = undefined) => {
  mockLocation.state = state;

  return render(<ColoringBoard />);
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

/* ===================================================== */
/* ======================= TESTS ======================= */
/* ===================================================== */

describe('ColoringBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<svg></svg>'),
    });
    (Util.sendContentToAndroidOrWebShare as jest.Mock).mockResolvedValue(
      undefined,
    );
    (Util.saveImage as jest.Mock).mockResolvedValue(undefined);

    mockOpenSaveModal.mockImplementation((markup: string) => {
      mockHookState = {
        ...mockHookState,
        showSaveModal: true,
        savedSvgMarkup: markup,
      };
    });
    mockCloseSaveModal.mockImplementation(() => {
      mockHookState = {
        ...mockHookState,
        showSaveModal: false,
        showSaveToast: true,
      };
    });
    mockCloseSaveToast.mockImplementation(() => {
      mockHookState = { ...mockHookState, showSaveToast: false };
    });

    mockHookState = {
      showSaveModal: false,
      showSaveToast: false,
      savedSvgMarkup: null,
      modalAriaLabel: 'Colored Sticker Book Saved',
      isSaving: false,
      openSaveModal: mockOpenSaveModal,
      closeSaveModal: mockCloseSaveModal,
      closeSaveToast: mockCloseSaveToast,
      handleSaveAndShare: mockHandleSaveAndShare,
    };
    lastUseStickerBookSaveOptions = null;

    mockParseSvg.mockReturnValue({
      attrs: {},
      inner: "<circle cx='50' cy='50' r='40' />",
    });
  });

  /* ---------------- ROOT RENDER ---------------- */

  test('renders root layout', () => {
    renderBoard();

    expect(document.getElementById('coloring-board-root')).toBeInTheDocument();
  });

  /* ---------------- LOADING STATE ---------------- */

  test('shows loading initially', () => {
    renderBoard({ svgUrl: '/test.svg' });

    expect(
      document.getElementById('coloring-board-loading'),
    ).toBeInTheDocument();
  });

  /* ---------------- SVG RAW LOAD ---------------- */

  test('renders svg when svgRaw provided', async () => {
    renderBoard({
      svgRaw: '<svg></svg>',
    });

    await waitFor(() => {
      expect(screen.getByTestId('svg-scene')).toBeInTheDocument();
    });
  });

  /* ---------------- SVG URL FETCH ---------------- */

  test('fetches svg when svgUrl provided', async () => {
    renderBoard({
      svgUrl: '/test.svg',
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('svg-scene')).toBeInTheDocument();
    });
  });

  /* ---------------- EMPTY STATE ---------------- */

  test('shows empty artwork message when svg parsing fails', async () => {
    mockParseSvg.mockReturnValue(null);

    renderBoard();

    await waitFor(() => {
      expect(
        document.getElementById('coloring-board-empty'),
      ).toBeInTheDocument();
    });
  });

  /* ---------------- EXIT POPUP ---------------- */

  test('opens exit popup when exit button clicked', () => {
    renderBoard();

    fireEvent.click(screen.getByTestId('exit-btn'));

    expect(screen.getByTestId('exit-popup')).toBeInTheDocument();
    expect(screen.getByTestId('exit-popup')).toHaveAttribute(
      'data-variant',
      'default',
    );
  });

  test('uses post-save exit popup variant after a successful save', async () => {
    renderBoard({
      svgRaw: '<svg></svg>',
      returnTo: '/sticker-book',
    });

    await act(async () => {
      await lastUseStickerBookSaveOptions?.onSaveSuccess?.('colored-file.png');
    });

    fireEvent.click(screen.getByTestId('exit-btn'));

    expect(screen.getByTestId('exit-popup')).toHaveAttribute(
      'data-variant',
      'post-save-exit',
    );
  });

  /* ---------------- EXIT CONFIRM WITH RETURN ---------------- */

  test('exit confirm navigates using replace when returnTo exists', () => {
    renderBoard({
      returnTo: '/home',
    });

    fireEvent.click(screen.getByTestId('exit-btn'));

    fireEvent.click(screen.getByText('confirm-exit'));

    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  /* ---------------- EXIT CONFIRM WITHOUT RETURN ---------------- */

  test('exit confirm uses goBack when returnTo missing', () => {
    renderBoard();

    fireEvent.click(screen.getByTestId('exit-btn'));

    fireEvent.click(screen.getByText('confirm-exit'));

    expect(mockGoBack).toHaveBeenCalled();
  });
  /* ---------------- COLOR TRAY ---------------- */

  test('renders color tray', () => {
    renderBoard();

    expect(screen.getByTestId('color-palette')).toBeInTheDocument();
  });
  /* ---------------- FRAME CONTAINER ---------------- */

  test('renders svg frame container', () => {
    renderBoard();

    expect(
      document.getElementById('coloring-board-svg-frame-id'),
    ).toBeInTheDocument();
  });

  /* ---------------- FRAME ROW ---------------- */

  test('renders frame row container', () => {
    renderBoard();

    expect(
      document.getElementById('coloring-board-frame-row-id'),
    ).toBeInTheDocument();
  });

  /* ---------------- CONTROLS CONTAINER ---------------- */

  test('renders controls container', () => {
    renderBoard();

    expect(
      document.getElementById('coloring-board-controls'),
    ).toBeInTheDocument();
  });

  /* ---------------- COLOR TRAY CONTAINER ---------------- */

  test('renders tray container', () => {
    renderBoard();

    expect(document.getElementById('coloring-board-tray')).toBeInTheDocument();
  });

  /* ---------------- TOP BAR CONTAINER ---------------- */

  test('renders top bar', () => {
    renderBoard();

    expect(document.getElementById('coloring-board-top')).toBeInTheDocument();
  });

  /* ---------------- SAVE BUTTON ICON ---------------- */

  test('save button contains camera icon', () => {
    renderBoard();

    const img = screen.getByRole('img');

    expect(img).toBeInTheDocument();
  });

  /* ---------------- SAVE BUTTON TEXT ---------------- */

  test('save button text renders', () => {
    renderBoard();

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('save serializes the painted svg and calls openSaveModal', async () => {
    renderBoard({
      svgRaw: '<svg></svg>',
      artworkTitle: 'Animals',
    });

    await screen.findByTestId('svg-scene');

    fireEvent.click(screen.getByText('Save'));

    expect(mockOpenSaveModal).toHaveBeenCalledWith(
      expect.stringContaining('<svg'),
    );
  });

  test('modal onAnimationComplete is wired to handleSaveAndShare', () => {
    renderBoard({
      svgRaw: '<svg></svg>',
      artworkTitle: 'Animals',
    });

    const modalProps = getLastModalProps();
    expect(modalProps?.onAnimationComplete).toBe(mockHandleSaveAndShare);
  });

  test('modal and toast callbacks are wired to the hook', () => {
    renderBoard({
      svgRaw: '<svg></svg>',
      artworkTitle: 'Animals',
    });

    const modalProps = getLastModalProps();
    expect(modalProps?.onClose).toBe(mockCloseSaveModal);

    const toastProps = getLastToastProps();
    expect(toastProps?.onClose).toBe(mockCloseSaveToast);
  });

  /* ---------------- SVG SCENE MODE ---------------- */

  test('SVGScene renders when parsedSvg exists', async () => {
    renderBoard({
      svgRaw: '<svg></svg>',
    });

    await screen.findByTestId('svg-scene');
  });

  /* ---------------- FETCH CALLED ON URL ---------------- */

  test('fetch called with correct svg url', async () => {
    renderBoard({
      svgUrl: '/paint.svg',
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/paint.svg');
    });
  });

  /* ---------------- EXIT POPUP CLOSE ---------------- */

  test('clicking close hides exit popup', () => {
    renderBoard();

    fireEvent.click(screen.getByTestId('exit-btn'));

    fireEvent.click(screen.getByText('close'));

    expect(screen.queryByTestId('exit-popup')).not.toBeInTheDocument();
  });

  /* ---------------- EXIT POPUP MULTIPLE OPEN ---------------- */

  test('exit popup opens multiple times', () => {
    renderBoard();

    fireEvent.click(screen.getByTestId('exit-btn'));
    fireEvent.click(screen.getByText('close'));

    fireEvent.click(screen.getByTestId('exit-btn'));

    expect(screen.getByTestId('exit-popup')).toBeInTheDocument();
  });

  /* ---------------- NO ROUTE STATE ---------------- */

  test('works without route state', () => {
    renderBoard(undefined);

    expect(document.getElementById('coloring-board-root')).toBeInTheDocument();
  });

  /* ---------------- SVG RAW PRIORITY ---------------- */

  test('svgRaw loads without calling fetch', async () => {
    renderBoard({
      svgRaw: '<svg></svg>',
    });

    await screen.findByTestId('svg-scene');

    expect(fetch).not.toHaveBeenCalled();
  });

  /* ---------------- FETCH CALLED ONLY ONCE ---------------- */

  test('fetch called only once', async () => {
    renderBoard({
      svgUrl: '/test.svg',
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  /* ---------------- EXIT WITHOUT STATE ---------------- */

  test('exit works without location state', () => {
    renderBoard();

    fireEvent.click(screen.getByTestId('exit-btn'));
    fireEvent.click(screen.getByText('confirm-exit'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  /* ---------------- EXIT WITH RETURN PATH ---------------- */

  test('exit replaces path when returnTo provided', () => {
    renderBoard({
      returnTo: '/dashboard',
    });

    fireEvent.click(screen.getByTestId('exit-btn'));
    fireEvent.click(screen.getByText('confirm-exit'));

    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  /* ---------------- CAMERA ICON ALT TEXT ---------------- */

  test('camera icon has alt text', () => {
    renderBoard();

    const img = screen.getByAltText('Save');

    expect(img).toBeInTheDocument();
  });

  /* ---------------- SVG FRAME ALWAYS EXISTS ---------------- */

  test('svg frame exists even before svg loads', () => {
    renderBoard();

    expect(
      document.getElementById('coloring-board-svg-frame-id'),
    ).toBeInTheDocument();
  });

  /* ---------------- EXIT BUTTON EXISTS ---------------- */

  test('exit button exists', () => {
    renderBoard();

    expect(screen.getByTestId('exit-btn')).toBeInTheDocument();
  });

  /* ---------------- COLOR TRAY ALWAYS RENDERED ---------------- */

  test('color tray always visible', () => {
    renderBoard();

    expect(screen.getByTestId('color-palette')).toBeVisible();
  });
});
