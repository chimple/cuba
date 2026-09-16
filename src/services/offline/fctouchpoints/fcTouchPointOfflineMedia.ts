import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import type { MediaUploadItem } from '../../../ops-console/common/mediaactions';

export type OfflineMediaFileRef = {
  id: string;
  path: string;
  fileName: string;
  mimeType: string;
};

const OFFLINE_MEDIA_DIR = 'fc-touchpoints/media';
const INDEXED_DB_NAME = 'fcTouchPointOfflineMedia';
const INDEXED_DB_STORE = 'offlineMediaFiles';

type IndexedDbMediaRecord = {
  key: string;
  data: string;
  fileName: string;
  mimeType: string;
};

const isNativePlatform = () => Capacitor.isNativePlatform();

const ensureOfflineMediaDir = async () => {
  try {
    await Filesystem.mkdir({
      path: OFFLINE_MEDIA_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // directory may already exist
  }
};

const sanitizeFileName = (name: string) => {
  const trimmed = String(name || 'media').trim();
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, '-');
  return cleaned || 'media';
};

const openOfflineMediaDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
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

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });

const runIndexedDbRequest = <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> =>
  openOfflineMediaDb().then(
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

const fileToBase64 = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('File read failed'));
    reader.readAsDataURL(file);
  });

const base64ToFile = (base64: string, fileName: string, mimeType: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mimeType });
};

export const saveOfflineMediaFiles = async (
  files: File[],
  queueId: string,
): Promise<OfflineMediaFileRef[]> => {
  if (isNativePlatform()) {
    await ensureOfflineMediaDir();
  }

  const refs: OfflineMediaFileRef[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `offline-media-${Date.now()}-${index}`;
    const fileName = sanitizeFileName(file.name);
    const path = `${OFFLINE_MEDIA_DIR}/${queueId}_${id}_${fileName}`;
    const base64 = await fileToBase64(file);

    if (isNativePlatform()) {
      await Filesystem.writeFile({
        path,
        directory: Directory.Data,
        data: base64,
        recursive: true,
      });
    } else {
      await runIndexedDbRequest('readwrite', (store) =>
        store.put({
          key: path,
          data: base64,
          fileName,
          mimeType: file.type || 'application/octet-stream',
        } as IndexedDbMediaRecord),
      );
    }

    refs.push({
      id,
      path,
      fileName,
      mimeType: file.type || 'application/octet-stream',
    });
  }

  return refs;
};

export const readOfflineMediaFile = async (
  ref: OfflineMediaFileRef,
): Promise<File> => {
  if (isNativePlatform()) {
    const result = await Filesystem.readFile({
      path: ref.path,
      directory: Directory.Data,
    });

    return base64ToFile(String(result.data ?? ''), ref.fileName, ref.mimeType);
  }

  const record = await runIndexedDbRequest<IndexedDbMediaRecord | undefined>(
    'readonly',
    (store) => store.get(ref.path),
  );
  const base64 = record?.data ?? '';
  return base64ToFile(base64, ref.fileName, ref.mimeType);
};

export const deleteOfflineMediaFiles = async (refs: OfflineMediaFileRef[]) => {
  for (const ref of refs) {
    try {
      if (isNativePlatform()) {
        await Filesystem.deleteFile({
          path: ref.path,
          directory: Directory.Data,
        });
      } else {
        await runIndexedDbRequest('readwrite', (store) =>
          store.delete(ref.path),
        );
      }
    } catch {
      // ignore missing files during cleanup
    }
  }
};

export const uploadOfflineMediaFiles = async (params: {
  schoolId: string;
  refs: OfflineMediaFileRef[];
  uploadFn: (file: File) => Promise<string>;
}): Promise<string[]> => {
  const urls: string[] = [];

  for (const ref of params.refs) {
    const storedFile = await readOfflineMediaFile(ref);
    const uploadedUrl = await params.uploadFn(storedFile);
    urls.push(uploadedUrl);
  }

  return urls;
};

export const prepareFcUserFormMedia = async (params: {
  isOffline: boolean;
  mediaUploads: MediaUploadItem[];
  userId: string;
  schoolId: string;
  uploadAllMedia: (
    uploadFn: (file: File) => Promise<string>,
  ) => Promise<string[]>;
  uploadFn: (file: File) => Promise<string>;
}): Promise<{
  mediaLinks: string[] | null;
  offlineMediaFiles: OfflineMediaFileRef[] | null;
}> => {
  if (params.isOffline) {
    const offlineMediaFiles = await saveOfflineMediaFiles(
      params.mediaUploads.map((item) => item.file),
      `${params.userId}-${params.schoolId}`,
    );
    return {
      mediaLinks: null,
      offlineMediaFiles:
        offlineMediaFiles.length > 0 ? offlineMediaFiles : null,
    };
  }

  const mediaLinks = await params.uploadAllMedia(params.uploadFn);

  return {
    mediaLinks: mediaLinks.length > 0 ? mediaLinks : null,
    offlineMediaFiles: null,
  };
};
