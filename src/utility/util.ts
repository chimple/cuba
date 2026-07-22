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

import { UtilHomeworkAudio } from './util.homeworkAudio';
export class Util extends UtilHomeworkAudio {
  static [key: string]: any;
  public static async updateSchStdAttb(): Promise<any[]> {
    try {
      const student = Util.getCurrentStudent();
      if (!student?.id) return [];
      const api = ServiceConfig.getI().apiHandler;
      const linkedData = await api.getStudentClassesAndSchools(student.id);
      if (!linkedData) {
        api.currentClass = undefined;
        localStorage.removeItem(CURRENT_CLASS);
        // Clear school targeting when the active student has no linkage data.
        updateLocalAttributes({
          student_id: student.id,
          school_ids: [],
          schools: [],
          classes: [],
          school_name: null,
        });
        return [];
      }
      const device = await Util.logDeviceInfo();
      const resolvedSchoolIds = linkedData.schools.map(
        (item: TableTypes<'school'>) => item.id,
      );
      if (linkedData.classes.length === 0) {
        api.currentClass = undefined;
        localStorage.removeItem(CURRENT_CLASS);
      }
      const attributeParams = {
        studentDetails: student,
        schools: resolvedSchoolIds,
        school_ids: resolvedSchoolIds,
        school_name: linkedData.schools[0]?.name,
        classes: linkedData.classes.map((item: any) => item.id),
        ...device,
      };
      updateLocalAttributes(attributeParams);
      return [];
    } catch (error) {
      logger.error('[Util.updateSchStdAttb] failed:', error);
      return [];
    }
  }

  public static async logDeviceInfo(): Promise<any> {
    const info = await Device.getInfo();
    const device_language = await Device.getLanguageCode();
    const device = {
      model: info.model,
      manufacturer: info.manufacturer,
      platform: info.platform,
      os_version: info.osVersion,
      operating_system: info.operatingSystem,
      is_virtual: info.isVirtual,
      device_language: device_language.value,
    };
    return device;
  }

  public static migrateSupabaseSession() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        logger.warn('Supabase URL missing, skipping session migration');
        return;
      }

      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      if (!projectRef) {
        logger.warn('Invalid Supabase URL format, skipping session migration');
        return;
      }

      const newKey = `sb-${projectRef}-auth-token`;
      const oldKey = Object.keys(localStorage).find(
        (key) => key.endsWith('auth-token') && key !== newKey,
      );

      if (oldKey) {
        const oldSession = localStorage.getItem(oldKey);

        if (oldSession && !localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldSession);
          localStorage.removeItem(oldKey);
        }
      }
    } catch (error) {
      logger.error('Session migration failed', error);
    }
  }

  public static async getLocalLessonVersion(lessonId: string): Promise<number> {
    try {
      const file = await Filesystem.readFile({
        path: `${lessonId}/.version`,
        directory: Directory.External,
      });

      let versionStr: string;

      if (typeof file.data === 'string') {
        // 🔥 Try decode base64 safely
        try {
          versionStr = atob(file.data);
        } catch {
          versionStr = file.data; // fallback if already plain text
        }
      } else {
        versionStr = await this.blobToString(file.data as Blob);
      }

      const cleaned = versionStr.trim(); // 🔥 IMPORTANT
      const version = parseInt(cleaned, 10);

      logger.warn(`[Version] Raw: "${versionStr}" Parsed: ${version}`);

      return isNaN(version) ? 1 : version;
    } catch (err) {
      logger.warn(
        `[Version] No .version file for ${lessonId}, defaulting to 1`,
      );
      return 1;
    }
  }
}
