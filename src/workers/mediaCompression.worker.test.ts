const mockToBlobURL = jest.fn(async () => 'blob:mock-url');
const mockCreateObjectURL = jest.fn(() => 'blob:cache-url');

class MockFFmpeg {
  public progressCb: ((event: { progress: number }) => void) | null = null;

  load = jest.fn(async () => {});
  writeFile = jest.fn(async () => {});
  exec = jest.fn(async () => {
    this.progressCb?.({ progress: 0.5 });
  });
  readFile = jest.fn(async () => new Uint8Array([1, 2, 3]));
  deleteFile = jest.fn(async () => {});
  on = jest.fn((event: string, cb: (event: { progress: number }) => void) => {
    if (event === 'progress') this.progressCb = cb;
  });
  off = jest.fn((event: string) => {
    if (event === 'progress') this.progressCb = null;
  });
}

jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: MockFFmpeg,
}));

jest.mock('@ffmpeg/util', () => ({
  toBlobURL: mockToBlobURL,
}));

describe('mediaCompression.worker', () => {
  const setupCanvas = (convertToBlobImpl?: jest.Mock) => {
    (
      globalThis as unknown as { createImageBitmap: jest.Mock }
    ).createImageBitmap = jest.fn(async () => ({
      width: 100,
      height: 50,
      close: jest.fn(),
    }));

    const convertToBlob =
      convertToBlobImpl ??
      jest.fn(async () => ({
        type: 'image/webp',
        size: 3,
        arrayBuffer: async () => new Uint8Array([9, 8, 7]).buffer,
      }));

    (globalThis as unknown as { OffscreenCanvas: any }).OffscreenCanvas =
      class {
        width = 0;
        height = 0;

        getContext() {
          return { drawImage: jest.fn() };
        }

        convertToBlob = convertToBlob;
      };

    return { convertToBlob };
  };

  const loadWorker = async () => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.doMock('../utility/logger', () => ({
      __esModule: true,
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
      default: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    }));

    (globalThis as unknown as { postMessage: jest.Mock }).postMessage =
      jest.fn();

    (
      globalThis as unknown as { crossOriginIsolated: boolean }
    ).crossOriginIsolated = false;

    (globalThis as unknown as { caches?: CacheStorage }).caches = undefined;

    (globalThis as unknown as { URL: { createObjectURL: jest.Mock } }).URL =
      Object.assign(globalThis.URL, {
        createObjectURL: mockCreateObjectURL,
      });

    setupCanvas();

    await import('./mediaCompression.worker');

    return (
      globalThis as unknown as { onmessage: (event: any) => Promise<void> }
    ).onmessage;
  };

  test('compresses video and emits progress + done response', async () => {
    const onmessage = await loadWorker();

    await onmessage({
      data: {
        id: 'm1',
        type: 'COMPRESS_VIDEO',
        payload: {
          fileName: 'demo.mp4',
          mimeType: 'video/mp4',
          buffer: new Uint8Array([1, 2, 3, 4]).buffer,
          quality: 'medium',
        },
      },
    });

    const calls = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls;

    expect(calls.length).toBeGreaterThan(1);

    const progressCall = calls.find(
      (call: unknown[]) =>
        call[0] && typeof call[0] === 'object' && 'progress' in call[0],
    );

    const hasProcessingProgress = calls.some(
      (call: unknown[]) =>
        call[0] &&
        typeof call[0] === 'object' &&
        'progress' in call[0] &&
        (call[0] as { phase?: string }).phase === 'processing',
    );

    expect(progressCall).toBeDefined();
    expect(hasProcessingProgress).toBe(true);

    const lastCall = calls[calls.length - 1];

    expect(lastCall[0]).toEqual(
      expect.objectContaining({
        id: 'm1',
        ok: true,
        done: true,
      }),
    );

    expect(lastCall[1][0]).toBeInstanceOf(ArrayBuffer);
  });

  test('video compression uses quality preset mapping for low', async () => {
    const onmessage = await loadWorker();

    await onmessage({
      data: {
        id: 'm2',
        type: 'COMPRESS_VIDEO',
        payload: {
          fileName: 'demo.mp4',
          mimeType: 'video/mp4',
          buffer: new Uint8Array([1, 2]).buffer,
          quality: 'low',
        },
      },
    });

    const done = (
      globalThis as unknown as { postMessage: jest.Mock }
    ).postMessage.mock.calls.pop()?.[0];

    expect(done.result.fileName.endsWith('.mp4')).toBe(true);
  });

  test('compresses image via canvas and returns webp', async () => {
    const onmessage = await loadWorker();

    await onmessage({
      data: {
        id: 'm3',
        type: 'COMPRESS_IMAGE_CANVAS',
        payload: {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          buffer: new Uint8Array([5, 6, 7]).buffer,
          maxImageDimension: 1080,
          imageQuality: 0.72,
        },
      },
    });

    const lastCall = (
      globalThis as unknown as { postMessage: jest.Mock }
    ).postMessage.mock.calls.pop();

    expect(lastCall?.[0].ok).toBe(true);
    expect(lastCall?.[0].result.mimeType).toBe('image/webp');
  });

  test('falls back to jpeg when webp blob is empty', async () => {
    const convertToBlob = jest
      .fn()
      .mockResolvedValueOnce({
        type: 'image/webp',
        size: 0,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
      .mockResolvedValueOnce({
        type: 'image/jpeg',
        size: 8,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      });

    const onmessage = await loadWorker();

    setupCanvas(convertToBlob);

    await onmessage({
      data: {
        id: 'm4',
        type: 'COMPRESS_IMAGE_CANVAS',
        payload: {
          fileName: 'photo.png',
          mimeType: 'image/png',
          buffer: new Uint8Array([5, 6]).buffer,
          maxImageDimension: 720,
          imageQuality: 0.5,
        },
      },
    });

    const lastCall = (
      globalThis as unknown as { postMessage: jest.Mock }
    ).postMessage.mock.calls.pop();

    expect(convertToBlob).toHaveBeenCalledTimes(2);
    expect(lastCall?.[0].result.mimeType).toBe('image/jpeg');
  });

  test('returns error when OffscreenCanvas context is unavailable', async () => {
    const onmessage = await loadWorker();

    (globalThis as unknown as { OffscreenCanvas: any }).OffscreenCanvas =
      class {
        getContext() {
          return null;
        }
        async convertToBlob() {
          return new Blob();
        }
      };

    await onmessage({
      data: {
        id: 'm5',
        type: 'COMPRESS_IMAGE_CANVAS',
        payload: {
          fileName: 'x.jpg',
          mimeType: 'image/jpeg',
          buffer: new Uint8Array([1]).buffer,
          maxImageDimension: 100,
          imageQuality: 0.7,
        },
      },
    });

    const response = (
      globalThis as unknown as { postMessage: jest.Mock }
    ).postMessage.mock.calls.pop()?.[0];

    expect(response.ok).toBe(false);
    expect(response.error).toContain('OffscreenCanvas');
  });

  test('compresses image with ffmpeg path', async () => {
    const onmessage = await loadWorker();

    await onmessage({
      data: {
        id: 'm6',
        type: 'COMPRESS_IMAGE_FFMPEG',
        payload: {
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          buffer: new Uint8Array([3, 4, 5]).buffer,
        },
      },
    });

    const lastCall = (
      globalThis as unknown as { postMessage: jest.Mock }
    ).postMessage.mock.calls.pop();

    expect(lastCall?.[0].ok).toBe(true);
    expect(lastCall?.[0].result.mimeType).toBe('image/webp');
  });

  test('unloads temp files and progress listeners after video compression', async () => {
    const onmessage = await loadWorker();

    await onmessage({
      data: {
        id: 'm7',
        type: 'COMPRESS_VIDEO',
        payload: {
          fileName: 'demo.mp4',
          mimeType: 'video/mp4',
          buffer: new Uint8Array([1, 2, 3]).buffer,
          quality: 'high',
        },
      },
    });

    const calls = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls;

    expect(calls[calls.length - 1][0].done).toBe(true);
  });

  test('returns error for unsupported task type', async () => {
    const onmessage = await loadWorker();

    await onmessage({
      data: {
        id: 'm8',
        type: 'UNKNOWN_TASK',
        payload: {},
      },
    });

    const response = (
      globalThis as unknown as { postMessage: jest.Mock }
    ).postMessage.mock.calls.pop()?.[0];

    expect(response.ok).toBe(false);
    expect(response.error).toContain('Unsupported media worker request');
  });
});

export {};
