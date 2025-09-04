import {
  SCHOOL,
  CLASS,
  USER_ROLE,
  CURRENT_USER,
  CURRENT_MODE,
  SCHOOL_LOGIN,
  CURRENT_STUDENT,
  TABLES_TO_CLEAR,
} from "../../common/constants";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../../services/ServiceConfig";

const KEYS_TO_CLEAR = [
  SCHOOL,
  CLASS,
  USER_ROLE,
  CURRENT_USER,
  CURRENT_MODE,
  SCHOOL_LOGIN,
  CURRENT_STUDENT,
] as const;

export async function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {}
}

export async function clearCacheStorageJS() {
  if (!("caches" in globalThis)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
}

export async function clearLocalAndSession() {
  try {
    for (const k of KEYS_TO_CLEAR) localStorage.removeItem(k);
    localStorage.clear?.();
  } catch {}
  try {
    sessionStorage.clear?.();
  } catch {}
}

export async function clearIndexedDBCompletely() {
  if (!("indexedDB" in globalThis)) return;

  try {
    const anyIDB: any = indexedDB as any;
    if (typeof anyIDB.databases === "function") {
      const dbs = await anyIDB.databases();
      await Promise.all(
        (dbs || []).map(
          (db: any) =>
            new Promise<void>((resolve) => {
              const name = db?.name;
              if (!name) return resolve();
              const req = indexedDB.deleteDatabase(name);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            })
        )
      );
    }
  } catch {}
}

export async function wipeWebViewData() {
  await unregisterServiceWorkers();
  await clearCacheStorageJS();
  await clearLocalAndSession();
  await clearIndexedDBCompletely();
}

export async function clearSqliteTables() {
  const api = ServiceConfig.getI().apiHandler;
  await api.clearSpecificTablesSqlite(TABLES_TO_CLEAR);
}
