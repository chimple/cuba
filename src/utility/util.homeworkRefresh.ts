import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { unzip } from 'zip2';
import { HOMEWORK_PATHWAY, LIDO_COMMON_AUDIO_DIR } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { runBackgroundWorkerTask } from '../workers/backgroundWorkerClient';
import logger from './logger';
import { UtilPathwayRewards } from './util.pathwayRewards';

type CreateFilesystem = typeof import('capacitor-fs').default;
let createFilesystemPromise: Promise<CreateFilesystem> | null = null;

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
export class UtilHomeworkRefresh extends UtilPathwayRewards {
  static [key: string]: any;

  public static async refreshHomeworkPathWithLatestAfterIndex(
    completedIndex: number,
  ) {
    try {
      const api = ServiceConfig.getI().apiHandler;
      const storedPath = localStorage.getItem(HOMEWORK_PATHWAY);
      if (!storedPath) return;

      const path = JSON.parse(storedPath);
      const originalLessons = path.lessons ?? [];
      if (completedIndex >= originalLessons.length) return;

      // 1. Maintain visual consistency: Keep the path length the same
      const originalLength = originalLessons.length;

      // 2. Identify the Subject of the current path
      const currentSubjectId =
        originalLessons[0]?.lesson?.subjectid || originalLessons[0]?.course_id;

      const student = this.getCurrentStudent();
      const currClass = this.getCurrentClass();
      if (!student?.id || !currClass?.id || !currentSubjectId) return;

      // 3. Fetch Pending from DB
      const all = await api.getPendingAssignments(currClass.id, student.id);

      // 4. Filter strictly by current subject
      const eligibleFromDB = all.filter((a: any) => {
        const isSameSubject =
          String(a.course_id || a.subject_id) === String(currentSubjectId);
        return a.type !== 'LIVEQUIZ' && isSameSubject;
      });

      // 5. Preserve Played History: Node 2 (A) stays exactly where it is
      const history = originalLessons.slice(0, completedIndex + 1);
      const playedAssignmentIds = new Set(
        history.map((l: any) => l.assignment_id),
      );

      //6. Sort new ones: LIFO batches, FIFO inside batch (using your getTs helper)
      const getTs = (a: any) => {
        const v =
          a.assigned_at ?? a.created_at ?? a.createdAt ?? a.timestamp ?? null;
        const t = v ? new Date(v).getTime() : 0;
        return isNaN(t) ? 0 : t;
      };

      // 7. Get Future candidates and sort LIFO (Newest first)
      const candidates = eligibleFromDB.filter(
        (a: any) => !playedAssignmentIds.has(a.id),
      );
      candidates.sort((a, b) => getTs(b) - getTs(a));

      // 8. Calculate slots remaining for the "Future" part of the path
      const remainingSlotsCount = originalLength - history.length;
      if (remainingSlotsCount <= 0) return;

      // Take only the number of assignments needed to fill original slots
      const assignmentsToInject = candidates.slice(0, remainingSlotsCount);

      // 9. Fetch Full Lesson Details
      const newLessons = await Promise.all(
        assignmentsToInject.map(async (assignment: any) => {
          if (!assignment.lesson_id) {
            return null;
          }
          const fullLesson = await api.getLesson(assignment.lesson_id);
          if (!fullLesson?.id) {
            logger.warn(
              '[HomeworkPathway] Skipping stale assignment while refreshing homework tail',
              {
                assignmentId: assignment.id ?? null,
                lessonId: assignment.lesson_id ?? null,
              },
            );
            return null;
          }
          return {
            assignment_id: assignment.id,
            lesson_id: assignment.lesson_id,
            chapter_id: assignment.chapter_id,
            course_id: assignment.course_id,
            lesson: fullLesson,
            raw_assignment: assignment,
          };
        }),
      );
      const playableNewLessons = newLessons.filter(
        (lesson): lesson is NonNullable<(typeof newLessons)[number]> =>
          lesson !== null,
      );

      // 10. REBUILD while preserving original path length.
      // If DB doesn't return enough replacements, keep existing future lessons
      // so UI index progression does not collapse back to 0.
      type LessonWithAssignmentId = { assignment_id?: string | null };
      const existingFutureLessons = originalLessons.slice(completedIndex + 1);
      const usedAssignmentIds = new Set<string>(
        [...history, ...playableNewLessons]
          .map((l) => (l as LessonWithAssignmentId)?.assignment_id)
          .filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
      );
      const fallbackFutureLessons = existingFutureLessons.filter(
        (lesson: unknown) => {
          const typedLesson = lesson as LessonWithAssignmentId;
          const assignmentId = typedLesson.assignment_id;
          return !assignmentId || !usedAssignmentIds.has(assignmentId);
        },
      );

      const filledFutureLessons = [...playableNewLessons];
      if (filledFutureLessons.length < remainingSlotsCount) {
        const missingCount = remainingSlotsCount - filledFutureLessons.length;
        filledFutureLessons.push(
          ...fallbackFutureLessons.slice(0, missingCount),
        );
      }

      const updatedLessons = [
        ...history,
        ...filledFutureLessons.slice(0, remainingSlotsCount),
      ];

      localStorage.setItem(
        HOMEWORK_PATHWAY,
        JSON.stringify({
          ...path,
          lessons: updatedLessons,
        }),
      );
    } catch (error) {
      logger.error('Failed to refresh homework path with latest:', error);
    }
  }

  public static pickFiveHomeworkLessons(
    assignments: any[],
    completedCountBySubject: { [key: string]: number } = {},
  ): any[] {
    // Helper: timestamp (oldest = smaller)
    const getTs = (a: any) => {
      const v =
        a.assigned_at ?? a.created_at ?? a.createdAt ?? a.timestamp ?? null;
      const t = v ? new Date(v).getTime() : 0;
      return isNaN(t) ? 0 : t;
    };

    // 1) Only pending
    const pending = assignments.filter((a) => !a.completed);
    if (!pending.length) return [];

    // 2) Global FIFO sort (oldest first). This guarantees FIFO within buckets.
    const pendingSorted = [...pending].sort((a, b) => getTs(b) - getTs(a));

    // 3) Group by subject, maintaining FIFO order inside manual & other buckets
    const bySubject: {
      [sid: string]: {
        manual: any[];
        other: any[];
        total: number;
        manualCount: number;
      };
    } = {};

    for (const a of pendingSorted) {
      const sid = a.subject_id;
      if (!sid) continue;
      if (!bySubject[sid])
        bySubject[sid] = { manual: [], other: [], total: 0, manualCount: 0 };
      if (a.source === 'manual') {
        bySubject[sid].manual.push(a);
        bySubject[sid].manualCount++;
      } else {
        bySubject[sid].other.push(a);
      }
      bySubject[sid].total++;
    }

    const subjectIds = Object.keys(bySubject);
    if (subjectIds.length === 0) return [];

    // NOTE: Removed mixed-case return for totalPendingAll <= 5.
    // We will ALWAYS pick one subject only (manual priority + tie-breaks) and
    // return up to 5 assignments from that subject only.

    // 4) Choose single subject according to your rules:
    //    a) highest manualCount (manual priority)
    //    b) tie -> higher total pending
    //    c) tie -> smaller completedCountBySubject (played less)
    //    d) final deterministic fallback: subject id (string compare)
    let bestSubject: string | null = null;
    let bestManual = -1;
    let bestTotal = -1;
    let bestCompleted = Number.MAX_SAFE_INTEGER;

    for (const sid of subjectIds) {
      const { manualCount, total } = bySubject[sid];
      const completed = completedCountBySubject[sid] ?? 0;

      if (manualCount > bestManual) {
        bestSubject = sid;
        bestManual = manualCount;
        bestTotal = total;
        bestCompleted = completed;
      } else if (manualCount === bestManual) {
        if (total > bestTotal) {
          bestSubject = sid;
          bestTotal = total;
          bestCompleted = completed;
        } else if (total === bestTotal) {
          if (completed < bestCompleted) {
            bestSubject = sid;
            bestCompleted = completed;
          } else if (completed === bestCompleted) {
            if (bestSubject === null || String(sid) < String(bestSubject)) {
              bestSubject = sid;
            }
          }
        }
      }
    }

    if (!bestSubject) return [];

    // 5) Take up to 5 from chosen subject ONLY:
    //    - manual FIFO first, then other FIFO (both already FIFO due to earlier sort)
    const result: any[] = [];
    const manualBucket = bySubject[bestSubject].manual || [];
    const otherBucket = bySubject[bestSubject].other || [];

    for (const a of manualBucket) {
      if (result.length >= 5) break;
      result.push(a);
    }
    for (const a of otherBucket) {
      if (result.length >= 5) break;
      result.push(a);
    }

    return result.slice(0, 5);
  }

  public static async downloadLidoCommonAudio(
    audioZipUrl: string,
    languageId: string,
  ): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return true;
      }

      const langSpecificDir = `${LIDO_COMMON_AUDIO_DIR}/${languageId}`;

      try {
        // Check if directory exists
        await Filesystem.stat({
          path: langSpecificDir,
          directory: Directory.Data,
        });
        // If stat doesn't throw, directory exists.
        return true;
      } catch (e) {
        // Directory does not exist, proceed to download.
      }
      const createFilesystem = await getCreateFilesystem();
      const fs = createFilesystem(Filesystem, {
        rootDir: '/',
        directory: Directory.Data,
      });

      // 🔽 Download ZIP
      const download = await CapacitorHttp.get({
        url: audioZipUrl,
        responseType: 'blob',
        readTimeout: 15000,
        connectTimeout: 15000,
      });

      if (!download || download.status !== 200 || !download.data) {
        logger.error('[LidoCommonAudio] ZIP download failed');
        return false;
      }

      const zipDataStr =
        typeof download.data === 'string'
          ? download.data
          : await this.blobToString(download.data as Blob);

      let buffer: Uint8Array;
      try {
        const prepared = await runBackgroundWorkerTask(
          'PREPARE_BINARY_FROM_BASE64',
          {
            base64: zipDataStr,
            algorithm: 'SHA-256',
          },
        );
        buffer = new Uint8Array(prepared.arrayBuffer);
      } catch (workerError) {
        logger.warn(
          '[LidoCommonAudio] Worker decode failed, falling back to main thread decode.',
          workerError,
        );
        buffer = Uint8Array.from(atob(zipDataStr), (c) => c.charCodeAt(0));
      }

      // 📦 Unzip to /Lido-CommonAudios/{languageId}
      await unzip({
        fs,
        extractTo: langSpecificDir,
        filepaths: ['.'],
        data: buffer,
      });

      return true;
    } catch (err) {
      logger.error(
        '[LidoCommonAudio] Unexpected error while downloading audio:',
        err,
      );
      return false;
    }
  }
}
