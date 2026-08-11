import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import logger from './logger';

const PAINT_STORAGE_DIR = 'stickerBookPaintState';
const INDEXED_DB_NAME = 'stickerBookPaintProgress';
const INDEXED_DB_STORE = 'paintedStickerBooks';

type PaintedStickerBookRecord = {
  key: string;
  data: string;
};

function getPaintedStickerBookKey(
  userId: string,
  stickerBookId: string,
): string {
  return `painted_${userId}_${stickerBookId}.svg`;
}

function getPaintedStickerBookPath(
  userId: string,
  stickerBookId: string,
): string {
  return `${PAINT_STORAGE_DIR}/${getPaintedStickerBookKey(
    userId,
    stickerBookId,
  )}`;
}

function isValidSvgMarkup(data: string): boolean {
  if (!data) return false;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'image/svg+xml');
    return !!doc.querySelector('svg');
  } catch {
    return false;
  }
}

function openPaintedStickerBookDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(INDEXED_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
        db.createObjectStore(INDEXED_DB_STORE, {
          keyPath: 'key',
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB.'));
    };
  });
}

function runIndexedDbRequest<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openPaintedStickerBookDb().then(
    (db) =>
      new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(INDEXED_DB_STORE, mode);
        const store = transaction.objectStore(INDEXED_DB_STORE);
        const request = handler(store);

        request.onsuccess = () => {
          resolve((request.result as T | undefined) ?? null);
        };

        request.onerror = () => {
          reject(request.error ?? new Error('IndexedDB request failed.'));
        };

        transaction.oncomplete = () => {
          db.close();
        };

        transaction.onerror = () => {
          db.close();
          reject(
            transaction.error ?? new Error('IndexedDB transaction failed.'),
          );
        };

        transaction.onabort = () => {
          db.close();
          reject(
            transaction.error ?? new Error('IndexedDB transaction aborted.'),
          );
        };
      }),
  );
}

async function saveToIndexedDb(key: string, data: string): Promise<void> {
  await runIndexedDbRequest('readwrite', (store) =>
    store.put({
      key,
      data,
    } as PaintedStickerBookRecord),
  );
}

async function loadFromIndexedDb(key: string): Promise<string | null> {
  const record = await runIndexedDbRequest<
    PaintedStickerBookRecord | undefined
  >('readonly', (store) => store.get(key));

  return record?.data ?? null;
}

async function deleteFromIndexedDb(key: string): Promise<void> {
  await runIndexedDbRequest('readwrite', (store) => store.delete(key));
}

async function ensureNativePaintDirectory(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Filesystem.mkdir({
      path: PAINT_STORAGE_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // Ignore directory creation failures if the directory already exists.
  }
}

async function deleteCorruptedEntry(
  userId: string,
  stickerBookId: string,
): Promise<void> {
  try {
    await deletePaintedStickerBook(userId, stickerBookId);
  } catch (error) {
    logger.warn('[StickerBookPaint] Failed to delete corrupted paint state.', {
      error,
      userId,
      stickerBookId,
    });
  }
}

export async function savePaintedStickerBook(
  userId: string,
  stickerBookId: string,
  data: string,
): Promise<void> {
  if (!userId || !stickerBookId || !data) return;

  const key = getPaintedStickerBookKey(userId, stickerBookId);

  if (Capacitor.isNativePlatform()) {
    await ensureNativePaintDirectory();
    await Filesystem.writeFile({
      path: getPaintedStickerBookPath(userId, stickerBookId),
      data,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return;
  }

  await saveToIndexedDb(key, data);
}

export async function loadPaintedStickerBook(
  userId: string,
  stickerBookId: string,
): Promise<string | null> {
  if (!userId || !stickerBookId) return null;

  const key = getPaintedStickerBookKey(userId, stickerBookId);

  try {
    const data = Capacitor.isNativePlatform()
      ? await Filesystem.readFile({
          path: getPaintedStickerBookPath(userId, stickerBookId),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        }).then((result) =>
          typeof result.data === 'string' ? result.data : '',
        )
      : await loadFromIndexedDb(key);

    if (!data) return null;

    if (!isValidSvgMarkup(data)) {
      logger.warn('[StickerBookPaint] Invalid persisted SVG. Falling back.', {
        userId,
        stickerBookId,
      });
      await deleteCorruptedEntry(userId, stickerBookId);
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function deletePaintedStickerBook(
  userId: string,
  stickerBookId: string,
): Promise<void> {
  if (!userId || !stickerBookId) return;

  const key = getPaintedStickerBookKey(userId, stickerBookId);

  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.deleteFile({
        path: getPaintedStickerBookPath(userId, stickerBookId),
        directory: Directory.Data,
      });
    } catch {
      // Ignore missing files.
    }
    return;
  }

  try {
    await deleteFromIndexedDb(key);
  } catch {
    // Ignore missing records.
  }
}

export const stickerBookPaintStorageInternals = {
  getPaintedStickerBookKey,
  getPaintedStickerBookPath,
  isValidSvgMarkup,
  INDEXED_DB_NAME,
  INDEXED_DB_STORE,
  PAINT_STORAGE_DIR,
};
