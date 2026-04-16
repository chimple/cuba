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
  forceReplaceExisting: boolean = false,
): Promise<string | null> => {
  if (!localRelativePath || !remoteUrl || !isNativeFilesystemPlatform()) {
    return null;
  }

  let existingUri: string | null = null;

  try {
    existingUri = await resolveLocalIconUri(localRelativePath);
    if (existingUri && !forceReplaceExisting) {
      return existingUri;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return existingUri;
    }

    // Force refresh: re-download into same local path so stale icons get replaced.
    deviceCourseIconUriCache.delete(localRelativePath);
    await ensureParentDirectory(localRelativePath);

    await Filesystem.downloadFile({
      url: remoteUrl,
      path: localRelativePath,
      directory: Directory.Data,
      method: 'GET',
      connectTimeout: 10000,
      readTimeout: 10000,
    });

    const updatedUri = await resolveLocalIconUri(localRelativePath);
    return updatedUri ?? existingUri;
  } catch (error) {
    logger.warn(
      '[CourseIconCache] Failed to download course icon to device',
      error,
    );
    return existingUri;
  }
};

interface CourseIconDownloadTarget {
  localRelativePath: string;
  remoteUrl: string;
}

export const downloadMissingCourseIcons = async (
  targets: CourseIconDownloadTarget[],
): Promise<void> => {
  if (!targets.length || !isNativeFilesystemPlatform()) {
    return;
  }

  const uniqueByLocalPath = new Map<string, string>();
  targets.forEach((target) => {
    if (!target.localRelativePath || !target.remoteUrl) {
      return;
    }

    if (!uniqueByLocalPath.has(target.localRelativePath)) {
      uniqueByLocalPath.set(target.localRelativePath, target.remoteUrl);
    }
  });

  const tasks = Array.from(uniqueByLocalPath.entries()).map(
    async ([localRelativePath, remoteUrl]) => {
      const cachedUri = await getCachedCourseIconUri(localRelativePath);
      if (cachedUri) {
        return;
      }

      await downloadCourseIconToDevice(localRelativePath, remoteUrl, false);
    },
  );

  await Promise.allSettled(tasks);
};
