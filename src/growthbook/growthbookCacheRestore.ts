import logger from '../utility/logger';
import type { GrowthBookPayload } from '@growthbook/growthbook';

const GB_CACHE_KEY = 'gbFeaturesCache';

type GrowthBookLike = {
  setPayload: (payload: GrowthBookPayload) => Promise<void>;
};

type GrowthBookCacheEntry = {
  data?: GrowthBookPayload;
};

type GrowthBookCacheRow = [string, GrowthBookCacheEntry];

export const tryRestoreGrowthbookPayloadFromCache = async (
  gbInstance: GrowthBookLike,
  clientKey?: string,
): Promise<boolean> => {
  try {
    // GrowthBook stores a cache map in localStorage under gbFeaturesCache.
    // We read that raw cache directly for offline recovery.
    const raw = localStorage.getItem(GB_CACHE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as GrowthBookCacheRow[];
    if (!Array.isArray(parsed) || parsed.length === 0) return false;
    const cacheRows = parsed.filter((entry) => {
      return (
        Array.isArray(entry) &&
        entry.length >= 2 &&
        typeof entry[0] === 'string' &&
        typeof entry[1] === 'object' &&
        entry[1] !== null
      );
    });
    if (cacheRows.length === 0) return false;

    const targetClientKey = clientKey ?? '';
    const cacheKey = `https://cdn.growthbook.io||${targetClientKey}`;
    // Prefer exact key match; keep a contains fallback for legacy key shapes.
    const matched =
      cacheRows.find((entry) => entry[0] === cacheKey) ??
      cacheRows.find(
        (entry) =>
          targetClientKey.length > 0 && entry[0].includes(targetClientKey),
      ) ??
      null;

    const payload = matched?.[1].data;
    if (!payload) return false;

    // Rehydrate GrowthBook instance with the cached payload.
    await gbInstance.setPayload(payload);
    return true;
  } catch (error) {
    logger.error('Failed to restore GrowthBook payload from cache', error);
    return false;
  }
};
