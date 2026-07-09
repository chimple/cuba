import {
  SCHOOL,
  CLASS,
  CURRENT_MODE,
  SCHOOL_LOGIN,
  CURRENT_STUDENT,
  CACHE_TABLES_TO_CLEAR,
  CURRENT_SQLITE_VERSION,
  BUNDLED_IMPORT_APP_VERSION_KEY,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';

const KEYS_TO_CLEAR = [
  SCHOOL,
  CLASS,
  CURRENT_MODE,
  SCHOOL_LOGIN,
  CURRENT_STUDENT,
] as const;

export const KEYS_TO_PRESERVE = new Set([
  BUNDLED_IMPORT_APP_VERSION_KEY,
  CURRENT_SQLITE_VERSION,
]);

export async function clearCacheStorageJS() {
  if (!('caches' in globalThis)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
}

export async function clearLocalAndSession() {
  try {
    for (const k of KEYS_TO_CLEAR) localStorage.removeItem(k);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !KEYS_TO_PRESERVE.has(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
  try {
    sessionStorage.clear?.();
  } catch {}
}

export async function ClearCacheData() {
  const api = ServiceConfig.getI().apiHandler;
  await api.clearCacheData(CACHE_TABLES_TO_CLEAR);
  await clearCacheStorageJS();
  await clearLocalAndSession();
}
