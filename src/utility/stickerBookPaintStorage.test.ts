import {
  deletePaintedStickerBook,
  loadPaintedStickerBook,
  savePaintedStickerBook,
  stickerBookPaintStorageInternals,
} from './stickerBookPaintStorage';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

jest.mock('@capacitor/core');
jest.mock('@capacitor/filesystem');
jest.mock('./logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

type MockIndexedDbStore = Map<string, { key: string; data: string }>;

function createIndexedDbRequest<T>() {
  return {
    result: null as T | null,
    error: null as Error | null,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onupgradeneeded: null as ((event: Event) => void) | null,
  };
}

function createMockIndexedDb() {
  const stores = new Map<string, MockIndexedDbStore>();

  return {
    open: jest.fn((_name: string, _version: number) => {
      const request = createIndexedDbRequest<unknown>();

      queueMicrotask(() => {
        const objectStoreNames = {
          contains: (storeName: string) => stores.has(storeName),
        };

        const db = {
          objectStoreNames,
          createObjectStore: (storeName: string) => {
            if (!stores.has(storeName)) {
              stores.set(storeName, new Map());
            }
            return {};
          },
          transaction: (storeName: string, _mode: IDBTransactionMode) => {
            const store = stores.get(storeName) ?? new Map();
            stores.set(storeName, store);

            const transaction = {
              error: null as Error | null,
              oncomplete: null as (() => void) | null,
              onerror: null as (() => void) | null,
              onabort: null as (() => void) | null,
              objectStore: () => ({
                put: (value: { key: string; data: string }) => {
                  const putRequest = createIndexedDbRequest<{
                    key: string;
                    data: string;
                  }>();
                  queueMicrotask(() => {
                    store.set(value.key, value);
                    putRequest.result = value;
                    putRequest.onsuccess?.({} as Event);
                    transaction.oncomplete?.();
                  });
                  return putRequest;
                },
                get: (key: string) => {
                  const getRequest = createIndexedDbRequest<
                    { key: string; data: string } | undefined
                  >();
                  queueMicrotask(() => {
                    getRequest.result = store.get(key) ?? null;
                    getRequest.onsuccess?.({} as Event);
                    transaction.oncomplete?.();
                  });
                  return getRequest;
                },
                delete: (key: string) => {
                  const deleteRequest = createIndexedDbRequest<undefined>();
                  queueMicrotask(() => {
                    store.delete(key);
                    deleteRequest.result = null;
                    deleteRequest.onsuccess?.({} as Event);
                    transaction.oncomplete?.();
                  });
                  return deleteRequest;
                },
              }),
            };

            return transaction;
          },
          close: jest.fn(),
        };

        request.result = db;
        request.onupgradeneeded?.({} as Event);
        request.onsuccess?.({} as Event);
      });

      return request;
    }),
  };
}

describe('stickerBookPaintStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: createMockIndexedDb(),
    });
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (Filesystem.readFile as jest.Mock).mockResolvedValue({ data: '' });
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});
    (Filesystem.deleteFile as jest.Mock).mockResolvedValue({});
    (Filesystem.mkdir as jest.Mock).mockResolvedValue({});
  });

  test('saves and loads painted svg through IndexedDB on web', async () => {
    await savePaintedStickerBook(
      'student-1',
      'book-1',
      '<svg><rect width="12" height="12" /></svg>',
    );

    const stored = await loadPaintedStickerBook('student-1', 'book-1');

    expect(stored).toBe('<svg><rect width="12" height="12" /></svg>');
  });

  test('returns null for missing IndexedDB entries', async () => {
    await expect(
      loadPaintedStickerBook('student-1', 'missing-book'),
    ).resolves.toBeNull();
  });

  test('deletes corrupted IndexedDB svg entries during load', async () => {
    await savePaintedStickerBook('student-1', 'book-1', 'not-an-svg');

    await expect(
      loadPaintedStickerBook('student-1', 'book-1'),
    ).resolves.toBeNull();
    await expect(
      loadPaintedStickerBook('student-1', 'book-1'),
    ).resolves.toBeNull();
  });

  test('writes and reads painted svg through the native filesystem', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockResolvedValue({
      data: '<svg><circle cx="5" cy="5" r="5" /></svg>',
    });

    await savePaintedStickerBook(
      'student-1',
      'book-1',
      '<svg><circle cx="5" cy="5" r="5" /></svg>',
    );

    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `${stickerBookPaintStorageInternals.PAINT_STORAGE_DIR}/painted_student-1_book-1.svg`,
        directory: Directory.Data,
      }),
    );

    const stored = await loadPaintedStickerBook('student-1', 'book-1');

    expect(stored).toBe('<svg><circle cx="5" cy="5" r="5" /></svg>');
  });

  test('deletes corrupted native svg files during load', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockResolvedValue({
      data: 'broken-svg',
    });

    await expect(
      loadPaintedStickerBook('student-1', 'book-1'),
    ).resolves.toBeNull();

    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      path: `${stickerBookPaintStorageInternals.PAINT_STORAGE_DIR}/painted_student-1_book-1.svg`,
      directory: Directory.Data,
    });
  });

  test('deletePaintedStickerBook removes the persisted entry', async () => {
    await savePaintedStickerBook(
      'student-1',
      'book-1',
      '<svg><rect width="8" height="8" /></svg>',
    );

    await deletePaintedStickerBook('student-1', 'book-1');

    await expect(
      loadPaintedStickerBook('student-1', 'book-1'),
    ).resolves.toBeNull();
  });
});
