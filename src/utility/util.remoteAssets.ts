import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import { unzip } from 'zip2';
import {
  CURRENT_STUDENT,
  COURSES,
  CURRENT_LESSON_LEVEL,
  EVENTS,
  FCM_TOKENS,
  LANG,
  LANGUAGE,
  LAST_PERMISSION_CHECKED,
  TableTypes,
  LAST_UPDATE_CHECKED,
  PAGES,
  PortPlugin,
  PRE_QUIZ,
  SELECTED_GRADE,
  SL_GRADES,
  IS_MIGRATION_CHECKED,
  SOUND,
  MUSIC,
  MODES,
  CONTINUE,
  DOWNLOADED_LESSON_ID,
  LAST_FUNCTION_CALL,
  LeaderboardRewardsType,
  unlockedRewardsInfo,
  DOWNLOAD_LESSON_BATCH_SIZE,
  MAX_DOWNLOAD_LESSON_ATTEMPTS,
  LESSON_DOWNLOAD_SUCCESS_EVENT,
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  CHAPTER_ID_LESSON_ID_MAP,
  DOWNLOADING_CHAPTER_ID,
  SCHOOL,
  CLASS,
  CURRENT_COURSE,
  CLASS_OR_SCHOOL_CHANGE_EVENT,
  NAVIGATION_STATE,
  GAME_URL,
  LOCAL_BUNDLES_PATH,
  School_Creation_Stages,
  HOMEHEADERLIST,
  ASSIGNMENT_TYPE,
  ASSIGNMENT_POPUP_SHOWN,
  QUIZ_POPUP_SHOWN,
  SCHOOL_LOGIN,
  SHOULD_SHOW_REMOTE_ASSETS,
  CHIMPLE_RIVE_STATE_MACHINE_MAX,
  LOCAL_LESSON_BUNDLES_PATH,
  DAILY_USER_REWARD,
  IS_REWARD_FEATURE_ON,
  REWARD_LEARNING_PATH,
  HOMEWORK_PATHWAY,
  STARS_COUNT,
  LATEST_STARS,
  CURRENT_CLASS,
  RECOMMENDATION_TYPE,
  LIDO_COMMON_AUDIO_DIR,
  LEARNING_PATHWAY_MODE,
  CURRENT_PATHWAY_MODE,
  HOT_UPDATE_STATE_KEY,
  LIDO_ASSESSMENT,
  LATEST_LEARNING_PATH,
  AUTO_OPEN_STICKER_PREVIEW_KEY,
  AUTO_OPEN_STICKER_COMPLETION_POPUP_KEY,
  PENDING_PATHWAY_STICKER_REWARD_KEY,
  STICKER_BOOK_COMPLETION_READY_EVENT,
  CURRENT_STUDENT_CHANGED_EVENT,
  DOWNLOADED_LESSONS_SIZE,
} from '../common/constants';
import {
  Chapter as curriculamInterfaceChapter,
  Course as curriculamInterfaceCourse,
  Lesson as curriculamInterfaceLesson,
} from '../interface/curriculumInterfaces';
import { GUIDRef, RoleType } from '../interface/modelInterfaces';
import { OneRosterApi } from '../services/api/OneRosterApi';
import { APIMode, ServiceConfig } from '../services/ServiceConfig';
import i18n from '../i18n';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { Keyboard } from '@capacitor/keyboard';
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from '@capawesome/capacitor-app-update';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  getBundleZipUrlsForEnv,
  getLidoBundleZipUrlsForEnv,
  REMOTE_CONFIG_KEYS,
} from '../services/RemoteConfig';
import { schoolUtil } from './schoolUtil';
import { URLOpenListenerEvent } from '@capacitor/app';
import { t } from 'i18next';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import CryptoJS from 'crypto-js';
import { InAppReview } from '@capacitor-community/in-app-review';
import { ASSIGNMENT_COMPLETED_IDS } from '../common/courseConstants';
import { buildGlobalEventBaseContext } from '../common/eventBaseContext';
import { v4 as uuidv4 } from 'uuid';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import { updateLocalAttributes } from '../growthbook/Growthbook';
import {
  CoursePath,
  LessonNode,
  recommendNextLesson,
  shouldUseAssessment,
} from '../hooks/useLearningPath';
import { runBackgroundWorkerTask } from '../workers/backgroundWorkerClient';
import { store } from '../redux/store';
import {
  addRole,
  setIsOpsUser,
  setRefreshToken,
  setUser,
} from '../redux/slices/auth/authSlice';
import logger from './logger';
import type { StickerBookModalData } from '../components/learningPathway/StickerBookPreviewModal';
import { AudioUtil } from './AudioUtil';
import { replaceWithNavigationTarget } from '../helper/navigation/NavigationHandler';
import {
  getAppPathname,
  getAppSearchParams,
  replaceAppUrl,
} from './routerLocation';
import { parsePath } from 'history';

type LessonBundleDownloadOptions = {
  lessonId: string;
  zipUrls: string[];
  dbVersion: number;
};

type LessonBundleDownloadResult = {
  byteLength: number;
  sha256Hex?: string;
};

type LessonBundlePlugin = {
  downloadAndExtract: (
    options: LessonBundleDownloadOptions,
  ) => Promise<LessonBundleDownloadResult>;
};

let lessonBundlePluginInstance: LessonBundlePlugin | null = null;
type CreateFilesystem = typeof import('capacitor-fs').default;
let createFilesystemPromise: Promise<CreateFilesystem> | null = null;

const getBundleZipUrlsFallback = (
  bundleZipUrlsKey: REMOTE_CONFIG_KEYS,
): string[] =>
  bundleZipUrlsKey === REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS
    ? getLidoBundleZipUrlsForEnv()
    : getBundleZipUrlsForEnv();

const mergeBundleZipUrls = (...zipUrlLists: (string[] | null | undefined)[]) =>
  Array.from(
    new Set(
      zipUrlLists.flatMap((zipUrls) =>
        Array.isArray(zipUrls) ? zipUrls.filter(Boolean) : [],
      ),
    ),
  );

const getLessonBundlePlugin = (): LessonBundlePlugin | null => {
  if (lessonBundlePluginInstance) {
    return lessonBundlePluginInstance;
  }
  if (typeof registerPlugin !== 'function') {
    return null;
  }
  lessonBundlePluginInstance =
    registerPlugin<LessonBundlePlugin>('LessonBundle');
  return lessonBundlePluginInstance;
};

const getCreateFilesystem = async (): Promise<CreateFilesystem> => {
  if (!createFilesystemPromise) {
    createFilesystemPromise = import('capacitor-fs')
      .then((module) => module.default)
      .catch((error) => {
        createFilesystemPromise = null;
        throw error;
      });
  }
  return createFilesystemPromise;
};

declare global {
  interface Window {
    __LIDO_COMMON_AUDIO_PATH__?: string;
  }
}

export interface HotUpdateState {
  status: string;
  progress: number;
  channel: string;
  lastChecked: string;
  lastUpdated: string;
  error: string;
  isAuto: boolean;
}

import { UtilLessonDownloads } from './util.lessonDownloads';
export class UtilRemoteAssets extends UtilLessonDownloads {
  static [key: string]: any;

  protected static async runDownloadZipBundle(
    lessons: TableTypes<'lesson'>[],
    chapterId?: string,
    bundleZipUrlsKey: REMOTE_CONFIG_KEYS = REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS,
  ): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return true;
      }

      const downloadStartedAt = Date.now();
      logger.info('Starting download for lessons:', {
        count: lessons.length,
        chapterId: chapterId ?? null,
      });
      for (let i = 0; i < lessons.length; i += DOWNLOAD_LESSON_BATCH_SIZE) {
        const lessonsChunk = lessons.slice(i, i + DOWNLOAD_LESSON_BATCH_SIZE);
        const results = await Promise.all(
          lessonsChunk.map(async (lesson) => {
            const lessonId = this.getLessonBundleId(lesson);
            if (!lessonId) {
              logger.error(
                '[LessonDownloader] Missing bundle lesson id for lesson:',
                lesson.id,
              );
              return false;
            }

            const lessonStartedAt = Date.now();
            try {
              let lessonDownloadSuccess = true;
              const androidPath = await this.getAndroidBundlePath();
              logger.info('full lesson object for download:', lesson);
              logger.info('lesson version for download:', lesson.version);
              // 🔥 GET DB VERSION ONCE
              let dbVersion = Number(lesson.version ?? 1);
              logger.info(
                `[Version] Using lesson version for ${lessonId}:`,
                lesson.version,
              );

              let localVersion = 0;

              // 🔥 EXISTENCE + VERSION CHECK (MAIN CHANGE)
              try {
                await Filesystem.readFile({
                  path: lessonId + '/config.json',
                  directory: Directory.External,
                });

                localVersion = await this.getLocalLessonVersion(lessonId);

                logger.info(
                  `[Version] ${lessonId} → Local: ${localVersion}, DB: ${dbVersion}`,
                );

                if (localVersion >= dbVersion) {
                  // ✅ UP-TO-DATE → SKIP
                  this.setGameUrl(androidPath);
                  this.storeLessonIdToLocalStorage(
                    lessonId,
                    DOWNLOADED_LESSON_ID,
                  );
                  return true;
                }

                logger.info(`[Version] ${lessonId} outdated → updating`);
              } catch {
                logger.info(`[Version] ${lessonId} not found → downloading`);
              }

              // ✅ KEEP THIS (local bundle fallback — IMPORTANT)
              const localBundlePath =
                LOCAL_LESSON_BUNDLES_PATH + `${lessonId}/config.json`;

              try {
                const response = await fetch(localBundlePath);
                if (response.ok && localVersion === 0) {
                  this.setGameUrl(LOCAL_BUNDLES_PATH);
                  return true;
                }
              } catch {
                logger.error(
                  `[LessonDownloader] Local bundle not found, downloading...`,
                );
              }

              // 🔥 DOWNLOAD LOGIC (UNCHANGED)
              const fallbackBundleZipUrls =
                getBundleZipUrlsFallback(bundleZipUrlsKey);
              const cachedBundleZipUrls = getCachedGrowthBookFeatureValue<
                string[] | null
              >(bundleZipUrlsKey, null);
              const fallbackGeneralBundleZipUrls =
                bundleZipUrlsKey === REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS
                  ? getBundleZipUrlsForEnv()
                  : [];
              const cachedGeneralBundleZipUrls =
                bundleZipUrlsKey === REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS
                  ? getCachedGrowthBookFeatureValue<string[] | null>(
                      REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS,
                      null,
                    )
                  : null;
              const bundleZipUrls =
                bundleZipUrlsKey === REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS
                  ? mergeBundleZipUrls(
                      cachedBundleZipUrls,
                      fallbackBundleZipUrls,
                      cachedGeneralBundleZipUrls,
                      fallbackGeneralBundleZipUrls,
                    )
                  : (cachedBundleZipUrls ?? fallbackBundleZipUrls);

              logger.warn('[LessonDownloader] Resolved bundle ZIP URLs', {
                lessonId,
                bundleZipUrlsKey,
                cachedBundleZipUrls,
                fallbackBundleZipUrls,
                cachedGeneralBundleZipUrls,
                fallbackGeneralBundleZipUrls,
                resolvedBundleZipUrls: bundleZipUrls,
                usedCachedBundleZipUrls: cachedBundleZipUrls !== null,
              });

              if (!bundleZipUrls || bundleZipUrls.length < 1) {
                logger.error('[LessonDownloader] No remote ZIP URLs found');
                return false;
              }

              const lessonBundlePlugin = getLessonBundlePlugin();
              if (!lessonBundlePlugin) {
                logger.warn(
                  '[LessonDownloader] LessonBundle plugin unavailable',
                  { lessonId },
                );
                return false;
              }

              const nativeBundleResult =
                await lessonBundlePlugin.downloadAndExtract({
                  lessonId,
                  zipUrls: bundleZipUrls,
                  dbVersion,
                });

              if (!nativeBundleResult?.byteLength) {
                logger.warn('[LessonDownloader] Native bundle returned empty', {
                  lessonId,
                  dbVersion,
                });
                return false;
              }
              logger.info('[LessonDownloader] Native bundle finished', {
                lessonId,
                dbVersion,
                byteLength: nativeBundleResult.byteLength,
                durationMs: Date.now() - lessonStartedAt,
              });

              // ✅ KEEP ORIGINAL METADATA + EVENTS
              const lessonData = JSON.parse(
                localStorage.getItem(DOWNLOADED_LESSONS_SIZE) || '{}',
              );
              lessonData[lessonId] = {
                size: nativeBundleResult.byteLength,
                sha256: nativeBundleResult.sha256Hex || undefined,
              };
              localStorage.setItem(
                DOWNLOADED_LESSONS_SIZE,
                JSON.stringify(lessonData),
              );
              this.setGameUrl(androidPath);
              this.storeLessonIdToLocalStorage(lessonId, DOWNLOADED_LESSON_ID);

              window.dispatchEvent(
                new CustomEvent(LESSON_DOWNLOAD_SUCCESS_EVENT, {
                  detail: { lessonId },
                }),
              );
              return lessonDownloadSuccess;
            } catch (err) {
              logger.error(
                `[LessonDownloader] Error processing lesson ${lessonId}:`,
                err,
              );
              logger.warn('[LessonDownloader] Download failed metrics', {
                lessonId,
                durationMs: Date.now() - lessonStartedAt,
              });
              return false;
            }
          }),
        );

        if (!results.every((r) => r === true)) {
          logger.error(
            '[LessonDownloader] Some lessons in chunk failed to download:',
            lessonsChunk.map(
              (lesson) => this.getLessonBundleId(lesson) ?? lesson.id,
            ),
          );
          return false;
        }
      }

      window.dispatchEvent(
        new CustomEvent(ALL_LESSON_DOWNLOAD_SUCCESS_EVENT, {
          detail: { chapterId },
        }),
      );

      if (chapterId) {
        this.removeLessonIdFromLocalStorage(chapterId, DOWNLOADING_CHAPTER_ID);
      }

      logger.info('[LessonDownloader] Chapter download complete', {
        chapterId: chapterId ?? null,
        lessonCount: lessons.length,
        durationMs: Date.now() - downloadStartedAt,
      });
      return true;
    } catch {
      return false;
    }
  }

  public static async blobToString(data: string | Blob): Promise<string> {
    if (typeof data === 'string') {
      return data;
    }

    if (data instanceof Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString() ?? '';
          const base64 = result.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    }

    throw new Error('Invalid data type — expected string or Blob');
  }

  // In your this.ts file

  // ✅ Renamed and made generic

  public static async DownloadRemoteAssets(
    zipUrl: string,
    uniqueId: string,
    destinationPath: string, // e.g., 'remoteAsset'
    assetType: string, // e.g., 'Learning Path'
  ): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) return true;

      const createFilesystem = await getCreateFilesystem();
      const fs = createFilesystem(Filesystem, {
        rootDir: '',
        directory: Directory.External,
      });
      const androidPath = await this.getAndroidBundlePath();

      // ✅ Use the dynamic destinationPath parameter
      const configPath = `${destinationPath}/config.json`;

      // Logic for reading config.json
      try {
        const res = await fetch(configPath); // ✅ Use dynamic path
        const isExists = res.ok;
        if (isExists) {
          const configFile = await Filesystem.readFile({
            path: configPath, // ✅ Use dynamic path
            directory: Directory.External,
          });

          const base64Data = await this.blobToString(configFile.data);
          const decoded = atob(base64Data);
          const config = JSON.parse(decoded);

          if (config.uniqueId === uniqueId) {
            logger.info(`✅ ${assetType} assets are already up to date.`);
            this.setGameUrl(androidPath);
            return true;
          }
        }
      } catch (err) {
        logger.warn(
          `Could not read existing config for ${assetType}, proceeding with download.`,
        );
      }

      // Download and unzip
      const response = await CapacitorHttp.get({
        url: zipUrl,
        responseType: 'blob',
      });

      if (!response?.data || response.status !== 200) return false;
      let buffer: Uint8Array;
      try {
        const prepared = await runBackgroundWorkerTask(
          'PREPARE_BINARY_FROM_BASE64',
          {
            base64: response.data,
            algorithm: 'SHA-256',
          },
        );
        buffer = new Uint8Array(prepared.arrayBuffer);
      } catch (workerError) {
        logger.warn(
          `[${assetType}] Worker decode failed, falling back to main thread decode.`,
          workerError,
        );
        buffer = Uint8Array.from(atob(response.data), (c) => c.charCodeAt(0));
      }
      await unzip({
        fs,
        extractTo: '', // The zip file itself should contain the destination folder
        filepaths: ['.'],
        filter: (filepath: string) => !filepath.startsWith('dist/'),
        onProgress: (event) => {
          // ✅ Use the dynamic assetType parameter for clearer logging
          logger.info(`Unzipping ${assetType} assets:`, event.filename);
        },
        data: buffer,
      });

      // After unzip and extraction
      const configFile = await Filesystem.readFile({
        path: configPath, // ✅ Use dynamic path
        directory: Directory.External,
      });
      const decoded = atob(await this.blobToString(configFile.data));
      const config = JSON.parse(decoded);

      // Important Note: Decide if this logic applies to BOTH asset types
      if (typeof config.riveMax === 'number') {
        localStorage.setItem(
          CHIMPLE_RIVE_STATE_MACHINE_MAX,
          config.riveMax.toString(),
        );
      }
      this.setGameUrl(androidPath);
      return true;
    } catch (err) {
      logger.error(
        `Unexpected error in DownloadRemoteAssets for ${assetType}:`,
        err,
      );
      return false;
    }
  }
}
