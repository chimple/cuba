import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import logger from './logger';

const deviceCourseIconUriCache = new Map<string, string>();

const isNativeFilesystemPlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

const toDisplayableUri = (uri: string): string => {
  return Capacitor.convertFileSrc ? Capacitor.convertFileSrc(uri) : uri;
};

const getParentDirectoryPath = (path: string): string | null => {
  const slashIndex = path.lastIndexOf('/');
  if (slashIndex <= 0) {
    return null;
  }

  return path.slice(0, slashIndex);
};

const ensureParentDirectory = async (path: string): Promise<void> => {
  const parentDirectory = getParentDirectoryPath(path);
  if (!parentDirectory) {
    return;
  }

  try {
    await Filesystem.mkdir({
      path: parentDirectory,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // Directory may already exist.
  }
};

const resolveLocalIconUri = async (
  localRelativePath: string,
): Promise<string | null> => {
  const memoryHit = deviceCourseIconUriCache.get(localRelativePath);
  if (memoryHit) {
    return memoryHit;
  }

  try {
    await Filesystem.stat({
      path: localRelativePath,
      directory: Directory.Data,
    });

    const uri = await Filesystem.getUri({
      path: localRelativePath,
      directory: Directory.Data,
    });

    if (!uri?.uri) {
      return null;
    }

    const displayableUri = toDisplayableUri(uri.uri);
    deviceCourseIconUriCache.set(localRelativePath, displayableUri);
    return displayableUri;
  } catch {
    return null;
  }
};

export const getCachedCourseIconUriSync = (
  localRelativePath?: string,
): string | null => {
  if (!localRelativePath) {
    return null;
  }

  // Fast path: already resolved in current app session.
  return deviceCourseIconUriCache.get(localRelativePath) ?? null;
};

export const getCachedCourseIconUri = async (
  localRelativePath?: string,
): Promise<string | null> => {
  if (!localRelativePath || !isNativeFilesystemPlatform()) {
    return null;
  }

  return await resolveLocalIconUri(localRelativePath);
};

export const downloadCourseIconToDevice = async (
  localRelativePath?: string,
  remoteUrl?: string,
): Promise<void> => {
  if (!localRelativePath || !remoteUrl || !isNativeFilesystemPlatform()) {
    return;
  }

  try {
    const existingUri = await resolveLocalIconUri(localRelativePath);
    if (existingUri) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }

    await ensureParentDirectory(localRelativePath);

    await Filesystem.downloadFile({
      url: remoteUrl,
      path: localRelativePath,
      directory: Directory.Data,
      method: 'GET',
      connectTimeout: 10000,
      readTimeout: 10000,
    });

    await resolveLocalIconUri(localRelativePath);
  } catch (error) {
    logger.warn(
      '[CourseIconCache] Failed to download course icon to device',
      error,
    );
  }
};
