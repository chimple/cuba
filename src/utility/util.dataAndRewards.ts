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
export class UtilDataAndRewards extends UtilFileStorage {
  static [key: string]: any;

  public static async triggerSaveProceesedXlsxFile(data: {
    fileData: string;
    fileName?: string;
  }) {
    try {
      if (!this.port) {
        this.port = registerPlugin<PortPlugin>('Port');
      }
      await this.port.saveProceesedXlsxFile({
        fileData: data.fileData,
        fileName: data.fileName,
      });
    } catch (error) {
      logger.error('Download failed:', error);
    }
  }

  public static handleMissingEntities(
    history: any,
    redirectPage: string,
    origin: PAGES,
    classId?: string,
  ) {
    history.replace({
      ...parsePath(redirectPage),
      state: {
        classId: classId,
        origin: origin,
        isSelect: true,
      },
    });
  }

  public static async handleClassAndSubjects(
    schoolId: string,
    userId: string,
    history: any,
    originPage: PAGES,
  ) {
    if (schoolId === undefined) return;
    const api = ServiceConfig.getI().apiHandler;
    const schoolCourses = await api.getCoursesBySchoolId(schoolId);
    if (schoolCourses.length === 0) {
      this.setNavigationState(School_Creation_Stages.SCHOOL_COURSE);
      history.replace({
        ...parsePath(PAGES.SUBJECTS_PAGE),
        state: {
          schoolId: schoolId,
          origin: originPage,
          isSelect: true,
        },
      });
      return;
    }
    const fetchedClasses = await api.getClassesForSchool(schoolId, userId);
    if (fetchedClasses.length === 0) {
      history.replace({
        ...parsePath(PAGES.ADD_CLASS),
        state: {
          school: { id: schoolId },
          origin: originPage,
        },
      });
      return;
    }

    const currentClass = this.getCurrentClass();
    const validCurrentClass = currentClass
      ? fetchedClasses.find((classItem) => classItem.id === currentClass.id)
      : undefined;

    if (!validCurrentClass) {
      await this.setCurrentClass(fetchedClasses[0]);
    }

    const classCoursesData = await Promise.all(
      fetchedClasses.map((classItem) =>
        api.getCoursesByClassId(classItem.id).then((courses) => ({
          classId: classItem.id,
          courses,
        })),
      ),
    );

    const classWithoutSubjects = classCoursesData.find(
      (data) => data.courses.length === 0,
    );

    if (classWithoutSubjects) {
      this.setNavigationState(School_Creation_Stages.CLASS_COURSE);
      this.handleMissingEntities(
        history,
        PAGES.SUBJECTS_PAGE,
        originPage,
        classWithoutSubjects.classId,
      );
      return;
    }
  }

  public static async encryptData(data: object): Promise<string | null> {
    try {
      const stringData = JSON.stringify(data);
      const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

      if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set.');
      }
      return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
    } catch (error) {
      logger.error('Encryption failed:', error);
      return null;
    }
  }

  public static async decryptData(
    ciphertext: string,
  ): Promise<{ email: string; password: string } | null> {
    try {
      const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
      if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set.');
      }

      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption failed:', error);
      return null;
    }
  }

  public static async storeLoginDetails(
    email: string,
    password: string,
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const encryptedData = await this.encryptData({ email, password });
      if (encryptedData) {
        localStorage.setItem(SCHOOL_LOGIN, encryptedData);
      }
    } catch (error) {
      logger.error('Failed to encrypt and store login details:', error);
    }
  }

  public static async downloadFileFromUrl(fileUrl: string): Promise<void> {
    try {
      const response = await fetch(fileUrl);

      // ✅ Validate content type to avoid corrupted files
      const contentType = response.headers.get('content-type') || '';
      if (
        contentType.includes('text/html') ||
        contentType.includes('application/json')
      ) {
        const text = await response.text();
        logger.error(
          'Unexpected content instead of a file:',
          text.slice(0, 100),
        );
        throw new Error(
          'Invalid file download. Check if the link is direct and the file is public.',
        );
      }
      const blob = await response.blob();
      this.handleBlobDownloadAndSave(blob, 'BulkUploadTemplate.xlsx');
    } catch (error) {
      logger.error('Download failed:', error);
    }
  }

  public static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        resolve(base64Data.split(',')[1]);
      };
      reader.onerror = reject;
    });
  }

  public static async handleBlobDownloadAndSave(blob: Blob, fileName?: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const base64 = await this.blobToBase64(blob);
        await this.triggerSaveProceesedXlsxFile({
          fileData: base64,
          fileName: fileName,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'ProcessedFile.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Failed to save or download file:', error);
    }
  }

  public static mergeStudentsByUpdatedAt(
    apiStudents: TableTypes<'user'>[],
    storedMapStr: string | null,
  ): TableTypes<'user'>[] {
    const studentsMap: Record<string, TableTypes<'user'>> = storedMapStr
      ? JSON.parse(storedMapStr)
      : {};

    const mergedStudents = apiStudents.map((studentFromAPI) => {
      const localStudent = studentsMap[studentFromAPI.id];

      if (localStudent) {
        const apiUpdatedAt = new Date(studentFromAPI.updated_at ?? 0).getTime();
        const localUpdatedAt = new Date(localStudent.updated_at ?? 0).getTime();
        return localUpdatedAt > apiUpdatedAt ? localStudent : studentFromAPI;
      }
      return studentFromAPI;
    });

    return mergedStudents;
  }

  public static async loadBackgroundImage() {
    const body = document.querySelector('body');
    if (
      Capacitor.isNativePlatform() &&
      localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === 'true'
    ) {
      try {
        const result = await Filesystem.readFile({
          path: 'remoteAsset/remoteBackground.svg',
          directory: Directory.External,
        });
        const res = await this.blobToString(result.data);
        const svgData = atob(res); // decode base64

        if (body) {
          body.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(
            svgData,
          )}')`;
          body.style.backgroundRepeat = 'no-repeat';
          body.style.backgroundSize = 'cover';
          body.style.backgroundPosition = 'center center';
        }
      } catch (e) {
        body?.style.setProperty(
          'background-image',
          'url(/pathwayAssets/pathwayBackground.svg)',
        );
        body?.style.setProperty('background-repeat', 'no-repeat');
        body?.style.setProperty('background-size', 'cover');
        body?.style.setProperty('background-position', 'center center');
        logger.error('Failed to load remote background image:', e);
      }
    } else {
      body?.style.setProperty(
        'background-image',
        'url(/pathwayAssets/pathwayBackground.svg)',
      );
      body?.style.setProperty('background-repeat', 'no-repeat');
      body?.style.setProperty('background-size', 'cover');
      body?.style.setProperty('background-position', 'center center');
    }
  }
}
