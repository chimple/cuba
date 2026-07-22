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
export class UtilAppLifecycle extends UtilNotifications {
  static [key: string]: any;

  public static async startFlexibleUpdate(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const canCheckUpdate = this.canCheckUpdate(LAST_UPDATE_CHECKED);

      if (!canCheckUpdate) return;
      const result = await AppUpdate.getAppUpdateInfo();

      if (
        result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE
      ) {
        return;
      }
      if (result.flexibleUpdateAllowed) {
        const appUpdateResult = await AppUpdate.startFlexibleUpdate();

        if (appUpdateResult.code === AppUpdateResultCode.OK) {
          await AppUpdate.completeFlexibleUpdate();
        }
      }
    } catch (error) {
      logger.error(
        '🚀 ~ file: util.ts:482 ~ startFlexibleUpdate ~ error:',
        JSON.stringify(error),
      );
    }
  }

  public static notificationsCount = 0;

  public static async notificationListener(
    onNotification: (extraData?: object) => void,
  ) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      FirebaseMessaging.addListener(
        'notificationReceived',
        async ({ notification }) => {
          try {
            const res = await LocalNotifications.schedule({
              notifications: [
                {
                  id: this.notificationsCount++,
                  body: notification.body ?? '',
                  title: notification.title ?? 'Chimple',
                  attachments: !!notification.image
                    ? [{ id: notification.image, url: notification.image }]
                    : undefined,
                  extra: notification.data,
                },
              ],
            });
            LocalNotifications.addListener(
              'localNotificationActionPerformed',
              (notification) => {
                const extraData = notification.notification.extra;
                onNotification(extraData);
              },
            );
          } catch (error) {
            logger.error(
              '🚀 ~ file: util.ts:630 ~ error:',
              JSON.stringify(error),
            );
          }
        },
      );
      const canCheckPermission = this.canCheckUpdate(LAST_PERMISSION_CHECKED);
      if (!canCheckPermission) return;
      const result = await FirebaseMessaging.checkPermissions();
      if (result.receive === 'granted') return;
      await FirebaseMessaging.requestPermissions();
    } catch (error) {
      logger.error(
        '🚀 ~ file: util.ts:514 ~ checkNotificationPermissionsAndType ~ error:',
        JSON.stringify(error),
      );
    }
  }

  public static async navigateTabByNotificationData(data: any) {
    const currentStudent = this.getCurrentStudent();
    const api = ServiceConfig.getI().apiHandler;
    if (data && data.notificationType === ASSIGNMENT_TYPE.REWARD) {
      const rewardProfileId = data.rewardProfileId;
      if (rewardProfileId)
        if (currentStudent?.id === rewardProfileId) {
          replaceWithNavigationTarget(
            PAGES.HOME + '?tab=' + HOMEHEADERLIST.HOME,
          );
        } else {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => user.id === rewardProfileId) || students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            replaceWithNavigationTarget(
              PAGES.HOME + '?tab=' + HOMEHEADERLIST.HOME,
            );
          } else {
            return;
          }
        }
    } else if (data && data.notificationType === ASSIGNMENT_TYPE.ASSIGNMENT) {
      sessionStorage.setItem(ASSIGNMENT_POPUP_SHOWN, 'false');
      if (data.classId) {
        const classId = data.classId;
        if (!classId) return;
        const studentsData = await api.getStudentsForClass(classId);
        let tempStudentIds: string[] = [];
        for (let student of studentsData) {
          tempStudentIds.push(student.id);
        }
        let foundMatch = false;
        for (let studentId of tempStudentIds) {
          if (currentStudent?.id === studentId) {
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => tempStudentIds.includes(user.id)) ||
            students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            replaceWithNavigationTarget(
              PAGES.HOME + '?tab=' + HOMEHEADERLIST.ASSIGNMENT,
            );
          }
        } else {
          replaceWithNavigationTarget(
            PAGES.HOME + '?tab=' + HOMEHEADERLIST.ASSIGNMENT,
          );
          return;
        }
      }
    } else if (data && data.notificationType === ASSIGNMENT_TYPE.LIVEQUIZ) {
      sessionStorage.setItem(QUIZ_POPUP_SHOWN, 'false');
      if (data.classId) {
        const classId = data.classId;
        const studentsData = await api.getStudentsForClass(classId);
        let tempStudentIds: string[] = [];
        for (let student of studentsData) {
          tempStudentIds.push(student.id);
        }
        let foundMatch = false;
        for (let studentId of tempStudentIds) {
          if (currentStudent?.id === studentId) {
            replaceWithNavigationTarget(
              data.assignmentId
                ? PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${data.assignmentId}`
                : PAGES.HOME + '?tab=' + HOMEHEADERLIST.LIVEQUIZ,
            );
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => tempStudentIds.includes(user.id)) ||
            students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            replaceWithNavigationTarget(
              PAGES.HOME + '?tab=' + HOMEHEADERLIST.LIVEQUIZ,
            );
          }
        }
      } else {
        replaceWithNavigationTarget(
          PAGES.HOME + '?tab=' + HOMEHEADERLIST.LIVEQUIZ,
        );
        return;
      }
    }
  }

  public static canCheckUpdate(updateFor: string) {
    const tempLastUpdateChecked = localStorage.getItem(updateFor);
    const now = new Date();
    let lastUpdateChecked: Date | undefined;
    if (!!tempLastUpdateChecked) {
      lastUpdateChecked = new Date(tempLastUpdateChecked);
    }
    if (!lastUpdateChecked) {
      localStorage.setItem(updateFor, now.toString());
      return true;
    }
    const lessThanOneHourAgo = (date: Date): boolean => {
      const now = new Date();
      const ONE_HOUR = 60 * 60 * 1000; /* ms */
      const res = now.getTime() - date.getTime() < ONE_HOUR;
      return res;
    };
    const _canCheckUpdate = !lessThanOneHourAgo(lastUpdateChecked);
    if (_canCheckUpdate) {
      localStorage.setItem(updateFor, now.toString());
    }
    return _canCheckUpdate;
  }

  public static listenToNetwork() {}

  public static async showInAppReview() {
    try {
      await InAppReview.requestReview();
    } catch (error) {
      logger.error(
        '🚀 ~ file: util.ts:694 ~ showInAppReview ~ error:',
        JSON.stringify(error),
      );
    }
  }

  public static async fetchNotificationData() {
    if (!this.port) this.port = registerPlugin<PortPlugin>('Port');
    return this.port.fetchNotificationData();
  }

  public static async migrate() {
    if (
      !Capacitor.isNativePlatform() ||
      !!localStorage.getItem(IS_MIGRATION_CHECKED)
    )
      return { migrated: false };
    const path = await Filesystem.getUri({
      directory: Directory.Data,
      path: '',
    });
    const filePath = path.uri.replace('/files', '/databases/') + 'jsb.sqlite';
    const url = Capacitor.convertFileSrc(filePath);
    const res = await fetch(url);
    const isExists = res.ok;
    if (!isExists) return { migrated: false };

    if (!this.port) {
      this.port = registerPlugin<PortPlugin>('Port');
    }
    try {
      const port = await this.port.getMigrateUsers();
      const functions = getFunctions();
      const migrateUsers = httpsCallable(functions, 'MigrateUsers');
      const result = await migrateUsers({
        users: port.users,
      });
      const res: any = result.data;
    } catch (error) {
      logger.error('🚀 ~ file: util.ts:707 ~ migrate ~ error:', error);
      return { migrated: false };
    }
  }

  public static async getCanShowAvatar(): Promise<boolean> {
    try {
      const currMode = await schoolUtil.getCurrMode();

      if (currMode === MODES.SCHOOL) {
        return true;
      }

      const student = await this.getCurrentStudent();

      if (!student) {
        logger.error('Student is undefined or null');
        return false;
      }

      const api = ServiceConfig.getI().apiHandler;
      const studentResult = await api.getStudentClassesAndSchools(student.id);

      if (
        studentResult &&
        studentResult.classes &&
        studentResult.classes.length > 0
      ) {
        return true;
      }

      // If Remote Config allows showing avatar, return true
      const canShowAvatarValue = false;

      return canShowAvatarValue;
    } catch (error) {
      logger.error('Error in getCanShowAvatar:', error);
      return false;
    }
  }
}
