import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import MD5 from 'crypto-js/md5';
import logger from './logger';

const IMAGE_CACHE_DIRECTORY = 'image_cache';
const inflightDownloads = new Map<string, Promise<string>>();

const isLocalImageUrl = (url: string): boolean => {
  return (
    url.startsWith('file:') ||
    url.startsWith('capacitor:') ||
    url.startsWith('/assets/') ||
    url.includes('/_capacitor_file_/')
  );
};

const isRemoteImageUrl = (url: string): boolean =>
  /^https?:\/\//i.test(url) && !isLocalImageUrl(url);

const getCacheFileName = (url: string): string => `${MD5(url).toString()}.img`;

const ensureCacheDirectory = async (): Promise<void> => {
  try {
    await Filesystem.mkdir({
      path: IMAGE_CACHE_DIRECTORY,
      directory: Directory.Cache,
      recursive: true,
    });
  } catch {
    // The directory may already exist.
  }
};

const resolveCachedRemoteImage = async (url: string): Promise<string> => {
  const filePath = `${IMAGE_CACHE_DIRECTORY}/${getCacheFileName(url)}`;

  try {
    logger.warn('[imageCache] checking cache', { url, filePath });
    const stat = await Filesystem.stat({
      path: filePath,
      directory: Directory.Cache,
    });

    logger.warn('[imageCache] cache hit', { url, filePath, uri: stat.uri });
    return Capacitor.convertFileSrc(stat.uri);
  } catch {
    logger.warn('[imageCache] cache miss, downloading', { url, filePath });
    await ensureCacheDirectory();

    await Filesystem.downloadFile({
      url,
      path: filePath,
      directory: Directory.Cache,
    });

    const stat = await Filesystem.stat({
      path: filePath,
      directory: Directory.Cache,
    });

    logger.warn('[imageCache] download complete', {
      url,
      filePath,
      uri: stat.uri,
    });
    return Capacitor.convertFileSrc(stat.uri);
  }
};

export const getCachedImageSrc = async (url: string): Promise<string> => {
  if (
    !url ||
    !Capacitor.isNativePlatform() ||
    isLocalImageUrl(url) ||
    !isRemoteImageUrl(url)
  ) {
    return url;
  }

  const inflight = inflightDownloads.get(url);
  if (inflight) {
    logger.warn('[imageCache] reusing in-flight request', { url });
    return inflight;
  }

  const request = resolveCachedRemoteImage(url).catch((error) => {
    logger.warn('[imageCache] Falling back to remote image URL', error);
    return url;
  });

  const trackedRequest = request.finally(() => {
    inflightDownloads.delete(url);
  });

  inflightDownloads.set(url, trackedRequest);
  return trackedRequest;
};
