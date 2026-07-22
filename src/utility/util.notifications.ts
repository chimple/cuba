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

import { UtilAnalytics } from './util.analytics';
import { UtilLessonProgress } from './util.lessonProgress';
export class UtilNotifications extends UtilLessonProgress {
  static [key: string]: any;
  public static setPathToBackButton(path: string, history: any) {
    const url = getAppSearchParams();
    if (url.get(CONTINUE)) {
      history.replace(`${path}?${CONTINUE}=true`);
    } else {
      history.replace(path);
    }
  }

  public static switchToOpsUser(history: any): void {
    store.dispatch(setIsOpsUser(true));
    ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
    schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
    history.replace(PAGES.SIDEBAR_PAGE);
  }

  public static setCurrentStudent = async (
    student: TableTypes<'user'> | null,
    languageCode?: string,
    langFlag: boolean = true,
    isStudent: boolean = true,
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentStudent = student !== null ? student : undefined;

    localStorage.setItem(CURRENT_STUDENT, JSON.stringify(student));
    window.dispatchEvent(
      new CustomEvent(CURRENT_STUDENT_CHANGED_EVENT, { detail: student }),
    );

    if (!languageCode && !!student?.language_id) {
      const langDoc = await api.getLanguageWithId(student.language_id);
      if (langDoc) {
        languageCode = langDoc.code ?? undefined;
      }
    }
    const tempLangCode = languageCode ?? LANG.ENGLISH;
    if (!!langFlag) localStorage.setItem(LANGUAGE, tempLangCode);
    if (!!isStudent) await i18n.changeLanguage(tempLangCode);
  };

  public static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  public static isEmail(username: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(username);
    return isValid;
  }

  public static async subscribeToClassTopic(
    classId: string,
    schoolId: string,
  ): Promise<void> {
    const classToken = `${classId}-assignments`;
    const schoolToken = `${schoolId}-assignments`;
    if (!Capacitor.isNativePlatform()) return;
    await FirebaseMessaging.subscribeToTopic({
      topic: classToken,
    });
    await FirebaseMessaging.subscribeToTopic({
      topic: schoolToken,
    });
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens: string[] = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    tokens.push(classToken, schoolToken);
    localStorage.setItem(FCM_TOKENS, JSON.stringify(tokens));
  }

  public static async unSubscribeToTopic(token: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens: string[] = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    await FirebaseMessaging.unsubscribeFromTopic({
      topic: token,
    });
    const newSubscribedTokens = tokens.filter((x) => x !== token);
    localStorage.setItem(FCM_TOKENS, JSON.stringify(newSubscribedTokens));
  }

  public static async subscribeToClassTopicForAllStudents(
    currentUser: TableTypes<'user'>,
  ): Promise<void> {}

  public static isClassTokenSubscribed(classId: string): boolean {
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    const foundToken = tokens.find((token: string) =>
      token.startsWith(classId),
    );
    return !!foundToken;
  }

  public static async unSubscribeToClassTopicForAllStudents() {
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    for (let token of tokens) {
      this.unSubscribeToTopic(token);
    }
  }

  public static async getToken(): Promise<string | undefined> {
    if (!Capacitor.isNativePlatform()) return;
    const result = await FirebaseMessaging.getToken();
    return result.token;
  }

  public static isTextFieldFocus(
    scollToRef: {
      current?: { scrollIntoView: (options: ScrollIntoViewOptions) => void };
    },
    setIsInputFocus: (isFocused: boolean) => void,
  ) {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        setIsInputFocus(true);

        setTimeout(() => {
          scollToRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }, 50);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        setIsInputFocus(false);
      });
    }
  }
}
