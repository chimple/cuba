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

import { UtilNotifications } from './util.notifications';
import { UtilAppLifecycle } from './util.appLifecycle';
export class UtilSessionContext extends UtilAppLifecycle {
  static [key: string]: any;
  public static async migrateLocalJsonFile(
    newFileURL: string,
    oldFilePath: string,
    newFilePathLocation: string,
    localStorageNameForFilePath: string,
  ) {
    try {
      if (!newFileURL) {
        return;
      }

      let newFileResponse = await fetch(newFileURL);

      let newFileJson = await newFileResponse.json();

      let oldFileResponse = await fetch(oldFilePath);

      let oldFileJson = await oldFileResponse.json();

      if (oldFileJson.version >= newFileJson.version) {
        return;
      }

      let res = await Filesystem.writeFile({
        path: newFilePathLocation,
        directory: Directory.Data,
        data: JSON.stringify(newFileJson),
        encoding: Encoding.UTF8,
        recursive: true,
      });
      localStorage.setItem(localStorageNameForFilePath, res.uri);
    } catch (error) {
      logger.error('Json File Migration failed ', error);

      throw error;
    }
  }

  public static async getNextUnlockStickers(): Promise<
    TableTypes<'sticker'>[]
  > {
    const date = new Date();
    const api = ServiceConfig.getI().apiHandler;
    const rewardsDoc = await api.getRewardsById(
      date.getFullYear(),
      'weeklySticker',
    );
    if (!rewardsDoc) return [];
    const currentWeek = this.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    const parsedWeeklyData: Record<string, { type: string; id: string }[]> =
      typeof weeklyData === 'string'
        ? JSON.parse(weeklyData)
        : typeof weeklyData === 'object' && weeklyData !== null
          ? (weeklyData as Record<string, { type: string; id: string }[]>)
          : {};
    const weeklyRewards = parsedWeeklyData[currentWeek.toString()] ?? [];
    weeklyRewards.forEach((value: { type: string; id: string }) => {
      if (value.type === LeaderboardRewardsType.STICKER) {
        stickerIds.push(value.id);
      }
    });

    const stickerDocs = await api.getStickersByIds(stickerIds);
    return stickerDocs;
  }

  public static getCurrentWeekNumber(): number {
    const date: Date = new Date();
    const startOfYear: Date = new Date(date.getFullYear(), 0, 1);
    const dayOfYear: number =
      Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const firstDayOfWeek: number = startOfYear.getDay() || 7;
    const weekNumber: number = Math.ceil((dayOfYear + firstDayOfWeek - 1) / 7);
    return weekNumber;
  }

  public static getCurrentMonthForLeaderboard() {
    const date = new Date();
    if (date.getDate() < 3) {
      date.setMonth(date.getMonth() - 1);
    }
    return date.getMonth() + 1;
  }

  public static getCurrentYearForLeaderboard() {
    const date = new Date();
    if (date.getDate() < 3) {
      date.setMonth(date.getMonth() - 1);
    }
    return date.getFullYear();
  }

  public static async getStudentFromServer() {
    const api = ServiceConfig.getI().apiHandler;
    let currentStudent = await this.getCurrentStudent();
    if (!currentStudent) return;
    const updatedStudent = await api.getUserByDocId(currentStudent.id);
    if (updatedStudent) {
      await this.setCurrentStudent(updatedStudent);
    }
  }

  public static async unlockWeeklySticker() {
    try {
      let currentUser = this.getCurrentStudent();
      if (!currentUser) return false;
      const api = ServiceConfig.getI().apiHandler;
      const date = new Date();
      const rewardsDoc = await api.getRewardsById(
        date.getFullYear(),
        'weeklySticker',
      );
      if (!rewardsDoc) return false;
      const currentWeek = this.getCurrentWeekNumber();
      const weeklyData = rewardsDoc.weeklySticker;
      let currentReward;

      const parsedWeeklyData: Record<string, { type: string; id: string }[]> =
        typeof weeklyData === 'string'
          ? JSON.parse(weeklyData)
          : typeof weeklyData === 'object' && weeklyData !== null
            ? (weeklyData as Record<string, { type: string; id: string }[]>)
            : {};
      const weeklyRewards = parsedWeeklyData[currentWeek.toString()] ?? [];
      weeklyRewards.forEach(async (value: { type: string; id: string }) => {
        currentReward = value;
      });

      if (!currentReward) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('unlockWeeklySticker() error ', error);
      return false;
    }
  }

  public static async getAllUnlockedRewards(): Promise<
    unlockedRewardsInfo[] | undefined
  > {
    return;
  }
}
