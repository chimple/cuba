import { Directory, Filesystem, FileInfo } from '@capacitor/filesystem';
import logger from './logger';
import {
  REMOTE_CONFIG_DEFAULTS,
  REMOTE_CONFIG_KEYS,
} from '../services/RemoteConfig';
import { SqliteApi } from '../services/api/SqliteApi';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';

interface LessonEvictionCandidate {
  lessonId: string;
  lastPlayed: string | null;
}

export class StorageManager {
  private static readonly ROOT_DIRECTORY = Directory.External;
  private static readonly PROTECTED_FOLDERS = new Set([
    'stickerBookAssetCache',
    'homeworkRemoteAsset',
  ]);

  public static async checkStorageLimit(): Promise<void> {
    const totalBytes = await this.getDirectorySize('');
    const totalMB = totalBytes / (1024 * 1024);
    const storageLimitMB = await this.getStorageLimitMb();

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
  }

  private static async getDirectorySize(path: string): Promise<number> {
    let totalSize = 0;

    try {
      const { files } = await Filesystem.readdir({
        path,
        directory: this.ROOT_DIRECTORY,
      });

      for (const file of files) {
        const childPath = path ? `${path}/${file.name}` : file.name;

        if (file.type === 'directory') {
          totalSize += await this.getDirectorySize(childPath);
        } else {
          totalSize += file.size;
        }
      }
    } catch (error) {
      logger.warn('[StorageManager] Failed to read directory', {
        path,
        error,
      });
    }

    return totalSize;
  }

  private static readonly DEFAULT_STORAGE_LIMIT_MB = 100;
  // private static getStorageLimitMb(): number {
  //      return
  //      ( getCachedGrowthBookFeatureValue<number>(
  //         REMOTE_CONFIG_KEYS.MAX_ASSET_STORAGE_MB, REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.MAX_ASSET_STORAGE_MB],
  //     ) ?? this.DEFAULT_STORAGE_LIMIT_MB );
  // }

  private static getStorageLimitMb(): number {
    const cachedLimitMb = getCachedGrowthBookFeatureValue<unknown>(
      REMOTE_CONFIG_KEYS.MAX_ASSET_STORAGE_MB,
      REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.MAX_ASSET_STORAGE_MB],
    );

    const resolvedLimitMb =
      typeof cachedLimitMb === 'number' ? cachedLimitMb : Number(cachedLimitMb);

    return Number.isFinite(resolvedLimitMb)
      ? resolvedLimitMb
      : this.DEFAULT_STORAGE_LIMIT_MB;
  }

  private static async getLessonFolders(): Promise<string[]> {
    const { files } = await Filesystem.readdir({
      path: '',
      directory: this.ROOT_DIRECTORY,
    });

    return files
      .filter((file) => file.type === 'directory')
      .map((file) => file.name);
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
    try {
      await Filesystem.rmdir({
        path: lessonId,
        directory: this.ROOT_DIRECTORY,
        recursive: true,
      });

      logger.warn('[StorageManager] Deleted lesson folder', {
        lessonId,
      });
    } catch (error) {
      logger.warn('[StorageManager] Failed to delete lesson folder', {
        lessonId,
        error,
      });
    }
  }
}
