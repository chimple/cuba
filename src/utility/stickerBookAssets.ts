import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import logger from './logger';

const STICKER_BOOK_CACHE_DIR = 'stickerBookAssetCache';
const STICKER_BOOK_CACHE_PREFIX = 'sb_';
const LOCAL_URI_PREFIXES = [
  'file://',
  'content://',
  'capacitor://',
  'http://localhost/_capacitor_file_',
];

function toDisplayableLocalStickerBookUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('http://localhost/_capacitor_file_')) return uri;
  return Capacitor.convertFileSrc ? Capacitor.convertFileSrc(uri) : uri;
}

export function resolveStickerBookSvgUrl(url: string): string {
  if (!url) return '/assets/icons/StickerBookBoard.svg';
  if (LOCAL_URI_PREFIXES.some((prefix) => url.startsWith(prefix))) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}

function hashStickerBookCacheKey(value: string): string {
  // Keep cache file names short so Android filesystem limits do not break writes.
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getStickerBookSvgCachePath(url: string): string {
  const normalizedUrl = resolveStickerBookSvgUrl(url);
  const safeName = `${STICKER_BOOK_CACHE_PREFIX}${hashStickerBookCacheKey(
    normalizedUrl,
  )}`;
  return `${STICKER_BOOK_CACHE_DIR}/${safeName}.svg`;
}

async function ensureStickerBookCacheDirectory(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Filesystem.mkdir({
      path: STICKER_BOOK_CACHE_DIR,
      directory: Directory.External,
      recursive: true,
    });
  } catch {
    // The directory may already exist; ignore cache bootstrap failures.
  }
}

function isLocalStickerBookUri(url: string): boolean {
  return LOCAL_URI_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function readStickerBookAsset(
  url: string,
  mode: 'uri' | 'text',
): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const path = getStickerBookSvgCachePath(url);

    if (mode === 'text') {
      const file = await Filesystem.readFile({
        path,
        directory: Directory.External,
        encoding: Encoding.UTF8,
      });
      return typeof file.data === 'string' ? file.data : null;
    }

    await Filesystem.stat({
      path,
      directory: Directory.External,
    });
    const uri = await Filesystem.getUri({
      path,
      directory: Directory.External,
    });
    return uri?.uri ? toDisplayableLocalStickerBookUri(uri.uri) : null;
  } catch {
    return null;
  }
}

async function cacheStickerBookSvg(
  url: string,
  svgText: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !svgText) return;

  try {
    await ensureStickerBookCacheDirectory();
    await Filesystem.writeFile({
      path: getStickerBookSvgCachePath(url),
      data: svgText,
      directory: Directory.External,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  } catch (error) {
    logger.warn(
      '[StickerBook] Failed to cache sticker book svg locally',
      error,
    );
  }
}

export async function ensureLocalStickerBookSvgUri(
  url: string,
): Promise<string> {
  const resolvedUrl = resolveStickerBookSvgUrl(url);
  if (!Capacitor.isNativePlatform()) return resolvedUrl;
  if (isLocalStickerBookUri(resolvedUrl)) return resolvedUrl;

  const cachedUri = await readStickerBookAsset(url, 'uri');
  if (cachedUri) return cachedUri;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    logger.warn(
      '[StickerBook] Sticker book svg is not cached locally and device is offline',
      { url: resolvedUrl },
    );
    return resolvedUrl;
  }

  const response = await fetch(resolvedUrl);
  if (response.ok === false) {
    throw new Error(`Failed to download sticker book svg: ${response.status}`);
  }

  const svgText = await response.text();
  await cacheStickerBookSvg(url, svgText);

  const localUri = await readStickerBookAsset(url, 'uri');
  return localUri ?? resolvedUrl;
}

export async function fetchStickerBookSvgText(url: string): Promise<string> {
  const resolvedUrl = resolveStickerBookSvgUrl(url);
  let fetchUrl = resolvedUrl;

  if (Capacitor.isNativePlatform() && !isLocalStickerBookUri(resolvedUrl)) {
    fetchUrl = await ensureLocalStickerBookSvgUri(url);
  } else {
    const cachedSvg = await readStickerBookAsset(url, 'text');
    if (cachedSvg) return cachedSvg;
  }

  fetchUrl = isLocalStickerBookUri(fetchUrl)
    ? toDisplayableLocalStickerBookUri(fetchUrl)
    : fetchUrl;
  const response = await fetch(fetchUrl);
  if (response.ok === false) {
    throw new Error(`Failed to fetch sticker book svg: ${response.status}`);
  }

  return await response.text();
}
