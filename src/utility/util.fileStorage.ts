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

import { UtilSessionContext } from './util.sessionContext';
import { UtilSchoolContext } from './util.schoolContext';
export class UtilFileStorage extends UtilSchoolContext {
  static [key: string]: any;
  public static async sendContentToAndroidOrWebShare(
    text: string,
    title: string,
    url?: string,
    imageFile?: File[],
  ) {
    if (Capacitor.isNativePlatform()) {
      // Convert File object to a blob URL, then extract path for Android
      const file = imageFile ? imageFile[0] : null;

      await this.port
        .shareContentWithAndroidShare({
          text: t(text),
          title: t(title),
          url: url,
          imageFile: imageFile, // Pass the File object for Android
        })
        .then(() => {})
        .catch((error) => logger.error('Error sharing content:', error));
    } else {
      // Web sharing
      const shareData: ShareData = {
        text: t(text) || '',
        title: t(title) || '',
        url: url,
        files: imageFile,
      };

      await navigator
        .share(shareData)
        .then(() => {})
        .catch((error) => logger.error('Error sharing content:', error));
    }
  }

  public static async saveImage(file: File) {
    // Native builds save images to the public gallery via MediaStore.
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToString(file);

        if (!this.port) {
          this.port = registerPlugin<PortPlugin>('Port');
        }

        await this.port.saveImageToGallery({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type || 'image/png',
        });
      } catch (error) {
        logger.error('Error saving file natively:', error);
        await Toast.show({ text: t('Failed to save image') });
      }
    } else {
      try {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (error) {
        logger.error('Error saving file in web:', error);
      }
    }
  }

  public static setCurrentCourse = async (
    classId: string | undefined,
    courseDoc: TableTypes<'course'> | null,
  ) => {
    if (!classId) return;
    const api = ServiceConfig.getI().apiHandler;
    const courseMap: Map<string, TableTypes<'course'> | undefined> = new Map();
    courseMap.set(classId, courseDoc ?? undefined);
    api.currentCourse = courseMap;
    const mapObject = Object.fromEntries(courseMap);
    localStorage.setItem(CURRENT_COURSE, JSON.stringify(mapObject));
  };

  public static getCurrentCourse(
    classId: string | undefined,
  ): TableTypes<'course'> | undefined {
    if (!classId) return;
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentCourse) return api.currentCourse.get(classId);
    const temp = localStorage.getItem(CURRENT_COURSE);
    if (!temp) return;
    const tempObject = JSON.parse(temp);
    const currentCourse = new Map(Object.entries(tempObject)) as Map<
      string,
      TableTypes<'course'>
    >;
    return currentCourse.get(classId);
  }

  public static dispatchClassOrSchoolChangeEvent = () => {
    const customEvent = new CustomEvent(CLASS_OR_SCHOOL_CHANGE_EVENT);
    window.dispatchEvent(customEvent);
  };

  public static getNavigationState(): {
    stage: string;
  } | null {
    return JSON.parse(localStorage.getItem(NAVIGATION_STATE) || 'null');
  }

  public static setNavigationState(stage: string) {
    const navigationState = { stage };
    localStorage.setItem(NAVIGATION_STATE, JSON.stringify(navigationState));
  }

  public static clearNavigationState() {
    localStorage.removeItem(NAVIGATION_STATE);
  }

  public static async getAndroidBundlePath(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const path = await Filesystem.getUri({
          directory: Directory.External,
          path: '',
        });

        if (path && path.uri) {
          const uri = Capacitor.convertFileSrc(path.uri);
          return uri + '/'; // file:///data/user/0/org.chimple.bahama/cache
        }
      } catch (error) {
        logger.error('path error', error);
      }
      throw new Error('Failed to retrieve Android bundle path.');
    }
    throw new Error('Not running on a native platform.');
  }

  public static setGameUrl(path: string) {
    localStorage.setItem(GAME_URL, path);
  }
}
