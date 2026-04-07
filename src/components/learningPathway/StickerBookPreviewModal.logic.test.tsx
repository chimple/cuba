import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useStickerBookPreviewModalLogic,
  type StickerBookModalData,
} from './StickerBookPreviewModal.logic';
import { Util } from '../../utility/util';
import { EVENTS, PAGES } from '../../common/constants';
import logger from '../../utility/logger';

const originalFetch = global.fetch;
const mockPush = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({
    push: mockPush,
  }),
}));

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

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
let latestSaveHookOptions: Record<string, any> | null = null;

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
  useStickerBookSave: (options: Record<string, any>) => {
    latestSaveHookOptions = options;
    return mockSaveHookState;
  },
}));

jest.mock('../../utility/logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const buildData = (
  override: Partial<StickerBookModalData> = {},
): StickerBookModalData => ({
  source: 'learning_pathway',
  stickerBookId: 'book-1',
  stickerBookTitle: 'Book 1',
  stickerBookSvgUrl: '/sticker-book.svg',
  collectedStickerIds: ['slot-collected'],
  nextStickerId: 'slot-next',
  nextStickerName: 'Rocket',
  nextStickerImage:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"></svg>',
  ...override,
});

const svgWithSlots = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g data-slot-id="slot-collected">
    <rect x="0" y="0" width="10" height="10" fill="#111111" />
  </g>
  <g data-slot-id="slot-next">
    <circle cx="20" cy="20" r="6" fill="#333333" />
  </g>
</svg>
`;

const setRect = (el: Element, rect: Partial<DOMRect>) => {
  (el as any).getBoundingClientRect = jest.fn(
    () =>
      ({
        x: rect.x ?? rect.left ?? 0,
        y: rect.y ?? rect.top ?? 0,
        width: rect.width ?? 0,
        height: rect.height ?? 0,
        top: rect.top ?? rect.y ?? 0,
        left: rect.left ?? rect.x ?? 0,
        right: (rect.left ?? rect.x ?? 0) + (rect.width ?? 0),
        bottom: (rect.top ?? rect.y ?? 0) + (rect.height ?? 0),
        toJSON: () => {},
      }) as DOMRect,
  );
  if (rect.width !== undefined) {
    Object.defineProperty(el, 'clientWidth', {
      value: rect.width,
      configurable: true,
    });
  }
  if (rect.height !== undefined) {
    Object.defineProperty(el, 'clientHeight', {
      value: rect.height,
      configurable: true,
    });
  }
};

const buildSlotSvg = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  slot.setAttribute('data-slot-id', 'slot-next');
  svg.appendChild(slot);
  setRect(slot, { left: 80, top: 80, width: 20, height: 20 });
  return svg;
};

describe('useStickerBookPreviewModalLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestSaveHookOptions = null;
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-1' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
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
    jest.useRealTimers();
  });

  test('loads SVG markup and clears loading state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'preview',
        onClose: jest.fn(),
        mode: 'preview',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sceneSvg).not.toBeNull();
  });

  test('falls back to secondary SVG fetch when primary fails', async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/sticker-book.svg')) {
        return Promise.reject(new Error('network failed'));
      }
      return Promise.resolve({
        ok: true,
        text: async () => svgWithSlots,
      } as Response);
    }) as jest.Mock;

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'preview',
        onClose: jest.fn(),
        mode: 'preview',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(
      (global.fetch as jest.Mock).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to load sticker book SVG. Falling back.',
      expect.any(Error),
    );
  });

  test('initializes drag state and logs intro events', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'drag_collect',
        onClose: jest.fn(),
        mode: 'preview',
      }),
    );

    const frame = document.createElement('div');
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });

    act(() => {
      result.current.setFrameElement(frame);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await waitFor(() => expect(result.current.dragStickerPos).not.toBeNull());

    expect(result.current.dragStickerPos).toEqual({ x: 64, y: 112 });
    expect(result.current.showDragSticker).toBe(false);
    expect(result.current.showPointerHint).toBe(false);
    expect(result.current.showIntroConfetti).toBe(false);

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_DRAG_POPUP_EXPANDED,
      expect.any(Object),
    );

    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(result.current.showDragSticker).toBe(true);
    expect(result.current.showPointerHint).toBe(false);
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_DRAG_STICKER_SHOWN,
      expect.any(Object),
    );

    // Verify that the size update effect can run now that the sticker is shown
    // In this test, it might have already run, but we ensure it's still correct.
    expect(result.current.dragStickerSize).toBeGreaterThanOrEqual(72);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(result.current.showIntroConfetti).toBe(true);
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_DRAG_CONFETTI_SHOWN,
      expect.objectContaining({ stage: 'intro' }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current.showPointerHint).toBe(true);
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_DRAG_POINTER_SHOWN,
      expect.any(Object),
    );

    act(() => {
      jest.advanceTimersByTime(3550);
    });

    await waitFor(() => expect(result.current.showIntroConfetti).toBe(false));
  });

  test('handles successful drag drop and closes with acknowledge', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData({
          totalStickerCount: 3,
        }),
        variant: 'drag_collect',
        onClose,
        mode: 'preview',
      }),
    );

    const frame = document.createElement('div');
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });
    const svg = buildSlotSvg();
    setRect(svg, { left: 0, top: 0, width: 200, height: 200 });

    act(() => {
      result.current.setFrameElement(frame);
      result.current.bookSvgRef.current = svg as SVGSVGElement;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.dragStickerPos).not.toBeNull());

    const dragTarget = document.createElement('div');
    setRect(dragTarget, { left: 0, top: 0, width: 56, height: 56 });
    (dragTarget as any).setPointerCapture = jest.fn();
    (dragTarget as any).releasePointerCapture = jest.fn();
    (dragTarget as any).hasPointerCapture = jest.fn(() => true);

    act(() => {
      result.current.handleDragPointerDown({
        currentTarget: dragTarget,
        pointerId: 1,
        clientX: 10,
        clientY: 10,
      } as any);
    });

    act(() => {
      result.current.handleDragPointerMove({
        currentTarget: dragTarget,
        pointerId: 1,
        clientX: 72,
        clientY: 72,
      } as any);
    });

    act(() => {
      result.current.handleDragPointerUp({
        currentTarget: dragTarget,
        pointerId: 1,
        clientX: 72,
        clientY: 72,
      } as any);
    });

    expect(result.current.isDropSuccessful).toBe(true);
    expect(result.current.showDropConfetti).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2700);
    });
    expect(result.current.isFlyingOut).toBe(true);

    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(onClose).toHaveBeenCalledWith('acknowledge_button');
  });

  test('handles save and paint actions in completion mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData({
          stickerBookTitle: 'My Book!!',
        }),
        variant: 'preview',
        onClose: jest.fn(),
        mode: 'completion',
      }),
    );

    const frame = document.createElement('div');
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });

    act(() => {
      result.current.setFrameElement(frame);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockOpenSaveModal).toHaveBeenCalledWith(
      expect.stringContaining('<svg'),
    );

    act(() => {
      result.current.handlePaint();
    });

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_COMPLETION_POPUP_PAINT_CLICKED,
      expect.objectContaining({
        sticker_book_id: 'book-1',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(PAGES.COLORING_BOARD, {
      svgRaw: expect.stringContaining('<svg'),
      svgUrl: '/sticker-book.svg',
      artworkTitle: 'My Book!!',
      returnTo: '/',
    });
  });

  test('closes completion popup after the share sheet settles', async () => {
    const onClose = jest.fn();

    renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'preview',
        onClose,
        mode: 'completion',
      }),
    );

    expect(latestSaveHookOptions?.onShareSettled).toEqual(expect.any(Function));

    await act(async () => {
      await latestSaveHookOptions?.onShareSettled?.('Book_1.png');
    });

    expect(mockCloseSaveModal).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('acknowledge_button');
  });

  test('closes on backdrop click only when target matches currentTarget', async () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'preview',
        onClose,
        mode: 'preview',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const target = document.createElement('div');
    const inner = document.createElement('span');

    act(() => {
      result.current.handleOverlayClick({
        currentTarget: target,
        target: inner,
      } as any);
    });

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.handleOverlayClick({
        currentTarget: target,
        target,
      } as any);
    });

    expect(onClose).toHaveBeenCalledWith('backdrop');
  });

  test('handles drag cancel by clearing dragging state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'drag_collect',
        onClose: jest.fn(),
        mode: 'preview',
      }),
    );

    const frame = document.createElement('div');
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });

    act(() => {
      result.current.setFrameElement(frame);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.dragStickerPos).not.toBeNull());

    const dragTarget = document.createElement('div');
    setRect(dragTarget, { left: 0, top: 0, width: 56, height: 56 });
    (dragTarget as any).setPointerCapture = jest.fn();
    (dragTarget as any).releasePointerCapture = jest.fn();
    (dragTarget as any).hasPointerCapture = jest.fn(() => true);

    act(() => {
      result.current.handleDragPointerDown({
        currentTarget: dragTarget,
        pointerId: 9,
        clientX: 10,
        clientY: 10,
      } as any);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragPointerCancel({
        currentTarget: dragTarget,
        pointerId: 9,
      } as any);
    });

    expect(result.current.isDragging).toBe(false);
  });

  test('logs miss event when drop is outside slot', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData(),
        variant: 'drag_collect',
        onClose: jest.fn(),
        mode: 'preview',
      }),
    );

    const frame = document.createElement('div');
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });
    const svg = buildSlotSvg();
    setRect(svg, { left: 0, top: 0, width: 200, height: 200 });

    act(() => {
      result.current.setFrameElement(frame);
      result.current.bookSvgRef.current = svg as SVGSVGElement;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.dragStickerPos).not.toBeNull());

    const dragTarget = document.createElement('div');
    setRect(dragTarget, { left: 0, top: 0, width: 56, height: 56 });
    (dragTarget as any).setPointerCapture = jest.fn();
    (dragTarget as any).releasePointerCapture = jest.fn();
    (dragTarget as any).hasPointerCapture = jest.fn(() => true);

    act(() => {
      result.current.handleDragPointerDown({
        currentTarget: dragTarget,
        pointerId: 2,
        clientX: 10,
        clientY: 10,
      } as any);
    });

    act(() => {
      result.current.handleDragPointerUp({
        currentTarget: dragTarget,
        pointerId: 2,
        clientX: 0,
        clientY: 0,
      } as any);
    });

    expect(result.current.isDropSuccessful).toBe(false);
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_DRAG_DROPPED_MISS,
      expect.any(Object),
    );
  });

  test('allows successful drop on placeholders at the extreme bottom edge', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData({ totalStickerCount: 5 }),
        variant: 'drag_collect',
        onClose,
        mode: 'preview',
      }),
    );

    const frame = document.createElement('div');
    // 200x200 frame
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    slot.setAttribute('data-slot-id', 'slot-next');
    svg.appendChild(slot);
    // Position slot at the very bottom edge: center Y = 190 + 10 = 200
    setRect(slot, { left: 80, top: 190, width: 20, height: 20 });

    act(() => {
      result.current.setFrameElement(frame);
      result.current.bookSvgRef.current = svg as SVGSVGElement;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const stickerSize = result.current.dragStickerSize; // Should be around 56 for 200 width

    const dragTarget = document.createElement('div');
    setRect(dragTarget, {
      left: 0,
      top: 0,
      width: stickerSize,
      height: stickerSize,
    });
    (dragTarget as any).setPointerCapture = jest.fn();
    (dragTarget as any).releasePointerCapture = jest.fn();
    (dragTarget as any).hasPointerCapture = jest.fn(() => true);

    act(() => {
      result.current.handleDragPointerDown({
        currentTarget: dragTarget,
        pointerId: 3,
        clientX: 0,
        clientY: 0,
      } as any);
    });

    // Drag to the bottom-most allowed position
    act(() => {
      // clientY = frame.top + maxY + offset
      // Since offset is 0 and frame.top is 0, we can just use a large clientY
      result.current.handleDragPointerMove({
        currentTarget: dragTarget,
        pointerId: 3,
        clientX: 54, // Align center: 54 + 36 = 90
        clientY: 300, // Way beyond frame
      } as any);
    });

    act(() => {
      result.current.handleDragPointerUp({
        currentTarget: dragTarget,
        pointerId: 3,
        clientX: 54,
        clientY: 300,
      } as any);
    });

    // The sticker should have reached far enough to trigger a successful drop
    expect(result.current.isDropSuccessful).toBe(true);
  });

  test('allows successful drop on placeholders at the extreme top edge', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => svgWithSlots,
    } as Response);
    const onClose = jest.fn();

    const { result } = renderHook(() =>
      useStickerBookPreviewModalLogic({
        data: buildData({ totalStickerCount: 5 }),
        variant: 'drag_collect',
        onClose,
        mode: 'preview',
      }),
    );

    const frame = document.createElement('div');
    setRect(frame, { left: 0, top: 0, width: 200, height: 200 });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    slot.setAttribute('data-slot-id', 'slot-next');
    svg.appendChild(slot);
    // Position slot at the extreme top edge: center Y = -5 + 10 = 5
    setRect(slot, { left: 80, top: -5, width: 20, height: 20 });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFrameElement(frame);
      result.current.bookSvgRef.current = svg as SVGSVGElement;
    });

    const stickerSize = result.current.dragStickerSize; // 72

    const dragTarget = document.createElement('div');
    setRect(dragTarget, {
      left: 0,
      top: 0,
      width: stickerSize,
      height: stickerSize,
    });
    (dragTarget as any).setPointerCapture = jest.fn();
    (dragTarget as any).releasePointerCapture = jest.fn();
    (dragTarget as any).hasPointerCapture = jest.fn(() => true);

    act(() => {
      result.current.handleDragPointerDown({
        currentTarget: dragTarget,
        pointerId: 4,
        clientX: 0,
        clientY: 0,
      } as any);
    });

    act(() => {
      // Drag way above frame
      result.current.handleDragPointerMove({
        currentTarget: dragTarget,
        pointerId: 4,
        clientX: 54, // Align center: 54 + 36 = 90
        clientY: -300,
      } as any);
    });

    act(() => {
      result.current.handleDragPointerUp({
        currentTarget: dragTarget,
        pointerId: 4,
        clientX: 54,
        clientY: -300,
      } as any);
    });

    expect(result.current.isDropSuccessful).toBe(true);
  });
});
