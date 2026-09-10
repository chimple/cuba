import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { PREDICTIVE_BUFFER_LESSON_IDS } from '../../common/constants';
import { ServiceConfig } from '../ServiceConfig';
import { getPredictiveBundleZipUrls } from '../../utility/util.remoteAssets';
import { Util } from '../../utility/util';
import { runBackgroundWorkerStreamingLessonZips } from '../../workers/backgroundWorkerClient';
import { StorageManager } from '../../utility/storageManager';
import { PredictiveDownloadServiceJoined } from './PredictiveDownloadServiceJoined';
import { PredictiveDownloadServiceNotJoined } from './PredictiveDownloadServiceNotJoined';
import logger from '../../utility/logger';

export const PREDICTIVE_BUFFER_SIZE = 5;

export type StoredLesson = {
  lesson_id?: string;
  chapter_id?: string;
  is_assessment?: boolean;
  isPlayed?: boolean;
};

export type StoredCoursePath = {
  course_id?: string;
  path?: StoredLesson[];
};

export type StoredLearningPath = {
  pathMode?: string;
  courses?: {
    courseList?: StoredCoursePath[];
  };
};

type PredictiveLesson = {
  lessonId: string;
  dbVersion: number;
  zipUrls: string[];
};

export type PredictiveDownloadType = 'assessment' | 'assignment' | 'normal';

export type PredictiveDownloadContext = {
  courseId: string;
  courseName: string | null;
  download: PredictiveDownloadType;
  subject: string;
};

export type PredictiveDownloadQueue = {
  lessonIds: string[];
  courseByLessonId: Map<string, PredictiveDownloadContext>;
};

export type PredictiveDownloadDependencies = {
  bufferSize: number;
  downloadMissingLessons: (
    lessonIds: string[],
    courseByLessonId: Map<string, PredictiveDownloadContext>,
  ) => Promise<void>;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export class PredictiveDownloadService {
  private static running: Promise<void> | null = null;
  private static refreshRequested = false;

  public static refresh(): Promise<void> {
    const currentStudent = Util.getCurrentStudent();
    logger.info('[***] Refresh requested', {
      page:
        typeof window === 'undefined' ? 'unknown' : window.location.pathname,
      hasStudent: Boolean(currentStudent?.id),
    });
    if (this.running) {
      this.refreshRequested = true;
      return this.running;
    }
    this.running = this.run().finally(() => {
      this.running = null;
      if (this.refreshRequested) {
        this.refreshRequested = false;
        void this.refresh();
      }
    });
    return this.running;
  }

  private static async run(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        logger.info('[***] Skipped', { reason: 'not_native' });
        return;
      }

      // The selected child is passed by the selection event. Do not replace
      // it with a stale cached student or the parent's auth user.
      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent?.id) {
        logger.info('[***] Skipped', {
          reason: 'student_not_authenticated',
        });
        return;
      }

      const network = await Network.getStatus();
      if (!network.connected) {
        logger.info('[***] Skipped', {
          reason: 'network_disconnected',
        });
        return;
      }
      if ((navigator as NavigatorWithConnection).connection?.saveData) {
        logger.info('[***] Skipped', {
          reason: 'data_saver_enabled',
        });
        return;
      }

      // Membership is only routing. Each flow owns its complete class or
      // no-class prediction pipeline after this decision.
      const isStudentLinked =
        await ServiceConfig.getI().apiHandler.isStudentLinked(
          currentStudent.id,
          true,
        );
      const dependencies: PredictiveDownloadDependencies = {
        bufferSize: PREDICTIVE_BUFFER_SIZE,
        downloadMissingLessons: (lessonIds, courseByLessonId) =>
          this.downloadMissingLessons(lessonIds, courseByLessonId),
      };
      if (isStudentLinked) {
        await PredictiveDownloadServiceJoined.run(currentStudent, dependencies);
        return;
      }
      await PredictiveDownloadServiceNotJoined.run(
        currentStudent,
        dependencies,
      );
    } catch (error) {
      logger.info('[***] Refresh failed', error);
    }
  }

  private static async downloadMissingLessons(
    lessonIds: string[],
    courseByLessonId: Map<string, PredictiveDownloadContext>,
  ): Promise<void> {
    const api = ServiceConfig.getI().apiHandler;
    if (!lessonIds.length) {
      logger.info('[***] No lessons to download', {
        reason: 'queue_empty',
      });
      localStorage.setItem(PREDICTIVE_BUFFER_LESSON_IDS, '[]');
      return;
    }

    const assessmentSubjects = new Set<string>();
    const assignmentSubjects = new Set<string>();
    const normalSubjects = new Set<string>();
    for (const context of courseByLessonId.values()) {
      if (context.download === 'assessment')
        assessmentSubjects.add(context.subject);
      if (context.download === 'assignment')
        assignmentSubjects.add(context.subject);
      if (context.download === 'normal') normalSubjects.add(context.subject);
    }
    logger.info('[***] Content found', {
      page:
        typeof window === 'undefined' ? 'unknown' : window.location.pathname,
      assessments: `${assessmentSubjects.size} subjects`,
      assessmentSubjects: [...assessmentSubjects],
      assignmentLessons: `${assignmentSubjects.size} subjects`,
      assignmentSubjects: [...assignmentSubjects],
      normalLessons: `${normalSubjects.size} subjects`,
      normalSubjects: [...normalSubjects],
    });
    logger.info('[***] Queue prepared', {
      lessonCount: lessonIds.length,
    });
    const downloadedByCourse = new Map<
      string,
      {
        courseId: string;
        courseName: string | null;
        assignmentsDownloaded: number;
        assessmentsDownloaded: number;
        lessonsDownloaded: number;
      }
    >();
    for (const context of courseByLessonId.values()) {
      if (!downloadedByCourse.has(context.courseId)) {
        downloadedByCourse.set(context.courseId, {
          courseId: context.courseId,
          courseName: context.courseName,
          assignmentsDownloaded: 0,
          assessmentsDownloaded: 0,
          lessonsDownloaded: 0,
        });
      }
    }

    const lessonRows = await api.getLessonsBylessonIds(lessonIds);
    const lessonsById = new Map(
      (lessonRows ?? []).map((lesson) => [lesson.id, lesson]),
    );
    const predictiveBufferLessonIds = Array.from(
      new Set(
        (lessonRows ?? [])
          .map((lesson) => Util.getLessonBundleId(lesson))
          .filter((lessonId): lessonId is string => Boolean(lessonId)),
      ),
    );
    localStorage.setItem(
      PREDICTIVE_BUFFER_LESSON_IDS,
      JSON.stringify(predictiveBufferLessonIds),
    );
    // Evict old assets before downloading; the desired unplayed window was
    // recorded above so StorageManager will protect it.
    await StorageManager.checkStorageLimit();
    const zipUrls = getPredictiveBundleZipUrls();
    if (!zipUrls.length) {
      logger.info('[***] No bundle URLs configured', {
        downloadedByCourse: [...downloadedByCourse.values()],
      });
      return;
    }
    const candidateLessons = (
      await Promise.all(
        lessonIds.map(async (lessonId): Promise<PredictiveLesson | null> => {
          const lesson = lessonsById.get(lessonId);
          if (!lesson) return null;
          const bundleId = Util.getLessonBundleId(lesson);
          if (!bundleId || (await this.isCached(bundleId, lesson.version))) {
            return null;
          }
          return {
            lessonId: bundleId,
            dbVersion: Number(lesson.version ?? 1),
            zipUrls,
          };
        }),
      )
    ).filter((lesson): lesson is PredictiveLesson => lesson !== null);
    const lessons = Array.from(
      new Map(
        candidateLessons.map((lesson) => [lesson.lessonId, lesson]),
      ).values(),
    );
    if (!lessons.length) {
      logger.info('[***] No missing lesson bundles', {
        requestedLessonCount: lessonIds.length,
        downloadedByCourse: [...downloadedByCourse.values()],
      });
      return;
    }

    const courseByBundleId = new Map<string, PredictiveDownloadContext>();
    for (const lessonId of lessonIds) {
      const lesson = lessonsById.get(lessonId);
      const bundleId = lesson ? Util.getLessonBundleId(lesson) : null;
      const context = courseByLessonId.get(lessonId);
      if (bundleId && context) courseByBundleId.set(bundleId, context);
    }

    let downloadIndex = 0;
    await Util.enqueueLessonBundleTask(async () => {
      await runBackgroundWorkerStreamingLessonZips(
        { concurrency: 1, lessons },
        async ({ lessonId, dbVersion, arrayBuffer }) => {
          downloadIndex += 1;
          const context = courseByBundleId.get(lessonId);
          logger.info('[***] Downloading lesson', {
            page:
              typeof window === 'undefined'
                ? 'unknown'
                : window.location.pathname,
            download: context?.download ?? 'unknown',
            subject: context?.subject ?? 'unknown',
            downloading: `${downloadIndex}/${lessons.length}`,
            courseId: context?.courseId ?? 'unknown',
            courseName: context?.courseName ?? null,
            lessonId,
          });
          try {
            const extracted = await Util.extractDownloadedLessonZip(
              lessonId,
              arrayBuffer,
              dbVersion,
            );
            if (!extracted) throw new Error(`Failed to extract ${lessonId}`);
            if (context) {
              const counts = downloadedByCourse.get(context.courseId);
              if (counts) {
                if (context.download === 'assignment')
                  counts.assignmentsDownloaded += 1;
                if (context.download === 'assessment')
                  counts.assessmentsDownloaded += 1;
                if (context.download === 'normal')
                  counts.lessonsDownloaded += 1;
              }
            }
          } catch (error) {
            // Resolve this lesson so one bad ZIP cannot block the next one.
            logger.info('[***] Lesson skipped', {
              lessonId,
              error,
            });
          }
        },
      );
      return true;
    });
    logger.info('[***] Downloaded counts by course', {
      downloadedByCourse: [...downloadedByCourse.values()],
    });
  }

  private static async isCached(
    lessonId: string,
    version: number | null,
  ): Promise<boolean> {
    try {
      await Filesystem.readFile({
        path: `${lessonId}/config.json`,
        directory: Directory.External,
      });
      return (
        (await Util.getLocalLessonVersion(lessonId)) >= Number(version ?? 1)
      );
    } catch {
      return false;
    }
  }
}
