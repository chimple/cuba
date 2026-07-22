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
export class UtilLessonProgress extends UtilAnalytics {
  static [key: string]: any;

  public static async checkDownloadedLessonsFromLocal() {
    const storedLastRendered = localStorage.getItem(LAST_FUNCTION_CALL);

    let lastRendered = storedLastRendered
      ? parseInt(storedLastRendered)
      : new Date().getTime();

    if (
      !storedLastRendered ||
      new Date().getTime() - lastRendered > 60 * 60 * 1000
    )
      try {
        if (!Capacitor.isNativePlatform()) return null;

        const contents = await Filesystem.readdir({
          path: '',
          directory: Directory.External,
        });

        const folderNamesArray: string[] = [];

        for (let i = 0; i < contents.files.length; i++) {
          folderNamesArray.push(contents.files[i].name);
        }
        localStorage.setItem(DOWNLOADED_LESSON_ID, JSON.stringify([]));
        this.storeLessonIdToLocalStorage(
          folderNamesArray,
          DOWNLOADED_LESSON_ID,
        );
        lastRendered = new Date().getTime();
        localStorage.setItem(LAST_FUNCTION_CALL, lastRendered.toString());
      } catch (error) {
        logger.error('Error listing folders:', error);
        return null;
      }

    return lastRendered;
  }

  public static async isChapterDownloaded(chapterId: string): Promise<boolean> {
    const chapterLessonIdMap = JSON.parse(
      localStorage.getItem(CHAPTER_ID_LESSON_ID_MAP) || '{}',
    );
    const downloadedLessonIds = JSON.parse(
      localStorage.getItem(DOWNLOADED_LESSON_ID) || '[]',
    );
    const api = ServiceConfig.getI().apiHandler;
    const storedLessonDoc = await api.getLessonsForChapter(chapterId);
    const lessonIdsForChapter = storedLessonDoc
      .map((lesson) => this.getLessonBundleId(lesson))
      .filter((lessonId): lessonId is string => Boolean(lessonId));
    chapterLessonIdMap[chapterId] = lessonIdsForChapter;
    localStorage.setItem(
      CHAPTER_ID_LESSON_ID_MAP,
      JSON.stringify(chapterLessonIdMap),
    );
    const allLessonIdsDownloaded = lessonIdsForChapter.every(
      (lessonId: string) => downloadedLessonIds.includes(lessonId),
    );
    return !allLessonIdsDownloaded;
  }

  // To parse this data:
  //   const course = Convert.toCourse(json);

  public static toCourse(json: string): curriculamInterfaceCourse {
    return JSON.parse(JSON.stringify(json));
  }

  public static courseToJson(value: curriculamInterfaceCourse): string {
    return JSON.stringify(value);
  }

  public static async getLastPlayedLessonIndex(
    subjectCode: string,
    lessons: curriculamInterfaceLesson[],
    chapters: curriculamInterfaceChapter[] = [],
    lessonResultMap: { [key: string]: TableTypes<'result'> } = {},
  ): Promise<number> {
    const currentLessonJson = localStorage.getItem(CURRENT_LESSON_LEVEL());
    let currentLessonLevel: any = {};
    if (currentLessonJson) {
      currentLessonLevel = JSON.parse(currentLessonJson);
    }
    const currentLessonId = currentLessonLevel[subjectCode];
    if (currentLessonId) {
      const lessonIndex: number = lessons.findIndex(
        (lesson: any) => lesson.id === currentLessonId,
      );
      if (lessonIndex >= 0) return lessonIndex;
    }

    if (subjectCode === COURSES.PUZZLE) {
      if (Object.keys(lessonResultMap).length <= 0) return 0;
      const currentIndex = this.getLastPlayedLessonIndexForLessons(
        lessons,
        lessonResultMap,
      );

      return currentIndex <= 0 ? -1 : currentIndex;
    }
    const apiInstance = OneRosterApi.getInstance();
    const preQuiz = lessonResultMap[subjectCode + '_' + PRE_QUIZ];
    if (!preQuiz) return -1;
    const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
      subjectCode,
      preQuiz.score ?? 0,
      chapters,
    );

    const tempCurrentIndex = this.getLastPlayedLessonIndexForLessons(
      tempLevelChapter.lessons,
      lessonResultMap,
    );
    let currentIndex: number = lessons.findIndex(
      (lesson: any) =>
        lesson.id === tempLevelChapter.lessons[tempCurrentIndex].id,
    );

    return currentIndex < 0 ? 0 : currentIndex;
  }

  public static getLastPlayedLessonIndexForLessons(
    lessons: curriculamInterfaceLesson[],
    lessonResultMap: { [key: string]: TableTypes<'result'> } = {},
  ): number {
    let tempCurrentIndex = 0;
    for (let i = 0; i < lessons.length; i++) {
      if (lessonResultMap[lessons[i].id]) {
        tempCurrentIndex = i;
      }
    }
    return tempCurrentIndex;
  }

  public static getCourseByGrade(courseId: string): string {
    let selectedGrade = localStorage.getItem(SELECTED_GRADE());
    let gradeMap = {};
    if (!selectedGrade) {
      gradeMap = { en: SL_GRADES.GRADE1, maths: SL_GRADES.GRADE1 };
    } else {
      gradeMap = JSON.parse(selectedGrade);
    }

    return courseId;
  }

  public static async showLog(msg: string | object): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return;
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg);
    }
    await Toast.show({
      text: msg,
      duration: 'long',
    });
  }

  public static async logEvent(eventName: EVENTS, params: {}) {
    try {
      const baseContext = buildGlobalEventBaseContext();
      const mergedParams = {
        ...baseContext,
        ...params,
      };
      const normalizedParams: { [key: string]: string } = Object.fromEntries(
        Object.entries(mergedParams).map(([key, value]) => [
          key,
          String(value),
        ]),
      );
      //Setting User Id in User Properites
      await FirebaseAnalytics.setUserId({
        userId: normalizedParams.user_id,
      });
      try {
        if (!this.port) this.port = registerPlugin<PortPlugin>('Port');
        await Promise.resolve(
          this.port.shareUserId({ userId: normalizedParams.user_id }),
        );
      } catch (e) {
        logger.warn('Port.shareUserId skipped:', e);
      }
      await FirebaseCrashlytics.setUserId({
        userId: normalizedParams.user_id,
      });

      await FirebaseAnalytics.setScreenName({
        screenName: getAppPathname(),
        nameOverride: getAppPathname(),
      });

      await FirebaseAnalytics.logEvent({
        name: eventName,
        params: normalizedParams,
      });
    } catch (error) {
      logger.error(
        'Error logging event to firebase analytics ',
        eventName,
        ':',
        error,
      );
    }
  }

  public static async setUserProperties(currentUser: TableTypes<'user'>) {
    try {
      await FirebaseAnalytics.setUserProperty({
        name: 'parent user_id',
        value: currentUser.id,
      });
      await FirebaseAnalytics.setUserProperty({
        name: 'name',
        value: currentUser.name ?? '',
      });
      await FirebaseAnalytics.setUserProperty({
        name: 'age',
        value: currentUser.age?.toLocaleString() || '',
      });
      await FirebaseAnalytics.setUserProperty({
        name: 'gender',
        value: currentUser.gender?.toLocaleString() || '',
      });
    } catch (error) {
      logger.error('Set User Properties Error ', error);
    }
  }

  public static async logCurrentPageEvents(user: TableTypes<'user'>) {
    //Setting User Id in User Properites
    await FirebaseAnalytics.setUserId({
      userId: user.id,
    });

    await this.setUserProperties(user);

    //Setting Screen Name
    await FirebaseAnalytics.setScreenName({
      screenName: getAppPathname(),
      nameOverride: getAppPathname(),
    });
  }

  public static onAppStateChange = ({ isActive }: { isActive: boolean }) => {
    if (!isActive) {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    }
    logger.info('[Lifecycle] App state changed', { isActive });

    // Handling app state changes (reloading pages, updating URLs, etc.)
    const currentPath = getAppPathname();
    const continueValue = getAppSearchParams().get(CONTINUE);
    const urlParams = getAppSearchParams();
    if (!!urlParams.get(CONTINUE)) {
      urlParams.delete(CONTINUE);
    }
    if (!(urlParams.get(CONTINUE) || PAGES.APP_UPDATE)) {
      return;
    }
    urlParams.delete(CONTINUE);

    if (isActive) {
      if (
        Capacitor.isNativePlatform() &&
        continueValue === 'true' &&
        currentPath !== PAGES.LOGIN &&
        currentPath !== PAGES.EDIT_STUDENT
      ) {
        if (
          currentPath === PAGES.DISPLAY_SUBJECTS ||
          currentPath === PAGES.DISPLAY_CHAPTERS
        ) {
          urlParams.set('isReload', 'true');
        }
        urlParams.delete(CONTINUE);
        replaceAppUrl({
          pathname: currentPath,
          search: urlParams.toString() ? `?${urlParams.toString()}` : '',
          hash: '',
        });
        window.location.reload();
      } else {
        urlParams.set('isReload', 'true');
        urlParams.delete(CONTINUE);
        replaceAppUrl({
          pathname: currentPath,
          search: urlParams.toString() ? `?${urlParams.toString()}` : '',
          hash: '',
        });
      }
    }
  };
}
