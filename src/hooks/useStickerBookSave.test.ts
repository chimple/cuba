import { renderHook, act } from '@testing-library/react';
import { useStickerBookSave } from './useStickerBookSave';
import { toPng } from 'html-to-image';
import { Util } from '../utility/util';

/* -------------------- MOCKS -------------------- */

jest.mock('html-to-image', () => ({
  toPng: jest.fn(),
}));

jest.mock('../utility/util', () => ({
  Util: {
    saveImage: jest.fn(),
    blobToString: jest.fn(),
  },
}));

jest.mock('../utility/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
  registerPlugin: jest.fn(() => ({
    shareContentWithAndroidShare: jest.fn(),
    saveImageToGallery: jest.fn(),
  })),
}));

jest.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: jest.fn() },
  Directory: { Cache: 'CACHE' },
}));

/* -------------------- HELPERS -------------------- */

const defaultOptions = {
  fileBaseName: 'Test Book',
  shareText: 'Check this out',
  modalAriaLabel: 'Saved',
  backgroundColor: '#ffffff',
  onShareSuccess: jest.fn(),
  onShareSettled: jest.fn(),
  onSaveSuccess: jest.fn(),
};

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

const flushAsyncWork = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const waitForShareTimer = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await act(async () => {
      await flushAsyncWork();
    });

    if (jest.getTimerCount() > 0) {
      return;
    }
  }

  throw new Error('Share delay timer was not scheduled.');
};

/* ===================================================== */
/* ======================= TESTS ======================= */
/* ===================================================== */

describe('useStickerBookSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Stub navigator.share for web path
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });

    (toPng as jest.Mock).mockResolvedValue(PNG_DATA_URL);

    // Mock fetch for blob conversion inside the hook
    (global as any).fetch = jest.fn().mockResolvedValue({
      blob: () =>
        Promise.resolve(new Blob(['png-data'], { type: 'image/png' })),
    });

    (Util.saveImage as jest.Mock).mockResolvedValue(undefined);
  });
  /* ---------- INITIAL STATE ---------- */

  test('initial state has modal and toast closed', () => {
    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    expect(result.current.showSaveModal).toBe(false);
    expect(result.current.showSaveToast).toBe(false);
    expect(result.current.savedSvgMarkup).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  /* ---------- openSaveModal ---------- */

  test('openSaveModal opens modal and stores markup', () => {
    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    act(() => {
      result.current.openSaveModal('<svg>test</svg>');
    });

    expect(result.current.showSaveModal).toBe(true);
    expect(result.current.savedSvgMarkup).toBe('<svg>test</svg>');
    expect(result.current.showSaveToast).toBe(false);
  });

  test('openSaveModal does nothing when markup is null', () => {
    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    act(() => {
      result.current.openSaveModal(null as any);
    });

    expect(result.current.showSaveModal).toBe(false);
    expect(result.current.savedSvgMarkup).toBeNull();
  });

  /* ---------- closeSaveModal ---------- */

  test('closeSaveModal closes modal', () => {
    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    act(() => {
      result.current.openSaveModal('<svg />');
    });

    act(() => {
      result.current.closeSaveModal();
    });

    expect(result.current.showSaveModal).toBe(false);
    expect(result.current.showSaveToast).toBe(false);
  });

  /* ---------- closeSaveToast ---------- */

  test('closeSaveToast hides toast', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useStickerBookSave(defaultOptions));
    const frame = document.createElement('div');
    frame.id = 'sticker-book-save-modal-frame';
    document.body.appendChild(frame);

    let savePromise!: Promise<void>;
    act(() => {
      result.current.openSaveModal('<svg />');
      savePromise = result.current.handleSaveAndShare();
    });

    expect(result.current.showSaveToast).toBe(true);

    act(() => {
      result.current.closeSaveToast();
    });

    expect(result.current.showSaveToast).toBe(false);

    await waitForShareTimer();

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushAsyncWork();
      await savePromise;
    });

    document.body.removeChild(frame);
    jest.useRealTimers();
  });

  /* ---------- handleSaveAndShare ---------- */

  test('handleSaveAndShare returns early when target element missing', async () => {
    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    let savePromise!: Promise<void>;
    act(() => {
      savePromise = result.current.handleSaveAndShare();
    });
    await savePromise;

    expect(toPng).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  test('handleSaveAndShare captures, shares, and saves on web', async () => {
    jest.useFakeTimers();
    // Create the element the hook looks for
    const frame = document.createElement('div');
    frame.id = 'sticker-book-save-modal-frame';
    document.body.appendChild(frame);

    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    let savePromise!: Promise<void>;
    act(() => {
      result.current.openSaveModal('<svg />');
      savePromise = result.current.handleSaveAndShare();
    });

    expect(result.current.showSaveToast).toBe(true);

    await act(async () => {
      await flushAsyncWork();
    });

    expect(result.current.showSaveModal).toBe(false);
    expect(navigator.share).not.toHaveBeenCalled();

    await waitForShareTimer();

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushAsyncWork();
      await savePromise;
    });

    expect(toPng).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        cacheBust: true,
        backgroundColor: '#ffffff',
      }),
    );

    expect(navigator.share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Check this out',
      }),
    );

    expect(defaultOptions.onShareSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Test_Book'),
    );
    expect(defaultOptions.onShareSettled).toHaveBeenCalledWith(
      expect.stringContaining('Test_Book'),
    );
    expect(result.current.showSaveModal).toBe(false);

    expect(Util.saveImage).toHaveBeenCalled();
    expect(defaultOptions.onSaveSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Test_Book'),
    );

    expect(result.current.isSaving).toBe(false);

    document.body.removeChild(frame);
    jest.useRealTimers();
  });

  test('handleSaveAndShare calls onShareSettled when share is dismissed', async () => {
    jest.useFakeTimers();
    (navigator.share as jest.Mock).mockRejectedValueOnce(
      new Error('share dismissed'),
    );

    const frame = document.createElement('div');
    frame.id = 'sticker-book-save-modal-frame';
    document.body.appendChild(frame);

    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    let savePromise!: Promise<void>;
    act(() => {
      result.current.openSaveModal('<svg />');
      savePromise = result.current.handleSaveAndShare();
    });

    await waitForShareTimer();

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushAsyncWork();
      await savePromise;
    });

    expect(defaultOptions.onShareSuccess).not.toHaveBeenCalled();
    expect(defaultOptions.onShareSettled).toHaveBeenCalledWith(
      expect.stringContaining('Test_Book'),
    );

    document.body.removeChild(frame);
    jest.useRealTimers();
  });

  test('handleSaveAndShare returns early when toPng returns falsy', async () => {
    (toPng as jest.Mock).mockResolvedValueOnce(null);

    const frame = document.createElement('div');
    frame.id = 'sticker-book-save-modal-frame';
    document.body.appendChild(frame);

    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    await act(async () => {
      result.current.openSaveModal('<svg />');
      await result.current.handleSaveAndShare();
    });

    expect(navigator.share).not.toHaveBeenCalled();
    expect(Util.saveImage).not.toHaveBeenCalled();
    expect(result.current.showSaveModal).toBe(true);

    document.body.removeChild(frame);
  });

  test('handleSaveAndShare does not run if already saving', async () => {
    jest.useFakeTimers();
    const frame = document.createElement('div');
    frame.id = 'sticker-book-save-modal-frame';
    document.body.appendChild(frame);

    // Make toPng hang to keep isSaving true
    let resolveToPng!: (value: string) => void;
    (toPng as jest.Mock).mockReturnValue(
      new Promise<string>((resolve) => {
        resolveToPng = resolve;
      }),
    );

    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    // Start first call (will stay pending)
    let firstSavePromise!: Promise<void>;
    act(() => {
      result.current.openSaveModal('<svg />');
      firstSavePromise = result.current.handleSaveAndShare();
    });

    // Attempt second call while first is pending
    await act(async () => {
      await result.current.handleSaveAndShare();
    });

    // toPng should only have been called once (the first call)
    expect(toPng).toHaveBeenCalledTimes(1);

    // Resolve to clean up
    resolveToPng(PNG_DATA_URL);
    await waitForShareTimer();
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushAsyncWork();
      await firstSavePromise;
    });

    document.body.removeChild(frame);
    jest.useRealTimers();
  });

  test('filter excludes the blink overlay', async () => {
    jest.useFakeTimers();
    const frame = document.createElement('div');
    frame.id = 'sticker-book-save-modal-frame';
    const overlay = document.createElement('div');
    overlay.id = 'sticker-book-save-blink-overlay';
    frame.appendChild(overlay);
    document.body.appendChild(frame);

    const { result } = renderHook(() => useStickerBookSave(defaultOptions));

    let savePromise!: Promise<void>;
    act(() => {
      result.current.openSaveModal('<svg />');
      savePromise = result.current.handleSaveAndShare();
    });

    await act(async () => {
      await flushAsyncWork();
    });

    await waitForShareTimer();

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushAsyncWork();
      await savePromise;
    });

    const filterFn = (toPng as jest.Mock).mock.calls[0][1].filter;

    expect(filterFn(overlay)).toBe(false);
    expect(filterFn(document.createElement('div'))).toBe(true);

    document.body.removeChild(frame);
    jest.useRealTimers();
  });
});
