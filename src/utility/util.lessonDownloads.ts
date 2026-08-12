import { Capacitor } from '@capacitor/core';
import {
  CURRENT_STUDENT,
  TableTypes,
  PortPlugin,
  SOUND,
  MUSIC,
  DOWNLOADED_LESSON_ID,
  GAME_URL,
  LOCAL_BUNDLES_PATH,
} from '../common/constants';
import { Chapter as curriculamInterfaceChapter } from '../interface/curriculumInterfaces';
import { GUIDRef } from '../interface/modelInterfaces';
import { ServiceConfig } from '../services/ServiceConfig';
import { REMOTE_CONFIG_KEYS } from '../services/RemoteConfig';
import logger from './logger';

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

export class UtilLessonDownloads {
  static [key: string]: any;
  public static port: PortPlugin;

  static TIME_LIMIT = 25 * 60;

  static LAST_MODAL_SHOWN_KEY = 'lastModalShown';

  protected static lessonBundleDownloadQueue: Promise<void> = Promise.resolve();
  // Normalize GrowthBook attributes that may come as a scalar or array into a consistent array.

  public static normalizeGrowthbookArrayAttribute<T>(
    value: T | T[] | null | undefined,
  ): T[] {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }

  public static async getNextLessonFromGivenChapter(
    chapters: curriculamInterfaceChapter[],
    currentChapterId: string,
    currentLessonId: string,
    ChapterDetail: curriculamInterfaceChapter | undefined,
  ): Promise<TableTypes<'lesson'> | undefined> {
    const api = ServiceConfig.getI().apiHandler;
    const currentChapter = ChapterDetail;
    const currentStudentDocId: string = this.getCurrentStudent()?.id || '';

    if (!currentChapter) return undefined;
    let currentLessonIndex = -1;

    const cChapter = await api.getLessonsForChapter(currentChapter.id);

    for (let i = 0; i < cChapter.length - 1; i++) {
      const currentLesson = cChapter[i];
      if (currentLesson.id === currentLessonId) {
        currentLessonIndex = i;
        break;
      }
    }

    if (
      currentLessonIndex >= 0 &&
      currentLessonIndex < currentChapter.lessons.length - 1
    ) {
      let nextLesson = currentChapter.lessons[currentLessonIndex + 1];
      let lessonId = nextLesson.id;
      let studentResult:
        | { [lessonDocId: string]: TableTypes<'result'> }
        | undefined = {};
      const studentProfile =
        await api.getStudentResultInMap(currentStudentDocId);
      studentResult = studentProfile;

      if (!studentResult) return undefined;
      while (studentResult && studentResult[lessonId]) {
        currentLessonIndex += 1;
        nextLesson = currentChapter.lessons[currentLessonIndex + 1];
        if (!nextLesson) break;
        lessonId = nextLesson.id;
      }
      if (nextLesson) {
        const lessonObj = (await api.getLesson(
          nextLesson.id,
        )) as TableTypes<'lesson'>;
        if (lessonObj) {
          return lessonObj;
        }
      }
    }

    const nextChapterIndex =
      chapters.findIndex((chapter: curriculamInterfaceChapter) => {
        return chapter.id === currentChapterId;
      }) + 1;
    if (nextChapterIndex < chapters.length) {
      return undefined;
    }
  }

  public static handleAppStateChange = (state: any) => {
    if (state.isActive && Capacitor.isNativePlatform()) {
      const currentTime = Date.now();
      const startTime = Number(localStorage.getItem('startTime') || '0');
      const timeElapsed = (currentTime - startTime) / 1000; // in seconds
      if (timeElapsed >= this.TIME_LIMIT) {
        const today = new Date().toISOString().split('T')[0];

        if ('2024-11-05' !== today) {
          const showModalEvent = new CustomEvent('shouldShowModal', {
            detail: true,
          });
          document.dispatchEvent(showModalEvent);

          window.dispatchEvent(showModalEvent);
          localStorage.setItem(this.LAST_MODAL_SHOWN_KEY, today);

          return;
        }
      }
    }
    const showModalEvent = new CustomEvent('shouldShowModal', {
      detail: false,
    });
    window.dispatchEvent(showModalEvent);
  };

  public static checkLessonPresentInCourse(
    course: TableTypes<'course'>,
    lessonDoc: String,
  ): boolean {
    return false;
  }

  public static getCurrentStudent(): TableTypes<'user'> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentStudent) return api.currentStudent;
    const temp = localStorage.getItem(CURRENT_STUDENT);

    if (!temp) return;
    const currentStudent = JSON.parse(temp) as TableTypes<'user'>;
    api.currentStudent = currentStudent;
    return currentStudent;
  }

  public static getCurrentSound(): number {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (!!currUser?.sfx_off) return currUser.sfx_off ? 1 : 0;
    const currSound = localStorage.getItem(SOUND);
    if (!currSound) return 0;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateSoundFlag(
        currUser.id,
        currSound === '0' ? false : true,
      );
    }
    return currSound === '0' ? 0 : 1;
  }

  public static setCurrentSound = async (currSound: number) => {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateSoundFlag(
        currUser.id,
        currSound === 1,
      );
    }
    localStorage.setItem(SOUND, currSound.toString());
  };

  public static getCurrentMusic(): number {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (!!currUser?.music_off) return currUser?.music_off ? 1 : 0;
    const currMusic = localStorage.getItem(MUSIC);
    if (!currMusic) return 0;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateMusicFlag(
        currUser.id,
        currMusic === '0' ? false : true,
      );
    }
    return currMusic === '0' ? 0 : 1;
  }

  public static setCurrentMusic = async (currMusic: number) => {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateMusicFlag(
        currUser.id,
        currMusic === 1,
      );
    }
    localStorage.setItem(MUSIC, currMusic.toString());
  };

  public static getGUIDRef(map: any): GUIDRef {
    return { href: map?.href, sourcedId: map?.sourcedId, type: map?.type };
  }

  public static storeLessonIdToLocalStorage = (
    id: string | string[],
    lessonIdStorageKey: string,
  ) => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonIdStorageKey) || '[]',
    );

    const updatedItems = [
      ...(Array.isArray(storedItems) ? storedItems : []),
      ...(Array.isArray(id) ? id : [id]),
    ];

    // Set the values outside the conditional statements
    localStorage.setItem(lessonIdStorageKey, JSON.stringify(updatedItems));
  };

  public static getStoredLessonIds = () => {
    const storedItems = JSON.parse(
      localStorage.getItem(DOWNLOADED_LESSON_ID) || JSON.stringify([]),
    );

    return storedItems;
  };

  public static removeLessonIdFromLocalStorage = (
    id: string | string[],
    lessonIdStorageKey: string,
  ): void => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonIdStorageKey) || '[]',
    );

    let idsToRemove: string[];

    if (Array.isArray(id)) {
      idsToRemove = id;
    } else {
      idsToRemove = [id];
    }

    const updatedItems = Array.isArray(storedItems)
      ? storedItems.filter((itemId: string) => !idsToRemove.includes(itemId))
      : [];

    localStorage.setItem(lessonIdStorageKey, JSON.stringify(updatedItems));
  };

  public static async getLessonPath({
    lessonId,
  }: {
    lessonId: string;
  }): Promise<string | null> {
    const gameUrl = localStorage.getItem(GAME_URL);

    const exists = async (path: string) => {
      try {
        const res = await fetch(path);
        return res.ok;
      } catch {
        return false;
      }
    };
    if (gameUrl?.startsWith(LOCAL_BUNDLES_PATH)) {
      const path = `/assets/lessonBundles/${lessonId}/index.xml`;
      if (await exists(path)) return `/assets/lessonBundles/${lessonId}/`;
    }

    if (await exists(`/assets/lessonBundles/${lessonId}/index.xml`)) {
      return `/assets/lessonBundles/${lessonId}/`;
    }

    const androidBase = await this.getAndroidBundlePath();
    if (androidBase && (await exists(`${androidBase}${lessonId}/index.xml`))) {
      return `${androidBase}${lessonId}/`;
    }

    logger.error('Lesson bundle not found :', lessonId);
    return null;
  }

  public static getLessonBundleId(
    lesson?: Partial<
      Pick<TableTypes<'lesson'>, 'cocos_lesson_id' | 'lido_lesson_id'>
    >,
  ): string | null {
    return lesson?.lido_lesson_id ?? lesson?.cocos_lesson_id ?? null;
  }

  public static async downloadZipBundle(
    lessons: TableTypes<'lesson'>[],
    chapterId?: string,
    bundleZipUrlsKey: REMOTE_CONFIG_KEYS = REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS,
  ): Promise<boolean> {
    return this.enqueueLessonBundleDownload(() =>
      this.runDownloadZipBundle(lessons, chapterId, bundleZipUrlsKey),
    );
  }

  protected static async enqueueLessonBundleDownload(
    downloadTask: () => Promise<boolean>,
  ): Promise<boolean> {
    const previousDownload = this.lessonBundleDownloadQueue;
    let releaseQueue: () => void = () => {};

    this.lessonBundleDownloadQueue = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });

    try {
      await previousDownload.catch(() => undefined);
      return await downloadTask();
    } finally {
      releaseQueue();
    }
  }
}
