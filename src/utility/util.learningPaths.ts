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

import { UtilRewards } from './util.rewards';
export class UtilLearningPaths extends UtilRewards {
  static [key: string]: any;
  public static retrieveUserReward() {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) return {};
    const studentId = currentStudent.id;
    try {
      const allRewards = JSON.parse(
        localStorage.getItem(DAILY_USER_REWARD) || '{}',
      );

      if (!allRewards[studentId]) {
        allRewards[studentId] = {};
      }
      const currentReward = allRewards[studentId];

      return currentReward;
    } catch (error) {
      logger.error('Error managing daily user reward in localStorage:', error);
      return {};
    }
  }

  public static async updateHomeworkPath(completedIndex?: number) {
    try {
      const storedPath = localStorage.getItem(HOMEWORK_PATHWAY);
      if (!storedPath) {
        logger.error('Could not find homework path in localStorage to update.');
        return;
      }

      // Snapshot path early to avoid races
      const homeworkPath = JSON.parse(storedPath) as {
        path_id?: string;
        lessons?: any[];
        currentIndex?: number;
      };

      const student = this.getCurrentStudent();
      const studentId = student?.id ?? null;

      // If caller provided which index completed, use that
      if (typeof completedIndex === 'number') {
        const lessons = homeworkPath.lessons ?? [];
        const completedLesson = lessons[completedIndex] ?? null;

        // --- 1) LOG ASSIGNMENT COMPLETED (deduped locally) ---
        try {
          const assignmentId = completedLesson?.assignment_id ?? null;
          if (assignmentId && studentId) {
            const completedKey = ASSIGNMENT_COMPLETED_IDS;
            const temp = localStorage.getItem(completedKey);
            const completedMap = temp ? JSON.parse(temp) : {};
            const studentCompleted = completedMap[studentId] || [];

            if (!studentCompleted.includes(assignmentId)) {
              const assignmentPayload = {
                user_id: studentId,
                student_id: studentId,
                path_id: homeworkPath.path_id ?? null,
                assignment_id: assignmentId,
                lesson_id:
                  completedLesson?.lesson_id ??
                  completedLesson?.lesson?.id ??
                  null,
                chapter_id: completedLesson?.chapter_id ?? null,
                course_id: completedLesson?.course_id ?? null,
                index_in_path: completedIndex,
                completed_at: new Date().toISOString(),
              };

              try {
                this.logEvent(
                  EVENTS.HOMEWORK_PATHWAY_ASSIGNMENT_COMPLETED,
                  assignmentPayload,
                );
              } catch (e) {
                logger.warn(
                  '[Analytics] Failed to log HOMEWORK_PATHWAY_ASSIGNMENT_COMPLETED',
                  e,
                );
              }

              // mark as logged locally
              studentCompleted.push(assignmentId);
              completedMap[studentId] = studentCompleted;
              localStorage.setItem(completedKey, JSON.stringify(completedMap));
            }
          }
        } catch (e) {
          logger.warn('[Analytics] assignment-completed block failed', e);
        }

        // --- 2) Decide if this was the last lesson in the path ---
        const lessonsLen = homeworkPath.lessons?.length ?? 0;
        const newCurrentIndex = completedIndex + 1;
        const isNowComplete = newCurrentIndex >= lessonsLen;

        if (isNowComplete) {
          if (studentId) {
            let preAwardCollectedStickerIds: string[] = [];
            try {
              const currentBookWithProgress =
                await ServiceConfig.getI().apiHandler.getCurrentStickerBookWithProgress(
                  studentId,
                );
              preAwardCollectedStickerIds =
                currentBookWithProgress?.progress?.stickers_collected ?? [];
            } catch {
              preAwardCollectedStickerIds = [];
            }

            const stickerAwardResult =
              await this.tryAwardStickerForCompletedPathway(
                studentId,
                'homework_pathway',
              );
            this.seedPathwayStickerRewardSession({
              studentId,
              stickerAwardResult,
              preAwardCollectedStickerIds,
            });
          } else {
            this.clearPathwayStickerRewardSession();
          }

          // Build and log pathway completed event (using snapshot)
          try {
            const prevIndex = Math.max(completedIndex, 0); // the lesson just completed
            const prev = homeworkPath.lessons?.[prevIndex] ?? null;

            const lessonIds = (homeworkPath.lessons ?? []).map(
              (l: any) => l.lesson_id ?? l.lesson?.id ?? null,
            );
            const assignmentIds = (homeworkPath.lessons ?? []).map(
              (l: any) => l.assignment_id ?? l.id ?? null,
            );

            const completedEvent = {
              user_id: studentId,
              student_id: studentId,
              completed_path_id: homeworkPath.path_id ?? null,
              completed_course_id: prev?.course_id ?? null,
              completed_lesson_id: prev?.lesson_id ?? prev?.lesson?.id ?? null,
              assignment_id: prev?.assignment_id ?? null,
              completed_chapter_id: prev?.chapter_id ?? null,
              total_lessons_in_path: lessonsLen,
              lesson_ids: lessonIds,
              assignment_ids: assignmentIds,
              completed_at: new Date().toISOString(),
              source: 'updateHomeworkPath',
            };

            try {
              this.logEvent(EVENTS.HOMEWORK_PATHWAY_COMPLETED, completedEvent);
            } catch (e) {
              logger.warn(
                '[Analytics] Failed to log HOMEWORK_PATHWAY_COMPLETED',
                e,
              );
            }
          } catch (e) {
            logger.warn('[Analytics] pathway-completed block failed', e);
          }

          // finally remove the path from storage
          localStorage.removeItem(HOMEWORK_PATHWAY);
        } else {
          // Not complete → advance index and persist
          homeworkPath.currentIndex = newCurrentIndex;
          localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(homeworkPath));
        }

        return; // finished handling completedIndex case
      }

      // --- fallback: no completedIndex provided — preserve existing behaviour ---
      const newCurrentIndexFallback = (homeworkPath.currentIndex ?? 0) + 1;
      if (newCurrentIndexFallback >= (homeworkPath.lessons?.length ?? 0)) {
        // path finished
        if (studentId) {
          let preAwardCollectedStickerIds: string[] = [];
          try {
            const currentBookWithProgress =
              await ServiceConfig.getI().apiHandler.getCurrentStickerBookWithProgress(
                studentId,
              );
            preAwardCollectedStickerIds =
              currentBookWithProgress?.progress?.stickers_collected ?? [];
          } catch {
            preAwardCollectedStickerIds = [];
          }

          const stickerAwardResult =
            await this.tryAwardStickerForCompletedPathway(
              studentId,
              'homework_pathway',
            );
          this.seedPathwayStickerRewardSession({
            studentId,
            stickerAwardResult,
            preAwardCollectedStickerIds,
          });
        } else {
          this.clearPathwayStickerRewardSession();
        }

        try {
          // log completed event similar to above (best-effort)
          const lessons = homeworkPath.lessons ?? [];
          const prevIndex = Math.max((homeworkPath.currentIndex ?? 0) - 1, 0);
          const prev = lessons[prevIndex] ?? null;

          const lessonIds = lessons.map(
            (l: any) => l.lesson_id ?? l.lesson?.id ?? null,
          );
          const assignmentIds = lessons.map(
            (l: any) => l.assignment_id ?? l.id ?? null,
          );

          const completedEvent = {
            user_id: studentId,
            student_id: studentId,
            completed_path_id: homeworkPath.path_id ?? null,
            completed_course_id: prev?.course_id ?? null,
            completed_lesson_id: prev?.lesson_id ?? prev?.lesson?.id ?? null,
            assignment_id: prev?.assignment_id ?? null,
            completed_chapter_id: prev?.chapter_id ?? null,
            total_lessons_in_path: lessons.length,
            lesson_ids: lessonIds,
            assignment_ids: assignmentIds,
            completed_at: new Date().toISOString(),
            source: 'updateHomeworkPath',
          };

          try {
            this.logEvent(EVENTS.HOMEWORK_PATHWAY_COMPLETED, completedEvent);
          } catch (e) {
            logger.warn(
              '[Analytics] Failed to log HOMEWORK_PATHWAY_COMPLETED (fallback)',
              e,
            );
          }
        } catch (e) {
          logger.warn('[Analytics] pathway completed (fallback) failed', e);
        }

        localStorage.removeItem(HOMEWORK_PATHWAY);
      } else {
        homeworkPath.currentIndex = newCurrentIndexFallback;
        localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(homeworkPath));
      }
    } catch (error) {
      logger.error('Failed to update homework path:', error);
    }
  }
}
