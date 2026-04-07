import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import StickerBookPreviewModal, {
  StickerBookModalData,
} from './StickerBookPreviewModal';
import { Util } from '../../utility/util';
import { EVENTS, PAGES } from '../../common/constants';
import { AudioUtil } from '../../utility/AudioUtil';

const originalFetch = global.fetch;
const mockPush = jest.fn();

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

jest.mock('react-router', () => ({
  useHistory: () => ({
    push: mockPush,
  }),
}));

jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
    getCurrentStudent: jest.fn(() => ({ id: 'student-1' })),
  },
}));

const mockOpenSaveModal = jest.fn();
const mockCloseSaveModal = jest.fn();
const mockCloseSaveToast = jest.fn();
const mockHandleSaveAndShare = jest.fn();

let mockSaveHookState = {
  isSaving: false,
  showSaveModal: false,
  showSaveToast: false,
  savedSvgMarkup: null as string | null,
  openSaveModal: mockOpenSaveModal,
  closeSaveModal: mockCloseSaveModal,
  closeSaveToast: mockCloseSaveToast,
  handleSaveAndShare: mockHandleSaveAndShare,
};

jest.mock('../../hooks/useStickerBookSave', () => ({
  useStickerBookSave: () => mockSaveHookState,
}));

jest.mock('../stickerBook/StickerBookSaveModal', () => ({
  __esModule: true,
  default: (props: any) =>
    props.open ? (
      <div data-testid="sticker-book-save-modal">
        <button
          data-testid="sticker-book-save-modal-close"
          onClick={props.onClose}
        >
          close modal
        </button>
        <button
          data-testid="sticker-book-save-modal-finish"
          onClick={props.onAnimationComplete}
        >
          finish animation
        </button>
        <div data-testid="sticker-book-save-modal-markup">
          {props.svgMarkup}
        </div>
      </div>
    ) : null,
}));

jest.mock('../stickerBook/StickerBookToast', () => ({
  __esModule: true,
  default: (props: any) =>
    props.isOpen ? (
      <div data-testid="sticker-book-toast">{props.text}</div>
    ) : null,
}));

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn().mockResolvedValue(true),
    stopAudioUrlOrTtsPlayback: jest.fn().mockResolvedValue(undefined),
    getLocalizedAudioUrl: jest.fn(),
  },
}));

const buildData = (
  override: Partial<StickerBookModalData> = {},
): StickerBookModalData => ({
  source: 'learning_pathway',
  stickerBookId: 'book-1',
  stickerBookTitle: 'Book 1',
  stickerBookSvgUrl: 'https://example.com/sticker-book.svg',
  collectedStickerIds: ['slot-collected'],
  nextStickerId: 'slot-next',
  nextStickerName: 'Rocket',
  nextStickerImage: 'https://example.com/rocket.png',
  ...override,
});

const buildCompletionData = (
  override: Partial<StickerBookModalData> = {},
): StickerBookModalData => ({
  source: 'learning_pathway',
  stickerBookId: 'book-complete',
  stickerBookTitle: 'Completed Book',
  stickerBookSvgUrl: 'https://example.com/completed.svg',
  collectedStickerIds: ['slot-collected', 'slot-next', 'slot-locked'],
  totalStickerCount: 6,
  ...override,
});

const svgWithSlots = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g data-slot-id="slot-collected">
    <rect x="0" y="0" width="10" height="10" fill="#111111" stroke="#222222" fill-opacity="0.3" stroke-opacity="0.3" />
  </g>
  <g data-slot-id="slot-next">
    <circle cx="20" cy="20" r="6" fill="#333333" stroke="#444444" />
  </g>
  <g data-slot-id="slot-locked">
    <rect x="35" y="10" width="12" height="12" fill="#555555" stroke="#666666" />
  </g>
</svg>
`;

const svgWithNoneFillStroke = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <g data-slot-id="slot-next">
    <rect x="10" y="10" width="30" height="30" fill="none" stroke="none" />
  </g>
</svg>
`;

const svgWithoutSlots = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="5" width="90" height="90" fill="#ececec" />
</svg>
`;

describe('StickerBookPreviewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AudioUtil.getLocalizedAudioUrl as jest.Mock).mockImplementation(
      async (folder: string, clipName: string) =>
        `/assets/audios/${folder}/en_${clipName}.mp3`,
    );
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-1' });
    mockSaveHookState = {
      isSaving: false,
      showSaveModal: false,
      showSaveToast: false,
      savedSvgMarkup: null,
      openSaveModal: mockOpenSaveModal,
      closeSaveModal: mockCloseSaveModal,
      closeSaveToast: mockCloseSaveToast,
      handleSaveAndShare: mockHandleSaveAndShare,
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('renders loading state and then sticker book SVG', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    expect(
      screen.getByTestId('StickerBookPreviewModal-loading'),
    ).toBeInTheDocument();
    await screen.findByTestId('StickerBookPreviewModal-book');
    expect(
      screen.queryByTestId('StickerBookPreviewModal-loading'),
    ).not.toBeInTheDocument();
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/common/generic_sound_effect.mp3',
      delayMs: 300,
      onComplete: expect.any(Function),
      onCompleteDelayMs: 300,
    });

    const firstCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[0]?.[0];
    await act(async () => {
      await firstCall.onComplete();
    });

    expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
      'stickerbookFirstPopup',
      'popup_current_sticker',
    );
    expect(AudioUtil.playAudioOrTts).toHaveBeenLastCalledWith({
      audioUrl:
        '/assets/audios/stickerbookFirstPopup/en_popup_current_sticker.mp3',
      text: 'Finish the pathway & collect this Rocket.',
    });
  });

  test('applies collected/next/locked styles to sticker slots', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    const collected = container.querySelector(
      '[data-slot-id="slot-collected"] rect',
    ) as SVGRectElement;
    const next = container.querySelector(
      '[data-slot-id="slot-next"] circle',
    ) as SVGCircleElement;
    const locked = container.querySelector(
      '[data-slot-id="slot-locked"] rect',
    ) as SVGRectElement;

    expect(collected.getAttribute('fill')).toBe('#111111');
    expect(collected.getAttribute('stroke')).toBe('#222222');
    expect(collected.getAttribute('fill-opacity')).toBe('0.3');
    expect(collected.getAttribute('stroke-opacity')).toBe('0.3');
    expect(collected.style.fill).toBe('');
    expect(collected.style.stroke).toBe('');
    expect(next.getAttribute('fill')).toBe('#D1D2D4');
    expect(next.getAttribute('stroke')).toBe('#D1D2D4');
    expect(next.style.fill).toBe('#D1D2D4');
    expect(next.style.stroke).toBe('#D1D2D4');
    expect(locked.getAttribute('fill')).toBe('#FFFFFF');
    expect(locked.getAttribute('stroke')).toBe('#FFFFFF');
  });

  test('closes with close_button when close icon is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    render(<StickerBookPreviewModal data={buildData()} onClose={onClose} />);
    await screen.findByTestId('StickerBookPreviewModal-book');
    fireEvent.click(screen.getByTestId('StickerBookPreviewModal-close'));

    expect(onClose).toHaveBeenCalledWith('close_button');
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });

  test('closes with backdrop when overlay is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    render(<StickerBookPreviewModal data={buildData()} onClose={onClose} />);
    await screen.findByTestId('StickerBookPreviewModal-book');
    fireEvent.click(screen.getByTestId('StickerBookPreviewModal-overlay'));

    expect(onClose).toHaveBeenCalledWith('backdrop');
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });

  test('replays audio when speaker button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await screen.findByTestId('StickerBookPreviewModal-book');
    fireEvent.click(screen.getByRole('button', { name: 'Replay audio' }));

    await waitFor(() =>
      expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenLastCalledWith(
        'stickerbookFirstPopup',
        'popup_current_sticker',
      ),
    );
    expect(AudioUtil.playAudioOrTts).toHaveBeenLastCalledWith({
      audioUrl:
        '/assets/audios/stickerbookFirstPopup/en_popup_current_sticker.mp3',
      text: 'Finish the pathway & collect this Rocket.',
    });
  });

  test('falls back to local layout when sticker book fetch fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          "<svg><g data-slot-id='fallback-slot'><rect /></g></svg>",
      } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await screen.findByTestId('StickerBookPreviewModal-book');
    expect(
      (global.fetch as jest.Mock).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    warnSpy.mockRestore();
  });

  test('calls fetch with provided stickerBookSvgUrl', async () => {
    const data = buildData({
      stickerBookSvgUrl: 'https://example.com/custom-book.svg',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={data} onClose={jest.fn()} />);

    await screen.findByTestId('StickerBookPreviewModal-book');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/custom-book.svg',
    );
  });

  test('falls back when primary fetch returns ok=false', async () => {
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
        text: async () =>
          "<svg><g data-slot-id='fallback-a'><rect /></g></svg>",
      } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await screen.findByTestId('StickerBookPreviewModal-book');
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    warnSpy.mockRestore();
  });

  test('renders provided nextStickerImage with alt text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(
      <StickerBookPreviewModal
        data={buildData({
          nextStickerName: 'Super Rocket',
          nextStickerImage: 'https://cdn.test/super.png',
        })}
        onClose={jest.fn()}
      />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');
    const image = screen.getByTestId(
      'StickerBookPreviewModal-next-image',
    ) as HTMLImageElement;
    expect(image.alt).toBe('Super Rocket');
    expect(image.src).toContain('https://cdn.test/super.png');
  });

  test('uses default icon when nextStickerImage is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(
      <StickerBookPreviewModal
        data={buildData({ nextStickerImage: undefined })}
        onClose={jest.fn()}
      />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');
    const image = screen.getByTestId(
      'StickerBookPreviewModal-next-image',
    ) as HTMLImageElement;
    expect(image.src).toContain('assets/icons/DefaultIcon.png');
  });

  test('exposes expected base test IDs for key modal sections', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await screen.findByTestId('StickerBookPreviewModal-book');
    expect(
      screen.getByTestId('StickerBookPreviewModal-overlay'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-modal'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-close'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-book-frame'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-bottom-strip'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-helper-text'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-next-name'),
    ).toBeInTheDocument();
  });

  test('clicking inside modal body does not trigger backdrop close', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    render(<StickerBookPreviewModal data={buildData()} onClose={onClose} />);
    await screen.findByTestId('StickerBookPreviewModal-book');

    fireEvent.click(screen.getByTestId('StickerBookPreviewModal-modal'));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('renders accessibility attributes for dialog and close button', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);
    await screen.findByTestId('StickerBookPreviewModal-book');

    const overlay = screen.getByTestId('StickerBookPreviewModal-overlay');
    const modal = screen.getByTestId('StickerBookPreviewModal-modal');
    const closeButton = screen.getByTestId('StickerBookPreviewModal-close');

    expect(overlay).toHaveAttribute('role', 'presentation');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(closeButton).toHaveAttribute(
      'aria-label',
      'close-sticker-book-preview',
    );
  });

  test('renders parsed inline svg element with original attributes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    const svg = container.querySelector(
      '.StickerBookPreviewModal-book svg',
    ) as SVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
  });

  test('sets slot container opacity to 1 for all slot states', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    const collectedSlot = container.querySelector(
      '[data-slot-id="slot-collected"]',
    ) as HTMLElement;
    const nextSlot = container.querySelector(
      '[data-slot-id="slot-next"]',
    ) as HTMLElement;
    const lockedSlot = container.querySelector(
      '[data-slot-id="slot-locked"]',
    ) as HTMLElement;

    expect(collectedSlot.style.opacity).toBe('1');
    expect(nextSlot.style.opacity).toBe('1');
    expect(lockedSlot.style.opacity).toBe('1');
  });

  test('does not overwrite fill/stroke when original shape uses none', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithNoneFillStroke,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal
        data={buildData({
          nextStickerId: 'slot-next',
          collectedStickerIds: [],
        })}
        onClose={jest.fn()}
      />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    const shape = container.querySelector(
      '[data-slot-id="slot-next"] rect',
    ) as SVGRectElement;
    expect(shape.getAttribute('fill')).toBe('#D1D2D4');
    expect(shape.getAttribute('stroke')).toBe('#D1D2D4');
    expect(shape.getAttribute('fill-opacity')).toBeNull();
    expect(shape.getAttribute('stroke-opacity')).toBeNull();
  });

  test('renders normally when SVG has no data-slot-id elements', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithoutSlots,
    } as Response);

    render(<StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />);

    await screen.findByTestId('StickerBookPreviewModal-book');
    expect(
      screen.queryByTestId('StickerBookPreviewModal-loading'),
    ).not.toBeInTheDocument();
  });

  test('re-fetches and re-renders when stickerBookSvgUrl changes', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === 'https://example.com/book-a.svg') {
        return Promise.resolve({
          ok: true,
          text: async () =>
            "<svg><g data-slot-id='slot-a'><rect fill='#111111' stroke='#111111' /></g></svg>",
        } as Response);
      }

      if (url === 'https://example.com/book-b.svg') {
        return Promise.resolve({
          ok: true,
          text: async () =>
            "<svg><g data-slot-id='slot-b'><rect fill='#222222' stroke='#222222' /></g></svg>",
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const { rerender, container } = render(
      <StickerBookPreviewModal
        data={buildData({
          stickerBookSvgUrl: 'https://example.com/book-a.svg',
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot-id="slot-a"]'),
      ).toBeInTheDocument(),
    );

    rerender(
      <StickerBookPreviewModal
        data={buildData({
          stickerBookSvgUrl: 'https://example.com/book-b.svg',
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot-id="slot-b"]'),
      ).toBeInTheDocument(),
    );
    const fetchUrls = (global.fetch as jest.Mock).mock.calls.map(
      (call) => call[0],
    );
    expect(fetchUrls).toContain('https://example.com/book-a.svg');
    expect(fetchUrls).toContain('https://example.com/book-b.svg');
  });

  test('updates slot styling when collectedStickerIds changes on rerender', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { rerender, container } = render(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: [],
          nextStickerId: 'slot-next',
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot-id="slot-collected"] rect'),
      ).toBeInTheDocument(),
    );

    let target = container.querySelector(
      '[data-slot-id="slot-collected"] rect',
    ) as SVGRectElement;
    expect(target.getAttribute('fill')).toBe('#FFFFFF');

    rerender(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: ['slot-collected'],
          nextStickerId: 'slot-next',
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      const updated = container.querySelector(
        '[data-slot-id="slot-collected"] rect',
      ) as SVGRectElement;
      expect(updated.getAttribute('fill')).toBe('#111111');
      expect(updated.getAttribute('stroke')).toBe('#222222');
      expect(updated.getAttribute('fill-opacity')).toBe('0.3');
      expect(updated.getAttribute('stroke-opacity')).toBe('0.3');
      expect(updated.style.fill).toBe('');
      expect(updated.style.stroke).toBe('');
    });
  });

  test('shows previously collected stickers in preview mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: ['slot-collected'],
          nextStickerId: 'slot-next',
        })}
        onClose={jest.fn()}
      />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    const collected = container.querySelector(
      '[data-slot-id="slot-collected"] rect',
    ) as SVGRectElement;
    const next = container.querySelector(
      '[data-slot-id="slot-next"] circle',
    ) as SVGCircleElement;
    const locked = container.querySelector(
      '[data-slot-id="slot-locked"] rect',
    ) as SVGRectElement;

    expect(collected.getAttribute('fill')).toBe('#111111');
    expect(collected.getAttribute('stroke')).toBe('#222222');
    expect(next.getAttribute('fill')).toBe('#D1D2D4');
    expect(locked.getAttribute('fill')).toBe('#FFFFFF');
  });

  test('keeps drag_collect slot state stable when collectedStickerIds mutates after open', async () => {
    jest.spyOn(Util, 'logEvent').mockResolvedValue(undefined as never);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const collectedStickerIds = ['slot-collected'];

    const { rerender, container } = render(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds,
          nextStickerId: 'slot-next',
        })}
        variant="drag_collect"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot-id="slot-next"] circle'),
      ).toBeInTheDocument(),
    );

    const initialNext = container.querySelector(
      '[data-slot-id="slot-next"] circle',
    ) as SVGCircleElement;
    const initialLocked = container.querySelector(
      '[data-slot-id="slot-locked"] rect',
    ) as SVGRectElement;
    expect(initialNext.getAttribute('fill')).toBe('#D1D2D4');
    expect(initialLocked.getAttribute('fill')).toBe('#FFFFFF');

    collectedStickerIds.push('slot-next', 'slot-locked');

    rerender(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds,
          nextStickerId: 'slot-next',
        })}
        variant="drag_collect"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      const nextAfterMutation = container.querySelector(
        '[data-slot-id="slot-next"] circle',
      ) as SVGCircleElement;
      const lockedAfterMutation = container.querySelector(
        '[data-slot-id="slot-locked"] rect',
      ) as SVGRectElement;
      expect(nextAfterMutation.getAttribute('fill')).toBe('#D1D2D4');
      expect(lockedAfterMutation.getAttribute('fill')).toBe('#FFFFFF');
    });
  });

  test('updates drag_collect target slot when nextStickerId changes between opens', async () => {
    jest.spyOn(Util, 'logEvent').mockResolvedValue(undefined as never);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { rerender, container } = render(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: ['slot-collected'],
          nextStickerId: 'slot-next',
        })}
        variant="drag_collect"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot-id="slot-next"] circle'),
      ).toBeInTheDocument(),
    );

    rerender(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: ['slot-collected', 'slot-next'],
          nextStickerId: 'slot-locked',
        })}
        variant="drag_collect"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      const previousNext = container.querySelector(
        '[data-slot-id="slot-next"] circle',
      ) as SVGCircleElement;
      const newNext = container.querySelector(
        '[data-slot-id="slot-locked"] rect',
      ) as SVGRectElement;

      expect(previousNext.getAttribute('fill')).toBe('#333333');
      expect(newNext.getAttribute('fill')).toBe('#D1D2D4');
    });
  });

  test('treats all uncollected slots as locked when nextStickerId is not present in SVG', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const { container } = render(
      <StickerBookPreviewModal
        data={buildData({
          collectedStickerIds: [],
          nextStickerId: 'slot-not-present',
        })}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-slot-id="slot-next"] circle'),
      ).toBeInTheDocument(),
    );

    const nextSlotShape = container.querySelector(
      '[data-slot-id="slot-next"] circle',
    ) as SVGCircleElement;
    const lockedSlotShape = container.querySelector(
      '[data-slot-id="slot-locked"] rect',
    ) as SVGRectElement;
    expect(nextSlotShape.getAttribute('fill')).toBe('#FFFFFF');
    expect(nextSlotShape.getAttribute('stroke')).toBe('#FFFFFF');
    expect(lockedSlotShape.getAttribute('fill')).toBe('#FFFFFF');
    expect(lockedSlotShape.getAttribute('stroke')).toBe('#FFFFFF');
  });

  test('does not crash if component unmounts before fetch resolves', async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { unmount } = render(
      <StickerBookPreviewModal data={buildData()} onClose={jest.fn()} />,
    );
    unmount();

    if (resolveFetch) {
      await act(async () => {
        resolveFetch?.({
          ok: true,
          text: async () => svgWithSlots,
        } as Response);
        await Promise.resolve();
      });
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('renders completion mode buttons instead of preview helper content', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal
        data={buildCompletionData()}
        mode="completion"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('.StickerBookCompletionModal-svg-area svg'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', {
        name: /save/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /paint/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('StickerBookPreviewModal-helper-text'),
    ).not.toBeInTheDocument();
  });

  test('uses Close aria-label for completion mode close button', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal
        data={buildCompletionData()}
        mode="completion"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('.StickerBookCompletionModal-svg-area svg'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId('StickerBookPreviewModal-close')).toHaveAttribute(
      'aria-label',
      'Close',
    );
  });

  test('renders audio button in completion mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal
        data={buildCompletionData()}
        mode="completion"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('.StickerBookCompletionModal-svg-area svg'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Replay audio' }),
    ).toBeInTheDocument();
  });

  test('replays completion audio when speaker button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal
        data={buildCompletionData()}
        mode="completion"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('.StickerBookCompletionModal-svg-area svg'),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Replay audio' }));

    await waitFor(() =>
      expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenLastCalledWith(
        'stickerbookThirdPopup',
        'popup_all_stickers_collected',
      ),
    );
    expect(AudioUtil.playAudioOrTts).toHaveBeenLastCalledWith({
      audioUrl:
        '/assets/audios/stickerbookThirdPopup/en_popup_all_stickers_collected.mp3',
      text: 'Congratulations! Your Stickerbook Page is complete! You can either save & share this page with your family & friends or start coloring this page.',
    });
  });

  test('plays drag_collect popup audio after the shared sound effect', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    render(
      <StickerBookPreviewModal
        data={buildData()}
        variant="drag_collect"
        onClose={jest.fn()}
      />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/common/generic_sound_effect.mp3',
      delayMs: 300,
      onComplete: expect.any(Function),
      onCompleteDelayMs: 300,
    });

    const firstCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[0]?.[0];
    await act(async () => {
      await firstCall.onComplete();
    });

    expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
      'stickerbookSecondPopup',
      'popup_sticker_collected',
    );
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl:
        '/assets/audios/stickerbookSecondPopup/en_popup_sticker_collected.mp3',
      text: 'Yay! You have earned a sticker!',
    });
  });

  test('completion mode save and paint keep existing behavior', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { container } = render(
      <StickerBookPreviewModal
        data={buildCompletionData()}
        mode="completion"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('.StickerBookCompletionModal-svg-area svg'),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockOpenSaveModal).toHaveBeenCalledTimes(1));
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_SAVE_CLICKED,
      expect.objectContaining({
        sticker_book_id: 'book-complete',
        collected_count: 3,
        total_stickers: 6,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /paint/i }));
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT_CLICKED,
      expect.objectContaining({
        sticker_book_id: 'book-complete',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(PAGES.COLORING_BOARD, {
      svgRaw: expect.stringContaining('<svg'),
      svgUrl: 'https://example.com/completed.svg',
      artworkTitle: 'Completed Book',
      returnTo: '/',
    });
  });

  test('completion mode still renders the save modal and toast containers', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    mockSaveHookState = {
      ...mockSaveHookState,
      showSaveModal: true,
      showSaveToast: true,
      savedSvgMarkup: '<svg><rect width="10" height="10" /></svg>',
    };

    render(
      <StickerBookPreviewModal
        data={buildCompletionData()}
        mode="completion"
        onClose={jest.fn()}
      />,
    );

    expect(
      await screen.findByTestId('sticker-book-save-modal'),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('sticker-book-toast')).toBeInTheDocument();
    expect(
      document.querySelector('.StickerBookCompletionModal-overlay'),
    ).not.toBeInTheDocument();
  });
});
