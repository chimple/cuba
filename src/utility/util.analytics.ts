import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  DOWNLOADED_LESSON_ID,
  DOWNLOADED_LESSONS_SIZE,
} from '../common/constants';
import logger from './logger';
import { UtilRemoteAssets } from './util.remoteAssets';

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
export class UtilAnalytics extends UtilRemoteAssets {
  static [key: string]: any;
  public static async deleteDownloadedLesson(
    lessonIds: string[],
  ): Promise<boolean> {
    try {
      const lessonData = JSON.parse(
        localStorage.getItem(DOWNLOADED_LESSONS_SIZE) || '{}',
      );
      for (const lessonId of lessonIds) {
        const lessonPath = `${lessonId}`;
        await Filesystem.rmdir({
          path: lessonPath,
          directory: Directory.External,
          recursive: true,
        });

        // Remove the lesson and size from the single object in localStorage
        delete lessonData[lessonId];
        localStorage.setItem(
          DOWNLOADED_LESSONS_SIZE,
          JSON.stringify(lessonData),
        );

        this.removeLessonIdFromLocalStorage(lessonId, DOWNLOADED_LESSON_ID);
      }
    } catch (error) {
      logger.error('Error deleting lesson:', error);
    }
    return false;
  }

  public static async deleteAllDownloadedLessons(): Promise<boolean> {
    try {
      // Retrieve all lesson data stored in localStorage
      JSON.parse(localStorage.getItem(DOWNLOADED_LESSONS_SIZE) || '{}');

      await Filesystem.rmdir({
        path: '/',
        directory: Directory.External,
        recursive: true,
      });

      // Clear the lessons data from localStorage
      localStorage.removeItem(DOWNLOADED_LESSONS_SIZE);
      localStorage.removeItem(DOWNLOADED_LESSON_ID);
      return true;
    } catch (error) {
      logger.error('Error deleting all lessons:', error);
      return false;
    }
  }
}
