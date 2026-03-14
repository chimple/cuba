import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toBlob } from 'html-to-image';
import StickerBookCompletionPopup, {
  StickerBookCompletionData,
} from './StickerBookCompletionPopup';
import { Util } from '../../utility/util';
import { EVENTS, PAGES } from '../../common/constants';

const mockPush = jest.fn();
const mockToBlob = toBlob as jest.MockedFunction<typeof toBlob>;
const originalFetch = global.fetch;

jest.mock('react-router', () => ({
  useHistory: () => ({
    push: mockPush,
  }),
}));

jest.mock('html-to-image', () => ({
  toBlob: jest.fn(),
}));

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
    getCurrentStudent: jest.fn(() => ({ id: 'student-1' })),
    sendContentToAndroidOrWebShare: jest.fn(),
  },
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../coloring/SVGScene', () => ({
  SVGScene: ({ children, ...props }: any) => (
    <div data-testid="svg-scene" data-scene-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

jest.mock(
  '../../assets/images/newWhole_layout.svg',
  () => 'fallback-layout.svg',
);
jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

const buildData = (
  override: Partial<StickerBookCompletionData> = {},
): StickerBookCompletionData => ({
  source: 'learning_pathway',
  stickerBookId: 'book-1',
  stickerBookTitle: 'Bug & Bloom / Final Page',
  stickerBookSvgUrl: 'https://example.com/sticker-book.svg',
  collectedStickerIds: [
    'slot-1',
    'slot-2',
    'slot-3',
    'slot-4',
    'slot-5',
    'slot-6',
  ],
  totalStickerCount: 6,
  ...override,
});

const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <g data-slot-id="slot-1"><circle cx="10" cy="10" r="5" fill="#111" /></g>
  <g data-slot-id="slot-2"><circle cx="20" cy="20" r="5" fill="#222" /></g>
</svg>
`;

describe('StickerBookCompletionPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-1' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgMarkup,
    } as Response);
    mockToBlob.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('renders loading state and then the sticker book scene', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    expect(screen.getByText('loading')).toBeInTheDocument();
    await screen.findByTestId('svg-scene');
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  test('fetches the provided sticker book svg url', async () => {
    render(
      <StickerBookCompletionPopup
        data={buildData({
          stickerBookSvgUrl: 'https://example.com/custom.svg',
        })}
        onClose={jest.fn()}
      />,
    );

    await screen.findByTestId('svg-scene');
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/custom.svg');
  });

  test('falls back to the local layout when primary fetch rejects', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg viewBox='0 0 10 10'></svg>",
      } as Response);

    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('falls back to the local layout when primary fetch returns ok false', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg viewBox='0 0 10 10'></svg>",
      } as Response);

    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  test('renders dialog accessibility attributes and translated labels', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Bug & Bloom / Final Page',
    });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Paint' })).toBeInTheDocument();
  });

  test('clicking the close button closes with close_button reason', async () => {
    const onClose = jest.fn();
    render(<StickerBookCompletionPopup data={buildData()} onClose={onClose} />);

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledWith('close_button');
  });

  test('clicking the overlay closes with backdrop reason', async () => {
    const onClose = jest.fn();
    const { container } = render(
      <StickerBookCompletionPopup data={buildData()} onClose={onClose} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(
      container.querySelector('.StickerBookCompletionPopup-overlay') as Element,
    );

    expect(onClose).toHaveBeenCalledWith('backdrop');
  });

  test('clicking inside the modal does not trigger backdrop close', async () => {
    const onClose = jest.fn();
    const { container } = render(
      <StickerBookCompletionPopup data={buildData()} onClose={onClose} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(
      container.querySelector('.StickerBookCompletionPopup-modal') as Element,
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  test('save logs analytics with sticker page info', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE_CLICKED,
      expect.objectContaining({
        user_id: 'student-1',
        sticker_book_id: 'book-1',
        sticker_book_title: 'Bug & Bloom / Final Page',
        collected_count: 6,
        total_stickers: 6,
      }),
    );
  });

  test('save generates a shareable png file with a sanitized filename', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(Util.sendContentToAndroidOrWebShare).toHaveBeenCalledTimes(1),
    );
    const sentFiles = (Util.sendContentToAndroidOrWebShare as jest.Mock).mock
      .calls[0][3];
    expect(sentFiles).toHaveLength(1);
    expect(sentFiles[0]).toBeInstanceOf(File);
    expect(sentFiles[0].name).toBe('Bug_Bloom_Final_Page.png');
  });

  test('save passes expected snapshot options to html-to-image', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockToBlob).toHaveBeenCalled());
    expect(mockToBlob).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        cacheBust: true,
        backgroundColor: '#bee7de',
        pixelRatio: 2,
      }),
    );
  });

  test('save button is disabled while the snapshot is being created', async () => {
    let resolveBlob: ((value: Blob | null) => void) | null = null;
    mockToBlob.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBlob = resolve;
        }),
    );

    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );
    await screen.findByTestId('svg-scene');

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();

    await act(async () => {
      resolveBlob?.(new Blob(['png'], { type: 'image/png' }));
      await Promise.resolve();
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
  });

  test('save does not share when html-to-image returns null', async () => {
    mockToBlob.mockResolvedValue(null);
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockToBlob).toHaveBeenCalled());
    expect(Util.sendContentToAndroidOrWebShare).not.toHaveBeenCalled();
  });

  test('save handles share errors and re-enables the button', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Util.sendContentToAndroidOrWebShare as jest.Mock).mockRejectedValueOnce(
      new Error('share failed'),
    );

    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );
    await screen.findByTestId('svg-scene');

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(Util.sendContentToAndroidOrWebShare).toHaveBeenCalledTimes(1),
    );
    expect(saveButton).not.toBeDisabled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('paint logs analytics with sticker page info', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Paint' }));

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT_CLICKED,
      expect.objectContaining({
        user_id: 'student-1',
        sticker_book_id: 'book-1',
        collected_count: 6,
      }),
    );
  });

  test('paint navigates to the existing coloring board with sticker book state', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Paint' }));

    expect(mockPush).toHaveBeenCalledWith(PAGES.COLORING_BOARD, {
      stickerBookId: 'book-1',
      stickerBookSvgUrl: 'https://example.com/sticker-book.svg',
      collectedStickerIds: [
        'slot-1',
        'slot-2',
        'slot-3',
        'slot-4',
        'slot-5',
        'slot-6',
      ],
    });
  });

  test('renders svg scene with preview-mode sticker props', async () => {
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    const scene = await screen.findByTestId('svg-scene');
    const props = JSON.parse(scene.getAttribute('data-scene-props') || '{}');

    expect(props.mode).toBe('preview');
    expect(props.sceneWidth).toBe('100%');
    expect(props.isDragEnabled).toBe(false);
    expect(props.stickerVisibilityMode).toBe('strict');
    expect(props.showUncollectedStickers).toBe(false);
    expect(props.collectedStickers).toEqual([
      'slot-1',
      'slot-2',
      'slot-3',
      'slot-4',
      'slot-5',
      'slot-6',
    ]);
  });

  test('renders the inline svg with its original attributes', async () => {
    const { container } = render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    const svg = container.querySelector('.StickerBookCompletionPopup-book svg');

    expect(svg).toHaveAttribute('viewBox', '0 0 100 80');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('width', '100%');
    expect(svg).toHaveAttribute('height', '100%');
  });

  test('re-fetches when stickerBookSvgUrl changes on rerender', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg viewBox='0 0 10 10'><rect id='a' /></svg>",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg viewBox='0 0 10 10'><rect id='b' /></svg>",
      } as Response);

    const { rerender } = render(
      <StickerBookCompletionPopup
        data={buildData({ stickerBookSvgUrl: 'https://example.com/a.svg' })}
        onClose={jest.fn()}
      />,
    );
    await screen.findByTestId('svg-scene');

    rerender(
      <StickerBookCompletionPopup
        data={buildData({ stickerBookSvgUrl: 'https://example.com/b.svg' })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://example.com/b.svg',
      ),
    );
  });

  test('does not crash if the component unmounts before fetch resolves', async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { unmount } = render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );
    unmount();

    await act(async () => {
      resolveFetch?.({
        ok: true,
        text: async () => svgMarkup,
      } as Response);
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('uses unknown user id in analytics when no current student is available', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValueOnce(null);
    render(
      <StickerBookCompletionPopup data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('svg-scene');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE_CLICKED,
      expect.objectContaining({
        user_id: 'unknown',
      }),
    );
  });
});
