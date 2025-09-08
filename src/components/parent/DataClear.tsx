import {
  SCHOOL,
  CLASS,
  USER_ROLE,
  CURRENT_USER,
  CURRENT_MODE,
  SCHOOL_LOGIN,
  CURRENT_STUDENT,
  CACHE_TABLES_TO_CLEAR,
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

export async function ClearCacheData() {
  const api = ServiceConfig.getI().apiHandler;
  await api.clearCacheData(CACHE_TABLES_TO_CLEAR);
  await clearCacheStorageJS();
  await clearLocalAndSession();
}
