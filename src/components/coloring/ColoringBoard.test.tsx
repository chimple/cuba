import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Changes: expanded ColoringBoard tests for loading, events, and navigation.
import '@testing-library/jest-dom';
import ColoringBoard from './ColoringBoard';

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
  },
}));

/* -------------------- MOCK SVG HELPERS -------------------- */

const mockParseSvg = jest.fn();

jest.mock('../common/SvgHelpers', () => ({
  parseSvg: (...args: any[]) => mockParseSvg(...args),
  sanitizeSvg: (svg: string) => svg,
}));

/* -------------------- MOCK CHILD COMPONENTS -------------------- */

jest.mock('./SVGScene', () => ({
  SVGScene: ({ children }: any) => (
    <div data-testid="svg-scene">{children}</div>
  ),
}));

jest.mock('./ColorTray', () => (props: any) => (
  <div data-testid="color-tray">ColorTray</div>
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
      <div data-testid="exit-popup">
        <button onClick={props.onExit}>confirm-exit</button>
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

/* ===================================================== */
/* ======================= TESTS ======================= */
/* ===================================================== */

describe('ColoringBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

    expect(screen.getByTestId('color-tray')).toBeInTheDocument();
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

  /* ---------------- SVG SCENE MODE ---------------- */

  test('SVGScene renders when parsedSvg exists', async () => {
    renderBoard({
      svgRaw: '<svg></svg>',
    });

    await waitFor(() =>
      expect(screen.getByTestId('svg-scene')).toBeInTheDocument(),
    );
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

    await waitFor(() =>
      expect(screen.getByTestId('svg-scene')).toBeInTheDocument(),
    );

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

    expect(screen.getByTestId('color-tray')).toBeVisible();
  });
});
