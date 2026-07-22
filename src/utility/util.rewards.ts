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

import { UtilFileStorage } from './util.fileStorage';
import { UtilDataAndRewards } from './util.dataAndRewards';
export class UtilRewards extends UtilDataAndRewards {
  static [key: string]: any;
  public static async handleDeeplinkClick(
    url: URL,
    currentUser: TableTypes<'user'> | null,
    destinationPage: string,
  ) {
    const timestamp = new Date().toISOString();

    // Convert all query parameters to an object
    const queryParams: Record<string, string | null> = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryParams[key] = value;
    }

    const eventData = {
      user_id: currentUser?.id ?? 'anonymous',
      user_name: currentUser?.name ?? '',
      phone: currentUser?.phone || null,
      email: currentUser?.email || null,
      timestamp,
      destinationPage: destinationPage,
      ...queryParams,
    };

    await this.logEvent(EVENTS.DEEPLINK_CLICKED, eventData);
  }

  public static async setParentLanguagetoLocal() {
    const api = ServiceConfig.getI().apiHandler;
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!!user && !!user.language_id) {
      const langDoc = await api.getLanguageWithId(user.language_id);
      if (langDoc) {
        const tempLangCode = langDoc.code ?? LANG.ENGLISH;
        localStorage.setItem(LANGUAGE, tempLangCode);
        await i18n.changeLanguage(tempLangCode);
      }
    }
  }

  public static async updateUserLanguage(languageCode: string) {
    if (!languageCode) return;
    try {
      const api = ServiceConfig.getI().apiHandler;
      const auth = ServiceConfig.getI().authHandler;
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) return;

      const allLanguages = await api.getAllLanguages();
      const selectedLanguage = allLanguages.find(
        (lang) => lang.code === languageCode,
      );

      // Skip if no language found or already set to the same language
      if (!selectedLanguage || selectedLanguage.id === currentUser.language_id)
        return;

      await api.updateLanguage(currentUser.id, selectedLanguage.id);
      localStorage.setItem(LANGUAGE, languageCode);
      await i18n.changeLanguage(languageCode ?? '');

      const updatedUserData: TableTypes<'user'> = {
        ...currentUser,
        language_id: selectedLanguage.id,
      };

      store.dispatch(setUser(updatedUserData));
      auth.currentUser = updatedUserData;
    } catch (error) {
      logger.error('Failed to update user language:', error);
    }
  }

  public static async fetchTodaysReward() {
    try {
      const allRewards = await ServiceConfig.getI().apiHandler.getAllRewards();
      if (allRewards.length === 0) return;
      const today = new Date();
      const day = today.getDate();
      let chimpleRiveMaxState = allRewards[0].max_state_value ?? 8;
      if (localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === 'true') {
        chimpleRiveMaxState =
          parseInt(
            localStorage.getItem(CHIMPLE_RIVE_STATE_MACHINE_MAX) as string,
          ) ?? chimpleRiveMaxState;
      }

      const mappedState = ((day - 1) % chimpleRiveMaxState) + 1;
      const todaysReward = allRewards.find(
        (reward) =>
          reward.state_number_input === mappedState && reward.type === 'normal',
      );
      return todaysReward;
    } catch (error) {
      logger.error('Error fetching Chimple Rive config:', error);
    }
  }

  public static async shouldGiveDailyReward(): Promise<boolean> {
    try {
      const isRewardFeatureOn =
        localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';
      if (!isRewardFeatureOn) return false;
      const currentStudent = this.getCurrentStudent();
      if (!currentStudent) return false;

      const dailyUserReward = currentStudent.reward
        ? JSON.parse(currentStudent.reward as string)
        : {};
      const todaysReward = await this.fetchTodaysReward();
      if (!todaysReward) return false;

      const today = new Date().toISOString().split('T')[0];
      const rewardDate = dailyUserReward.timestamp
        ? new Date(dailyUserReward.timestamp).toISOString().split('T')[0]
        : null;
      const hasReceivedTodayReward =
        todaysReward.id === dailyUserReward.reward_id && rewardDate === today;

      return !hasReceivedTodayReward;
    } catch (error) {
      logger.error('Error checking daily reward eligibility:', error);
      return false;
    }
  }

  public static async updateUserReward() {
    try {
      // Get daily user reward from localStorage
      const dailyUserReward = JSON.parse(
        localStorage.getItem(DAILY_USER_REWARD) ?? '{}',
      );

      const currentStudent = this.getCurrentStudent();
      if (!currentStudent) return;
      // Fetch current reward
      const currentReward = currentStudent.reward
        ? JSON.parse(currentStudent.reward as string)
        : null;
      if (!currentReward) return;

      // Initialize student's reward object if it doesn't exist
      if (!dailyUserReward[currentStudent.id]) {
        dailyUserReward[currentStudent.id] = {};
      }

      if (
        !dailyUserReward[currentStudent.id].timestamp ||
        new Date(dailyUserReward[currentStudent.id].timestamp)
          .toISOString()
          .split('T')[0] !== new Date().toISOString().split('T')[0] ||
        dailyUserReward[currentStudent.id].reward_id !==
          currentReward?.reward_id
      ) {
        // Update localStorage
        dailyUserReward[currentStudent.id].reward_id = currentReward.reward_id;
        dailyUserReward[currentStudent.id].timestamp = currentReward.timestamp;
        localStorage.setItem(
          DAILY_USER_REWARD,
          JSON.stringify(dailyUserReward),
        );
      }
    } catch (error) {
      logger.error('Error updating student reward:', error);
    }
  }
}
