import { Capacitor, registerPlugin } from '@capacitor/core';
import logger from './logger';
import { REMOTE_CONFIG_KEYS } from '../services/RemoteConfig';
import { SqliteApi } from '../services/api/SqliteApi';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';

interface LessonEvictionCandidate {
  lessonId: string;
  lastPlayed: string | null;
}

interface StorageLimitConfig {
  size: number;
  isEnabled: boolean;
}

type NativeStorageManagerPlugin = {
  getLessonFolders: () => Promise<{ folders: string[] }>;
  getDirectorySize: (options: { path?: string }) => Promise<{ size: number }>;
  deleteLessonFolder: (options: { lessonId: string }) => Promise<void>;
};

let nativeStorageManagerPlugin: NativeStorageManagerPlugin | null = null;

const getNativeStorageManagerPlugin = () => {
  if (Capacitor.getPlatform() !== 'android') {
    return null;
  }

  if (!nativeStorageManagerPlugin) {
    nativeStorageManagerPlugin =
      registerPlugin<NativeStorageManagerPlugin>('StorageManager');
  }

  return nativeStorageManagerPlugin;
};

export class StorageManager {
  private static readonly PROTECTED_FOLDERS = new Set([
    'stickerBookAssetCache',
    'homeworkRemoteAsset',
  ]);

  public static async checkStorageLimit(): Promise<void> {
    try {
      if (Capacitor.getPlatform() !== 'android') {
        logger.warn('[StorageManager] Native storage cleanup is Android-only');
        return;
      }

      const storageLimitConfig = this.getStorageLimitConfig();
      if (!storageLimitConfig) {
        logger.warn('[StorageManager] Invalid storage config');
        return;
      }

      if (!storageLimitConfig.isEnabled) {
        logger.warn('[StorageManager] Storage cleanup disabled');
        return;
      }

      const totalBytes = await this.getDirectorySize('');
      const totalMB = totalBytes / (1024 * 1024);
      const storageLimitMB = storageLimitConfig.size;

      const lessonFolders = await this.getLessonFolders();

      logger.warn(
        `[StorageManager] Lesson folders: count=${lessonFolders.length}, folders=${lessonFolders.join(', ')}`,
      );

      logger.warn(
        `[StorageManager] Storage check: currentMB=${totalMB}, storageLimitMB=${storageLimitMB}`,
      );

      if (totalMB <= storageLimitMB) {
        logger.warn(
          `[StorageManager] totalMB=${totalMB} is within limit=${storageLimitMB}`,
        );
        logger.warn('[StorageManager] Storage is within limit');
        return;
      }

      logger.warn(
        `[StorageManager] Storage limit exceeded. currentMB=${totalMB}, limitMB=${storageLimitMB}`,
      );

      const evictionQueue = await this.buildEvictionQueue();

      let currentSizeBytes = totalBytes;
      const limitBytes = storageLimitMB * 1024 * 1024;

      for (const lesson of evictionQueue) {
        if (currentSizeBytes <= limitBytes) {
          break;
        }
        // Never delete the protected folders
        if (this.PROTECTED_FOLDERS.has(lesson.lessonId)) {
          logger.warn(
            `[StorageManager] Skipping protected folder=${lesson.lessonId}`,
          );
          continue;
        }
        const lessonSize = await this.getDirectorySize(lesson.lessonId);

        await this.deleteLessonFolder(lesson.lessonId);

        currentSizeBytes -= lessonSize;

        logger.warn(
          `[StorageManager] Deleted lesson=${lesson.lessonId}, freedBytes=${lessonSize}, remainingBytes=${currentSizeBytes}`,
        );
      }
    } catch (error) {
      logger.error('[StorageManager] Error during storage limit check', error);
    }
  }

  private static async getDirectorySize(path: string): Promise<number> {
    const nativePlugin = getNativeStorageManagerPlugin();
    if (!nativePlugin) {
      throw new Error('StorageManager plugin is unavailable on this platform');
    }

    try {
      const { size } = await nativePlugin.getDirectorySize({ path });
      return size ?? 0;
    } catch (error) {
      logger.warn('[StorageManager] Native directory size lookup failed', {
        path,
        error,
      });
      throw error;
    }
  }

  private static getStorageLimitConfig(): StorageLimitConfig | null {
    const config = getCachedGrowthBookFeatureValue<StorageLimitConfig | null>(
      REMOTE_CONFIG_KEYS.MAX_ASSET_STORAGE_MB_NEW,
      null,
    );

    logger.warn('[StorageManager] Cached max_asset_storage_mb_new value', {
      featureKey: REMOTE_CONFIG_KEYS.MAX_ASSET_STORAGE_MB_NEW,
      value: config,
    });

    if (
      !config ||
      config.isEnabled !== true ||
      typeof config.size !== 'number' ||
      !Number.isFinite(config.size)
    ) {
      return null;
    }

    return config;
  }

  private static async getLessonFolders(): Promise<string[]> {
    const nativePlugin = getNativeStorageManagerPlugin();
    if (!nativePlugin) {
      throw new Error('StorageManager plugin is unavailable on this platform');
    }

    try {
      const { folders } = await nativePlugin.getLessonFolders();
      return folders ?? [];
    } catch (error) {
      logger.warn('[StorageManager] Native lesson folder lookup failed', {
        error,
      });
      throw error;
    }
  }

  private static async buildEvictionQueue(): Promise<
    LessonEvictionCandidate[]
  > {
    const lessonFolders = await this.getLessonFolders();

    const api = await SqliteApi.getInstance();
    const playedLessons = await api.getLessonLastPlayed(lessonFolders);

    const playedMap = new Map(
      playedLessons.map((lesson) => [lesson.lesson_id, lesson.last_played]),
    );

    const neverPlayed: LessonEvictionCandidate[] = [];

    const played: LessonEvictionCandidate[] = [];

    for (const lessonId of lessonFolders) {
      const lastPlayed = playedMap.get(lessonId);

      if (!lastPlayed) {
        neverPlayed.push({
          lessonId,
          lastPlayed: null,
        });
      } else {
        played.push({
          lessonId,
          lastPlayed,
        });
      }
    }

    played.sort(
      (a, b) =>
        new Date(a.lastPlayed!).getTime() - new Date(b.lastPlayed!).getTime(),
    );

    return [...neverPlayed, ...played];
  }

  private static async deleteLessonFolder(lessonId: string): Promise<void> {
    const nativePlugin = getNativeStorageManagerPlugin();
    if (!nativePlugin) {
      throw new Error('StorageManager plugin is unavailable on this platform');
    }

    try {
      await nativePlugin.deleteLessonFolder({ lessonId });
      logger.warn('[StorageManager] Deleted lesson folder', {
        lessonId,
      });
    } catch (error) {
      logger.warn('[StorageManager] Native lesson folder delete failed', {
        lessonId,
        error,
      });
      throw error;
    }
  }
}
