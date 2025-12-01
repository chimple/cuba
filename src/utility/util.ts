import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Toast } from "@capacitor/toast";
import createFilesystem from "capacitor-fs";
import { unzip } from "zip2";
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
  // APP_LANG,
  CONTINUE,
  DOWNLOADED_LESSON_ID,
  LAST_FUNCTION_CALL,
  LeaderboardRewardsType,
  LEADERBOARD_REWARD_LIST,
  // APP_LANG,
  LeaderboardRewards,
  unlockedRewardsInfo,
  DOWNLOAD_LESSON_BATCH_SIZE,
  MAX_DOWNLOAD_LESSON_ATTEMPTS,
  LESSON_DOWNLOAD_SUCCESS_EVENT,
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  CHAPTER_ID_LESSON_ID_MAP,
  DOWNLOADING_CHAPTER_ID,
  TABLES,
  REFRESH_TOKEN,
  SCHOOL,
  USER_ROLE,
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
  IS_OPS_USER,
  CHIMPLE_RIVE_STATE_MACHINE_MAX,
  USER_DATA,
  LOCAL_LESSON_BUNDLES_PATH,
  DAILY_USER_REWARD,
  REWARD_LEARNING_PATH,
  HOMEWORK_PATHWAY,
} from "../common/constants";
import {
  Chapter as curriculamInterfaceChapter,
  Course as curriculamInterfaceCourse,
  Lesson as curriculamInterfaceLesson,
} from "../interface/curriculumInterfaces";
import { GUIDRef, RoleType } from "../interface/modelInterfaces";
import { OneRosterApi } from "../services/api/OneRosterApi";
import { APIMode, ServiceConfig } from "../services/ServiceConfig";
import i18n from "../i18n";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
// import {
//   DocumentReference,
//   doc,
//   getFirestore,
//   enableNetwork,
//   disableNetwork,
// } from "firebase/firestore";
import { Keyboard } from "@capacitor/keyboard";
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from "@capawesome/capacitor-app-update";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getFunctions, httpsCallable } from "firebase/functions";
// import { CollectionIds } from "../common/courseConstants";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "../services/RemoteConfig";
import { schoolUtil } from "./schoolUtil";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { URLOpenListenerEvent } from "@capacitor/app";
import { t } from "i18next";
import { FirebaseCrashlytics } from "@capacitor-firebase/crashlytics";
import CryptoJS from "crypto-js";
import { InAppReview } from "@capacitor-community/in-app-review";
declare global {
  interface Window {
    cc: any;
    _CCSettings: any;
  }
}
enum NotificationType {
  REWARD = "reward",
}

export class Util {
  public static port: PortPlugin;
  static TIME_LIMIT = 25 * 60;
  static LAST_MODAL_SHOWN_KEY = "lastModalShown";

  // public static convertCourses(_courses: Course1[]): Course1[] {
  //   let courses: Course1[] = [];
  //   _courses.forEach((course) => {
  //     course.chapters.forEach((chapter) => {
  //       chapter.lessons = this.convertDoc(chapter.lessons);
  //     });

  //     course.curriculum = Util.getRef(course.curriculum);
  //     course.grade = Util.getRef(course.grade);
  //     course.subject = Util.getRef(course.subject);
  //   });
  //   return _courses;
  // }

  public static async getNextLessonFromGivenChapter(
    chapters,
    currentChapterId,
    currentLessonId,
    ChapterDetail
  ) {
    const api = ServiceConfig.getI().apiHandler;
    // let ChapterDetail: Chapter | undefined;
    const currentChapter = ChapterDetail;
    const currentStudentDocId: string = Util.getCurrentStudent()?.id || "";

    if (!currentChapter) return undefined;
    let currentLessonIndex;

    // currentChapter.lessons = Util.convertDoc(currentChapter.lessons);
    const cChapter = await api.getLessonsForChapter(currentChapter);

    for (let i = 0; i < cChapter.length - 1; i++) {
      const currentLesson = cChapter[i];
      if (currentLesson.id === currentLessonId) {
        currentLessonIndex = i;
        break;
      }
    }

    if (currentLessonIndex < currentChapter.lessons.length - 1) {
      let nextLesson = currentChapter.lessons[currentLessonIndex + 1];
      let lessonId = nextLesson.id;
      let studentResult:
        | { [lessonDocId: string]: TableTypes<"result"> }
        | undefined = {};
      const studentProfile = await api.getStudentResultInMap(
        currentStudentDocId
      );
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
          nextLesson.id
        )) as TableTypes<"lesson">;
        if (lessonObj) {
          return lessonObj;
        }
      }
    }

    const nextChapterIndex =
      chapters.findIndex((chapter) => chapter.id === currentChapterId) + 1;
    if (nextChapterIndex < chapters.length) {
      const nextChapter = chapters[nextChapterIndex];
      const firstLessonId = nextChapter.lessons[0];
      // if (firstLessonId instanceof TableTypes<"lesson">) {
      //   return firstLessonId;
      // }
      return undefined;
    }
  }

  public static handleAppStateChange = (state: any) => {
    if (state.isActive && Capacitor.isNativePlatform()) {
      const currentTime = Date.now();
      const startTime = Number(localStorage.getItem("startTime") || "0");
      const timeElapsed = (currentTime - startTime) / 1000; // in seconds
      if (timeElapsed >= Util.TIME_LIMIT) {
        const lastShownDate = localStorage.getItem(Util.LAST_MODAL_SHOWN_KEY);
        const today = new Date().toISOString().split("T")[0];

        if ("2024-11-05" !== today) {
          // if (STAGES.MODE === "parent") {
          const showModalEvent = new CustomEvent("shouldShowModal", {
            detail: true,
          });
          document.dispatchEvent(showModalEvent);
          // const showModalEvent = new CustomEvent("shouldShowModal", { detail: true });
          window.dispatchEvent(showModalEvent);
          localStorage.setItem(Util.LAST_MODAL_SHOWN_KEY, today);
          // }
          return;
        }
      }
    }
    const showModalEvent = new CustomEvent("shouldShowModal", {
      detail: false,
    });
    window.dispatchEvent(showModalEvent);
  };

  // public static convertDoc(refs: any[]): DocumentReference[] {
  //   const data: DocumentReference[] = [];
  //   for (let ref of refs) {
  //     const newCourseRef = Util.getRef(ref);

  //     data.push(newCourseRef);
  //   }
  //   return data;
  // }

  public static checkLessonPresentInCourse(
    course: TableTypes<"course">,
    lessonDoc: String
  ): boolean {
    // if (!course || !course) return false;
    // for (const chapter of course?.chapters) {
    //   for (const lesson of chapter.lessons) {
    //     if (lesson.id === lessonDoc) {
    //       return true;
    //     }
    //   }
    // }
    return false;
  }

  // public static getRef(ref): DocumentReference {
  //   const db = getFirestore();
  //   const newCourseRef = doc(
  //     db,
  //     ref["_key"].path.segments.at(-2),
  //     ref["_key"].path.segments.at(-1)
  //   );
  //   return newCourseRef;
  // }

  public static getCurrentStudent(): TableTypes<"user"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentStudent) return api.currentStudent;
    const temp = localStorage.getItem(CURRENT_STUDENT);

    if (!temp) return;
    const currentStudent = JSON.parse(temp) as TableTypes<"user">;
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
        currSound === "0" ? false : true
      );
    }
    return currSound === "0" ? 0 : 1;
  }
  public static setCurrentSound = async (currSound: number) => {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateSoundFlag(
        currUser.id,
        currSound === 1
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
        currMusic === "0" ? false : true
      );
    }
    return currMusic === "0" ? 0 : 1;
  }
  public static setCurrentMusic = async (currMusic: number) => {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateMusicFlag(
        currUser.id,
        currMusic === 1
      );
    }
    localStorage.setItem(MUSIC, currMusic.toString());
  };
  public static getGUIDRef(map: any): GUIDRef {
    return { href: map?.href, sourcedId: map?.sourcedId, type: map?.type };
  }

  public static storeLessonIdToLocalStorage = (
    id: string | string[],
    lessonIdStorageKey: string
  ) => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonIdStorageKey) || "[]"
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
      localStorage.getItem(DOWNLOADED_LESSON_ID) || JSON.stringify([])
    );

    return storedItems;
  };

  public static removeLessonIdFromLocalStorage = (
    id: string | string[],
    lessonIdStorageKey: string
  ): void => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonIdStorageKey) || "[]"
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
  public static async getLessonPath({ lessonId }): Promise<string | null> {
    const gameUrl = localStorage.getItem("gameUrl");

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

    console.error("Lesson bundle not found :", lessonId);
    return null;
  }

  public static async downloadZipBundle(
    lessonIds: string[],
    chapterId?: string
  ): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return true;
      }

      for (let i = 0; i < lessonIds.length; i += DOWNLOAD_LESSON_BATCH_SIZE) {
        const lessonIdsChunk = lessonIds.slice(
          i,
          i + DOWNLOAD_LESSON_BATCH_SIZE
        );
        const results = await Promise.all(
          lessonIdsChunk.map(async (lessonId) => {
            try {
              let lessonDownloadSuccess = true;
              const fs = createFilesystem(Filesystem, {
                rootDir: "/",
                directory: Directory.External,
              });
              const androidPath = await this.getAndroidBundlePath();
              try {
                const file = await Filesystem.readFile({
                  path: lessonId + "/config.json",
                  directory: Directory.External,
                });
                const decoded =
                  typeof file.data === "string"
                    ? atob(file.data)
                    : await this.blobToString(file.data as Blob);
                this.setGameUrl(androidPath);
                this.storeLessonIdToLocalStorage(
                  lessonId,
                  DOWNLOADED_LESSON_ID
                );
                return true;
              } catch {
                console.error(
                  `[LessonDownloader] Lesson ${lessonId} not found at Android path`
                );
              }
              const localBundlePath =
                LOCAL_LESSON_BUNDLES_PATH + `${lessonId}/config.json`;
              try {
                const response = await fetch(localBundlePath);
                if (response.ok) {
                  this.setGameUrl(LOCAL_BUNDLES_PATH);
                  return true;
                }
              } catch {
                console.error(
                  `[LessonDownloader] Lesson ${lessonId} not found at local bundle path`
                );
              }
              const bundleZipUrls: string[] = await RemoteConfig.getJSON(
                REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS
              );
              if (!bundleZipUrls || bundleZipUrls.length < 1) {
                console.error("[LessonDownloader] No remote ZIP URLs found");
                return false;
              }

              let zip: any;
              let downloadAttempts = 0;

              while (downloadAttempts < MAX_DOWNLOAD_LESSON_ATTEMPTS) {
                for (const bundleUrl of bundleZipUrls) {
                  const zipUrl = bundleUrl + lessonId + ".zip";
                  try {
                    zip = await CapacitorHttp.get({
                      url: zipUrl,
                      responseType: "blob",
                      headers: {},
                    });
                    if (zip && zip.data && zip.status === 200) {
                      break;
                    }
                  } catch (err) {
                    console.error(
                      `[LessonDownloader] Error downloading ${zipUrl}:`,
                      err
                    );
                  }
                }
                downloadAttempts++;
              }

              if (!zip || !zip.data || zip.status !== 200) {
                console.error(
                  `[LessonDownloader] Failed to download lesson ${lessonId}`
                );
                return false;
              }
              const zipDataStr =
                typeof zip.data === "string"
                  ? zip.data
                  : await this.blobToString(zip.data as Blob);
              const buffer = Uint8Array.from(atob(zipDataStr), (c) =>
                c.charCodeAt(0)
              );

              await unzip({
                fs,
                extractTo: lessonId,
                filepaths: ["."],
                filter: (filepath) => !filepath.startsWith("dist/"),
                onProgress: (event) =>
                  console.log(
                    "[LessonDownloader] Unzipping progress:",
                    event.filename,
                    event.loaded,
                    event.total
                  ),
                data: buffer,
              });

              const lessonData = JSON.parse(
                localStorage.getItem("downloaded_lessons_size") || "{}"
              );
              lessonData[lessonId] = { size: buffer.byteLength };
              localStorage.setItem(
                "downloaded_lessons_size",
                JSON.stringify(lessonData)
              );
              this.setGameUrl(androidPath);
              this.storeLessonIdToLocalStorage(lessonId, DOWNLOADED_LESSON_ID);
              window.dispatchEvent(
                new CustomEvent(LESSON_DOWNLOAD_SUCCESS_EVENT, {
                  detail: { lessonId },
                })
              );
              return lessonDownloadSuccess;
            } catch (err) {
              console.error(
                `[LessonDownloader] Error processing lesson ${lessonId}:`,
                err
              );
              return false;
            }
          })
        );

        if (!results.every((r) => r === true)) {
          console.error(
            "[LessonDownloader] Some lessons in chunk failed to download:",
            lessonIdsChunk
          );
          return false;
        }
      }

      window.dispatchEvent(
        new CustomEvent(ALL_LESSON_DOWNLOAD_SUCCESS_EVENT, {
          detail: { chapterId },
        })
      );
      if (chapterId)
        this.removeLessonIdFromLocalStorage(chapterId, DOWNLOADING_CHAPTER_ID);

      return true;
    } catch (err) {
      console.error(
        "[LessonDownloader] Unexpected error in downloadZipBundle:",
        err
      );
      return false;
    }
  }

  public static async blobToString(data: string | Blob): Promise<string> {
    if (typeof data === "string") {
      return data;
    }

    if (data instanceof Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString() ?? "";
          const base64 = result.split(",")[1] || "";
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    }

    throw new Error("Invalid data type — expected string or Blob");
  }

  // In your Util.ts file

  // ✅ Renamed and made generic
  public static async DownloadRemoteAssets(
    zipUrl: string,
    uniqueId: string,
    destinationPath: string, // e.g., 'remoteAsset'
    assetType: string // e.g., 'Learning Path'
  ): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) return true;

      const fs = createFilesystem(Filesystem, {
        rootDir: "",
        directory: Directory.External,
      });
      const androidPath = await this.getAndroidBundlePath();

      // ✅ Use the dynamic destinationPath parameter
      const configPath = `${destinationPath}/config.json`;

      // Logic for reading config.json
      try {
        const res = await fetch(configPath); // ✅ Use dynamic path
        const isExists = res.ok;
        if (isExists) {
          const configFile = await Filesystem.readFile({
            path: configPath, // ✅ Use dynamic path
            directory: Directory.External,
          });

          const base64Data = await this.blobToString(configFile.data);
          const decoded = atob(base64Data);
          const config = JSON.parse(decoded);

          if (config.uniqueId === uniqueId) {
            console.log(`✅ ${assetType} assets are already up to date.`);
            this.setGameUrl(androidPath);
            return true;
          }
        }
      } catch (err) {
        console.warn(
          `Could not read existing config for ${assetType}, proceeding with download.`
        );
      }

      // Download and unzip
      const response = await CapacitorHttp.get({
        url: zipUrl,
        responseType: "blob",
      });

      if (!response?.data || response.status !== 200) return false;
      const buffer = Uint8Array.from(atob(response.data), (c) =>
        c.charCodeAt(0)
      );
      await unzip({
        fs,
        extractTo: "", // The zip file itself should contain the destination folder
        filepaths: ["."],
        filter: (filepath: string) => !filepath.startsWith("dist/"),
        onProgress: (event) => {
          // ✅ Use the dynamic assetType parameter for clearer logging
          console.log(`Unzipping ${assetType} assets:`, event.filename);
        },
        data: buffer,
      });

      // After unzip and extraction
      const configFile = await Filesystem.readFile({
        path: configPath, // ✅ Use dynamic path
        directory: Directory.External,
      });
      const decoded = atob(await this.blobToString(configFile.data));
      const config = JSON.parse(decoded);

      // Important Note: Decide if this logic applies to BOTH asset types
      if (typeof config.riveMax === "number") {
        localStorage.setItem(
          CHIMPLE_RIVE_STATE_MACHINE_MAX,
          config.riveMax.toString()
        );
      }
      this.setGameUrl(androidPath);
      return true;
    } catch (err) {
      console.error(
        `Unexpected error in DownloadRemoteAssets for ${assetType}:`,
        err
      );
      return false;
    }
  }

  public static async deleteDownloadedLesson(
    lessonIds: string[]
  ): Promise<boolean> {
    try {
      const lessonData = JSON.parse(
        localStorage.getItem("downloaded_lessons_size") || "{}"
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
          "downloaded_lessons_size",
          JSON.stringify(lessonData)
        );

        this.removeLessonIdFromLocalStorage(lessonId, DOWNLOADED_LESSON_ID);
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
    return false;
  }

  public static async deleteAllDownloadedLessons(): Promise<boolean> {
    try {
      // Retrieve all lesson data stored in localStorage
      const lessonData = JSON.parse(
        localStorage.getItem("downloaded_lessons_size") || "{}"
      );

      await Filesystem.rmdir({
        path: "/",
        directory: Directory.External,
        recursive: true,
      });

      // Clear the lessons data from localStorage
      localStorage.removeItem("downloaded_lessons_size");
      localStorage.removeItem(DOWNLOADED_LESSON_ID);
      return true;
    } catch (error) {
      console.error("Error deleting all lessons:", error);
      return false;
    }
  }

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
          path: "",
          directory: Directory.External,
        });

        const folderNamesArray: string[] = [];

        for (let i = 0; i < contents.files.length; i++) {
          folderNamesArray.push(contents.files[i].name);
        }
        localStorage.setItem(DOWNLOADED_LESSON_ID, JSON.stringify([]));
        this.storeLessonIdToLocalStorage(
          folderNamesArray,
          DOWNLOADED_LESSON_ID
        );
        lastRendered = new Date().getTime();
        localStorage.setItem(LAST_FUNCTION_CALL, lastRendered.toString());
      } catch (error) {
        console.error("Error listing folders:", error);
        return null;
      }

    return lastRendered;
  }

  public static async isChapterDownloaded(chapterId: string): Promise<boolean> {
    const chapterLessonIdMap = JSON.parse(
      localStorage.getItem(CHAPTER_ID_LESSON_ID_MAP) || "{}"
    );
    const downloadedLessonIds = JSON.parse(
      localStorage.getItem(DOWNLOADED_LESSON_ID) || "[]"
    );
    let lessonIdsForChapter = chapterLessonIdMap[chapterId];
    if (!lessonIdsForChapter) {
      const api = ServiceConfig.getI().apiHandler;
      const storedLessonDoc = await api.getLessonsForChapter(chapterId);
      lessonIdsForChapter = storedLessonDoc.map((id) => id.cocos_lesson_id);
      chapterLessonIdMap[chapterId] = lessonIdsForChapter;
      localStorage.setItem(
        CHAPTER_ID_LESSON_ID_MAP,
        JSON.stringify(chapterLessonIdMap)
      );
    }
    const allLessonIdsDownloaded = lessonIdsForChapter.every(
      (lessonId: string) => downloadedLessonIds.includes(lessonId)
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

  public static async launchCocosGame(): Promise<void> {
    try {
      if (!window.cc) {
        return;
      }
      const settings = window._CCSettings;
      const launchScene = settings.launchScene;
      const bundle = window.cc.assetManager.bundles.find(function (b) {
        return b.getSceneInfo(launchScene);
      });

      await new Promise((resolve, reject) => {
        bundle.loadScene(launchScene, null, null, function (err, scene) {
          if (!err) {
            window.cc.director.runSceneImmediate(scene);
            if (window.cc.sys.isBrowser) {
              Util.checkingIfGameCanvasAvailable();
              // show canvas
              var canvas = document.getElementById("GameCanvas");
              if (canvas) {
                canvas.style.visibility = "";
                canvas.style.display = "";
              }
              const container = document.getElementById("Cocos2dGameContainer");
              if (container) {
                container.style.display = "";
                container.style.width = "100%";
                container.style.height = "100%";
              }
              var div = document.getElementById("GameDiv");
              if (div) {
                div.style.backgroundImage = "";
              }
            }
            resolve(scene);
          } else {
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error("launchCocosGame(): error ", error);
    }
  }

  public static killCocosGame(): void {
    if (!window.cc) {
      return;
    }
    window.cc.game.pause();
    window.cc.audioEngine.stopAll();
    const canvas = document.getElementById("GameCanvas");
    if (canvas) {
      canvas.style.visibility = "none";
      canvas.style.display = "none";
    }
    const container = document.getElementById("Cocos2dGameContainer");
    if (container) {
      container.style.display = "none";
      container.style.width = "0px";
      container.style.height = "0px";
      container.style.overflow = "hidden";
    }
  }

  public static async getLastPlayedLessonIndex(
    subjectCode: string,
    lessons: curriculamInterfaceLesson[],
    chapters: curriculamInterfaceChapter[] = [],
    lessonResultMap: { [key: string]: TableTypes<"result"> } = {}
  ): Promise<number> {
    const currentLessonJson = localStorage.getItem(CURRENT_LESSON_LEVEL());
    let currentLessonLevel: any = {};
    if (currentLessonJson) {
      currentLessonLevel = JSON.parse(currentLessonJson);
    }
    const currentLessonId = currentLessonLevel[subjectCode];
    if (currentLessonId) {
      const lessonIndex: number = lessons.findIndex(
        (lesson: any) => lesson.id === currentLessonId
      );
      if (lessonIndex >= 0) return lessonIndex;
    }

    if (subjectCode === COURSES.PUZZLE) {
      // let currentIndex = -1;
      if (Object.keys(lessonResultMap).length <= 0) return 0;
      const currentIndex = Util.getLastPlayedLessonIndexForLessons(
        lessons,
        lessonResultMap
      );
      // for (let i = 0; i < lessons.length; i++) {
      //   if (lessonResultMap[lessons[i].id]) {
      //     currentIndex = i;
      //   }
      // }
      return currentIndex <= 0 ? -1 : currentIndex;
    }
    const apiInstance = OneRosterApi.getInstance();
    const preQuiz = lessonResultMap[subjectCode + "_" + PRE_QUIZ];
    if (!preQuiz) return -1;
    const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
      subjectCode,
      preQuiz.score ?? 0,
      chapters
    );
    // let tempCurrentIndex = 0;
    // for (let i = 0; i < tempLevelChapter.lessons.length; i++) {
    //   if (lessonResultMap[tempLevelChapter.lessons[i].id]) {
    //     tempCurrentIndex = i;
    //   }
    // }
    const tempCurrentIndex = Util.getLastPlayedLessonIndexForLessons(
      tempLevelChapter.lessons,
      lessonResultMap
    );
    let currentIndex: number = lessons.findIndex(
      (lesson: any) =>
        lesson.id === tempLevelChapter.lessons[tempCurrentIndex].id
    );
    // currentIndex--;
    return currentIndex < 0 ? 0 : currentIndex;
  }

  public static getLastPlayedLessonIndexForLessons(
    lessons: curriculamInterfaceLesson[],
    lessonResultMap: { [key: string]: TableTypes<"result"> } = {}
  ): number {
    let tempCurrentIndex = 0;
    for (let i = 0; i < lessons.length; i++) {
      if (lessonResultMap[lessons[i].id]) {
        tempCurrentIndex = i;
      }
    }
    return tempCurrentIndex;
  }

  public static getCourseByGrade(courseId): string {
    let selectedGrade = localStorage.getItem(SELECTED_GRADE());
    let gradeMap = {};
    if (!selectedGrade) {
      gradeMap = { en: SL_GRADES.GRADE1, maths: SL_GRADES.GRADE1 };
    } else {
      gradeMap = JSON.parse(selectedGrade);
    }

    return courseId;

    // if (courseId === HEADERLIST.ENGLISH) {
    //   return gradeMap[HEADERLIST.ENGLISH] === SL_GRADES.GRADE1
    //     ? COURSES.ENGLISH_G1
    //     : COURSES.ENGLISH_G2;
    // } else if (courseId === HEADERLIST.MATHS) {
    //   return gradeMap[HEADERLIST.MATHS] === SL_GRADES.GRADE1
    //     ? COURSES.MATHS_G1
    //     : COURSES.MATHS_G2;
    // } else {
    //   return courseId;
    // }
  }

  public static async showLog(msg): Promise<void> {
    if (Capacitor.getPlatform() !== "android") return;
    if (typeof msg !== "string") {
      msg = JSON.stringify(msg);
    }
    await Toast.show({
      text: msg,
      duration: "long",
    });
  }

  public static async logEvent(
    eventName: EVENTS,
    params: {
      [key: string]: any;
    }
  ) {
    try {
      const normalizedParams: { [key: string]: string } = Object.fromEntries(
        Object.entries(params).map(([key, value]) => [
          key,
          typeof value === "number" ? value.toString() : String(value),
        ])
      );
      //Setting User Id in User Properites
      await FirebaseAnalytics.setUserId({
        userId: params.user_id,
      });
      if (!Util.port) Util.port = registerPlugin<PortPlugin>("Port");
      Util.port.shareUserId({ userId: params.user_id });
      await FirebaseCrashlytics.setUserId({
        userId: params.user_id,
      });

      await FirebaseAnalytics.setScreenName({
        screenName: window.location.pathname,
        nameOverride: window.location.pathname,
      });

      await FirebaseAnalytics.logEvent({
        name: eventName,
        params: params,
      });
    } catch (error) {
      console.error(
        "Error logging event to firebase analytics ",
        eventName,
        ":",
        error
      );
    }
  }
  public static async setUserProperties(currentUser: TableTypes<"user">) {
    try {
      await FirebaseAnalytics.setUserProperty({
        name: "parent user_id",
        value: currentUser.id,
      });
      await FirebaseAnalytics.setUserProperty({
        name: "name",
        value: currentUser.name ?? "",
      });
      await FirebaseAnalytics.setUserProperty({
        name: "age",
        value: currentUser.age?.toLocaleString() || "",
      });
      await FirebaseAnalytics.setUserProperty({
        name: "gender",
        value: currentUser.gender?.toLocaleString() || "",
      });
      // await FirebaseAnalytics.setUserProperty({
      //   name: "user_type",
      //   value: currentUser.role,
      // });
      // await FirebaseAnalytics.setUserProperty({
      //   name: "username",
      //   value: currentUser.username,
      // });
    } catch (error) {
      console.error("Set User Properties Error ", error);
    }
  }

  public static async logCurrentPageEvents(user: TableTypes<"user">) {
    //Setting User Id in User Properites
    await FirebaseAnalytics.setUserId({
      userId: user.id,
    });

    await Util.setUserProperties(user);

    //Setting Screen Name
    await FirebaseAnalytics.setScreenName({
      screenName: window.location.pathname,
      nameOverride: window.location.pathname,
    });
  }

  public static onAppStateChange = ({ isActive }) => {
    // Existing logic for stopping TextToSpeech when app is inactive
    if (!isActive) {
      TextToSpeech.stop();
    }

    // Handling app state changes (reloading pages, updating URLs, etc.)
    const url = new URL(window.location.toString());
    const urlParams = new URLSearchParams(window.location.search);
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
        url.searchParams.get(CONTINUE) === "true" &&
        url.pathname !== PAGES.GAME &&
        url.pathname !== PAGES.LOGIN &&
        url.pathname !== PAGES.EDIT_STUDENT
      ) {
        if (
          url.pathname === PAGES.DISPLAY_SUBJECTS ||
          url.pathname === PAGES.DISPLAY_CHAPTERS
        ) {
          url.searchParams.set("isReload", "true");
        }
        url.searchParams.delete(CONTINUE);
        window.history.replaceState(window.history.state, "", url.toString());
        window.location.reload();
      } else {
        url.searchParams.set("isReload", "true");
        url.searchParams.delete(CONTINUE);
        window.history.replaceState(window.history.state, "", url.toString());
        Util.checkingIfGameCanvasAvailable();
      }
    }
    // Util.handleAppStateChange(isActive);
  };

  public static checkingIfGameCanvasAvailable = async (): Promise<boolean> => {
    try {
      const canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;

      if (canvas) {
        const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;

        if (!gl) {
          console.error("WebGL is not supported on this device or browser.");
          return false;
        }

        // Helper function to create and validate shaders
        const createAndValidateShader = (
          type: GLenum,
          source: string
        ): WebGLShader | null => {
          const shader = gl.createShader(type);
          if (!shader) {
            console.error("Failed to create shader.");
            return null;
          }
          gl.shaderSource(shader, source);
          gl.compileShader(shader);

          // Check for shader compilation errors
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
              `Error compiling shader: ${gl.getShaderInfoLog(shader)}`
            );
            gl.deleteShader(shader);
            return null;
          }

          return shader;
        };

        // Example vertex and fragment shader source code
        const vertexShaderSource = `
          attribute vec4 position;
          void main() {
            gl_Position = position;
          }
        `;

        const fragmentShaderSource = `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
          }
        `;

        // Create and validate shaders
        const vertexShader = createAndValidateShader(
          gl.VERTEX_SHADER,
          vertexShaderSource
        );
        const fragmentShader = createAndValidateShader(
          gl.FRAGMENT_SHADER,
          fragmentShaderSource
        );

        if (!vertexShader || !fragmentShader) {
          console.error("Shader creation or validation failed.");
          return false;
        }

        // Handle WebGL context lost
        canvas.addEventListener(
          "webglcontextlost",
          (event) => {
            try {
              console.error("WebGL context lost detected.");
              event.preventDefault(); // Prevent the browser from handling context loss
              const webglContext = canvas.getContext(
                "webgl"
              ) as WebGLRenderingContext | null;

              if (webglContext) {
                const rest = webglContext.getExtension("WEBGL_lose_context");

                // If the context cannot be restored, reload the page
                if (!rest) {
                  console.error(
                    "Unable to restore WebGL context. Reloading page..."
                  );
                  window.location.reload();
                }
              }
            } catch (error) {
              console.error("Error handling webglcontextlost:", error);
            }
          },
          false
        );

        // Handle WebGL context restored
        canvas.addEventListener(
          "webglcontextrestored",
          (event) => {
            try {
              event.preventDefault(); // Prevent the browser from restoring automatically
              const webglContext = canvas.getContext(
                "webgl"
              ) as WebGLRenderingContext | null;

              if (webglContext) {
              }
            } catch (error) {
              console.error("Error handling webglcontextrestored:", error);
            }
          },
          false
        );

        return true; // Return true if canvas exists and WebGL is initialized
      } else {
        console.warn("GameCanvas element not found.");
        return false;
      }
    } catch (error) {
      console.error("Error in checkingIfGameCanvasAvailable:", error);
      return false;
    }
  };

  public static setPathToBackButton(path: string, history: any) {
    const url = new URLSearchParams(window.location.search);
    if (url.get(CONTINUE)) {
      history.replace(`${path}?${CONTINUE}=true`);
    } else {
      history.replace(path);
    }
  }

  public static switchToOpsUser(history: any): void {
    localStorage.setItem(IS_OPS_USER, "true");
    ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
    schoolUtil.setCurrMode(MODES.OPS_CONSOLE);
    history.replace(PAGES.SIDEBAR_PAGE);
  }

  public static setCurrentStudent = async (
    student: TableTypes<"user"> | null,
    languageCode?: string,
    langFlag: boolean = true,
    isStudent: boolean = true
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentStudent = student !== null ? student : undefined;

    localStorage.setItem(
      CURRENT_STUDENT,
      JSON.stringify(student)
      // JSON.stringify({
      //   age: student?.age ?? null,
      //   avatar: student?.avatar ?? null,
      //   board: student?.board ?? null,
      //   courses: student?.courses,
      //   createdAt: student?.createdAt,
      //   updatedAt: student?.updatedAt,
      //   gender: student?.gender ?? null,
      //   grade: student?.grade ?? null,
      //   image: student?.image ?? null,
      //   language: student?.language ?? null,
      //   name: student?.name,
      //   role: student?.role,
      //   uid: student?.uid,
      //   rewards: student?.rewards,
      //   username: student?.username,
      //   users: student?.users,
      //   docId: student?.id,
      // })
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

    //Setting Student Id in User Properites
    // if (student)
    //   await FirebaseAnalytics.setUserId({
    //     userId: student?.id,
    //   });
    // if (student) await Util.setUserProperties(student);
  };

  public static randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  public static isEmail(username) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(username);
    return isValid;
  }
  public static async subscribeToClassTopic(
    classId: string,
    schoolId: string
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
    currentUser: TableTypes<"user">
  ): Promise<void> {
    // if (!Capacitor.isNativePlatform()) return;
    // const students: DocumentReference[] = currentUser.users;
    // if (!students || students.length < 1) return;
    // const api = ServiceConfig.getI().apiHandler;
    // for (let studentRef of students) {
    //   if (!studentRef.id) continue;
    //   api.getStudentResult(studentRef.id).then((studentProfile) => {
    //     if (
    //       !!studentProfile &&
    //       !!studentProfile.classes &&
    //       studentProfile.classes.length > 0 &&
    //       studentProfile.classes.length === studentProfile.schools.length
    //     ) {
    //       for (let i = 0; i < studentProfile.classes.length; i++) {
    //         const classId = studentProfile.classes[i];
    //         const schoolId = studentProfile.schools[i];
    //         if (!this.isClassTokenSubscribed(classId))
    //           this.subscribeToClassTopic(classId, schoolId);
    //       }
    //     }
    //   });
    // }
  }

  public static isClassTokenSubscribed(classId: string): boolean {
    const subscribedTokens = localStorage.getItem(FCM_TOKENS);
    let tokens = [];
    if (!!subscribedTokens) {
      tokens = JSON.parse(subscribedTokens) ?? [];
    }
    const foundToken = tokens.find((token: string) =>
      token.startsWith(classId)
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

  public static isTextFieldFocus(scollToRef, setIsInputFocus) {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        setIsInputFocus(true);

        setTimeout(() => {
          scollToRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }, 50);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setIsInputFocus(false);
      });
    }
  }

  public static async startFlexibleUpdate(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const canCheckUpdate = Util.canCheckUpdate(LAST_UPDATE_CHECKED);

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
      console.error(
        "🚀 ~ file: util.ts:482 ~ startFlexibleUpdate ~ error:",
        JSON.stringify(error)
      );
    }
  }

  public static notificationsCount = 0;

  public static async notificationListener(
    onNotification: (extraData?: object) => void
  ) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      FirebaseMessaging.addListener(
        "notificationReceived",
        async ({ notification }) => {
          try {
            const res = await LocalNotifications.schedule({
              notifications: [
                {
                  id: Util.notificationsCount++,
                  body: notification.body ?? "",
                  title: notification.title ?? "Chimple",
                  attachments: !!notification.image
                    ? [{ id: notification.image, url: notification.image }]
                    : undefined,
                  extra: notification.data,
                },
              ],
            });
            LocalNotifications.addListener(
              "localNotificationActionPerformed",
              (notification) => {
                const extraData = notification.notification.extra;
                onNotification(extraData);
              }
            );
          } catch (error) {
            console.error(
              "🚀 ~ file: util.ts:630 ~ error:",
              JSON.stringify(error)
            );
          }
        }
      );
      const canCheckPermission = Util.canCheckUpdate(LAST_PERMISSION_CHECKED);
      if (!canCheckPermission) return;
      const result = await FirebaseMessaging.checkPermissions();
      if (result.receive === "granted") return;
      await FirebaseMessaging.requestPermissions();
    } catch (error) {
      console.error(
        "🚀 ~ file: util.ts:514 ~ checkNotificationPermissionsAndType ~ error:",
        JSON.stringify(error)
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
          window.location.replace(PAGES.HOME + "?tab=" + HOMEHEADERLIST.HOME);
        } else {
          await this.setCurrentStudent(null);
          const students = await api.getParentStudentProfiles();
          let matchingUser =
            students.find((user) => user.id === rewardProfileId) || students[0];
          if (matchingUser) {
            await this.setCurrentStudent(matchingUser, undefined, true);
            window.location.replace(PAGES.HOME + "?tab=" + HOMEHEADERLIST.HOME);
          } else {
            return;
          }
        }
    } else if (data && data.notificationType === ASSIGNMENT_TYPE.ASSIGNMENT) {
      sessionStorage.setItem(ASSIGNMENT_POPUP_SHOWN, "false");
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
            window.location.replace(
              PAGES.HOME + "?tab=" + HOMEHEADERLIST.ASSIGNMENT
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
            window.location.replace(
              PAGES.HOME + "?tab=" + HOMEHEADERLIST.ASSIGNMENT
            );
          }
        } else {
          window.location.replace(
            PAGES.HOME + "?tab=" + HOMEHEADERLIST.ASSIGNMENT
          );
          return;
        }
      }
    } else if (data && data.notificationType === ASSIGNMENT_TYPE.LIVEQUIZ) {
      sessionStorage.setItem(QUIZ_POPUP_SHOWN, "false");
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
            window.location.replace(
              data.assignmentId
                ? PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${data.assignmentId}`
                : PAGES.HOME + "?tab=" + HOMEHEADERLIST.LIVEQUIZ
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
            window.location.replace(
              PAGES.HOME + "?tab=" + HOMEHEADERLIST.LIVEQUIZ
            );
          }
        }
      } else {
        window.location.replace(PAGES.HOME + "?tab=" + HOMEHEADERLIST.LIVEQUIZ);
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
    const lessThanOneHourAgo = (date) => {
      const now: any = new Date();
      const ONE_HOUR = 60 * 60 * 1000; /* ms */
      const res = now - date < ONE_HOUR;
      return res;
    };
    const _canCheckUpdate = !lessThanOneHourAgo(lastUpdateChecked);
    if (_canCheckUpdate) {
      localStorage.setItem(updateFor, now.toString());
    }
    return _canCheckUpdate;
  }

  public static listenToNetwork() {
    // try {
    //   const _db = getFirestore();
    //   if (navigator.onLine) {
    //     enableNetwork(_db);
    //   } else {
    //     disableNetwork(_db);
    //   }
    //   window.addEventListener("online", (e) => {
    //     enableNetwork(_db);
    //   });
    //   window.addEventListener("offline", (e) => {
    //     disableNetwork(_db);
    //   });
    // } catch (err) {
    // }
  }

  public static async showInAppReview() {
    try {
      await InAppReview.requestReview();
    } catch (error) {
      console.error(
        "🚀 ~ file: util.ts:694 ~ showInAppReview ~ error:",
        JSON.stringify(error)
      );
    }
  }
  public static async fetchNotificationData() {
    if (!Util.port) Util.port = registerPlugin<PortPlugin>("Port");
    return Util.port.fetchNotificationData();
  }
  public static async migrate() {
    if (
      !Capacitor.isNativePlatform() ||
      !!localStorage.getItem(IS_MIGRATION_CHECKED)
    )
      return { migrated: false };
    const path = await Filesystem.getUri({
      directory: Directory.Data,
      path: "",
    });
    const filePath = path.uri.replace("/files", "/databases/") + "jsb.sqlite";
    const url = Capacitor.convertFileSrc(filePath);
    const res = await fetch(url);
    const isExists = res.ok;
    if (!isExists) return { migrated: false };

    if (!Util.port) {
      Util.port = registerPlugin<PortPlugin>("Port");
    }
    try {
      const port = await Util.port.getMigrateUsers();
      const functions = getFunctions();
      const migrateUsers = httpsCallable(functions, "MigrateUsers");
      const result = await migrateUsers({
        users: port.users,
      });
      const res: any = result.data;
      // if (res.migrated) {
      //   const _db = getFirestore();
      //   const newStudents: DocumentReference[] = res.studentIds.map(
      //     (studentId) => doc(_db, CollectionIds.USER, studentId)
      //   );
      //   await Filesystem.deleteFile({ path: filePath });
      //   localStorage.setItem(IS_MIGRATION_CHECKED, "true");
      //   return { migrated: true, newStudents: newStudents };
      // }
    } catch (error) {
      console.error("🚀 ~ file: util.ts:707 ~ migrate ~ error:", error);
      return { migrated: false };
    }
  }

  public static async getCanShowAvatar(): Promise<boolean> {
    try {
      const currMode = await schoolUtil.getCurrMode();

      if (currMode === MODES.SCHOOL) {
        return true;
      }

      const student = await Util.getCurrentStudent();

      if (!student) {
        console.error("Student is undefined or null");
        return false;
      }

      const api = ServiceConfig.getI().apiHandler;
      const studentResult = await api.getStudentClassesAndSchools(student.id);

      // if (!studentResult || studentResult.classes.length === 0) {
      //   console.error("Student result is undefined or classes array is empty");
      //   return false;
      // }

      if (
        studentResult &&
        studentResult.classes &&
        studentResult.classes.length > 0
      ) {
        return true;
      }

      // if (studentResult.last5Lessons && Object.keys(studentResult.last5Lessons).length > 0) {
      //   return false;
      // }

      // If Remote Config allows showing avatar, return true
      const canShowAvatarValue = false;
      // await RemoteConfig.getBoolean(
      //   REMOTE_CONFIG_KEYS.CAN_SHOW_AVATAR
      // );

      return canShowAvatarValue;
    } catch (error) {
      console.error("Error in getCanShowAvatar:", error);
      return false;
    }
  }
  public static async migrateLocalJsonFile(
    newFileURL: string,
    oldFilePath: string,
    newFilePathLocation: string,
    localStorageNameForFilePath: string
  ) {
    try {
      // if (!Capacitor.isNativePlatform()) {
      //   return;
      // }

      if (!newFileURL) {
        return;
      }

      let newFileResponse = await fetch(newFileURL);

      let newFileJson = await newFileResponse.json();

      let oldFileResponse = await fetch(oldFilePath);

      let oldFileJson = await oldFileResponse.json();

      if (oldFileJson.version >= newFileJson.version) {
        return;
      }

      let res = await Filesystem.writeFile({
        path: newFilePathLocation,
        directory: Directory.Data,
        data: JSON.stringify(newFileJson),
        encoding: Encoding.UTF8,
        recursive: true,
      });
      localStorage.setItem(
        localStorageNameForFilePath,
        res.uri
        // res.uri.slice(1, res.uri.length)
      );
    } catch (error) {
      console.error("Json File Migration failed ", error);

      throw error;
    }
  }

  public static async getNextUnlockStickers(): Promise<
    TableTypes<"sticker">[]
  > {
    const date = new Date();
    const api = ServiceConfig.getI().apiHandler;
    const rewardsDoc = await api.getRewardsById(
      date.getFullYear(),
      "weeklySticker"
    );
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    weeklyData?.[currentWeek.toString()]?.forEach((value) => {
      if (value.type === LeaderboardRewardsType.STICKER) {
        stickerIds.push(value.id);
      }
    });

    const stickerDocs = await api.getStickersByIds(stickerIds);
    return stickerDocs;
  }

  public static getCurrentWeekNumber(): number {
    const date: Date = new Date();
    const startOfYear: Date = new Date(date.getFullYear(), 0, 1);
    const dayOfYear: number =
      Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const firstDayOfWeek: number = startOfYear.getDay() || 7;
    const weekNumber: number = Math.ceil((dayOfYear + firstDayOfWeek - 1) / 7);
    return weekNumber;
  }

  public static getCurrentMonthForLeaderboard() {
    const date = new Date();
    if (date.getDate() < 3) {
      date.setMonth(date.getMonth() - 1);
    }
    return date.getMonth() + 1;
  }
  public static getCurrentYearForLeaderboard() {
    const date = new Date();
    if (date.getDate() < 3) {
      date.setMonth(date.getMonth() - 1);
    }
    return date.getFullYear();
  }

  public static async getStudentFromServer() {
    const api = ServiceConfig.getI().apiHandler;
    let currentStudent = await Util.getCurrentStudent();
    if (!currentStudent) return;
    const updatedStudent = await api.getUserByDocId(currentStudent.id);
    if (updatedStudent) {
      await Util.setCurrentStudent(updatedStudent);
    }
  }

  public static async unlockWeeklySticker() {
    try {
      let currentUser = Util.getCurrentStudent();
      if (!currentUser) return false;
      const api = ServiceConfig.getI().apiHandler;
      const date = new Date();
      const rewardsDoc = await api.getRewardsById(
        date.getFullYear(),
        "weeklySticker"
      );
      if (!rewardsDoc) return false;
      const currentWeek = Util.getCurrentWeekNumber();
      const weeklyData = rewardsDoc.weeklySticker;
      let currentReward;

      weeklyData?.[currentWeek.toString()].forEach(async (value) => {
        currentReward = value;
      });
      // if (!currentUser.rewards) {
      //   let leaderboardReward: LeaderboardRewards = {
      //     badges: [],
      //     bonus: [],
      //     sticker: [],
      //   };
      //   currentUser.rewards = leaderboardReward;
      // }
      // if (!currentUser.rewards.sticker) {
      //   currentUser.rewards.sticker = [];
      // }
      if (!currentReward) {
        return false;
      }
      // let canPushCurrentReward = true;
      // for (let i = 0; i < currentUser.rewards.sticker.length; i++) {
      //   const element = currentUser.rewards.sticker[i];
      //   if (element.id === currentReward.id) {
      //     canPushCurrentReward = false;
      //   }
      // }
      // if (canPushCurrentReward)
      //   currentUser.rewards.sticker.push({
      //     id: currentReward.id,
      //     seen: false,
      //   });
      // await api.updateRewardsForStudent(currentUser.id, currentUser.rewards);
      return true;
    } catch (error) {
      console.error("unlockWeeklySticker() error ", error);
      return false;
    }
  }

  public static async getAllUnlockedRewards(): Promise<
    unlockedRewardsInfo[] | undefined
  > {
    //   await this.getStudentFromServer();
    //   const api = ServiceConfig.getI().apiHandler;
    //   const currentStudent = this.getCurrentStudent();
    //   if (!currentStudent || !currentStudent.rewards) return;
    //   const processRewards = async (
    //     rewards: any[],
    //     type: LeaderboardRewardsType,
    //     apiGetter: (id: string) => Promise<any>,
    //     rewardList: LEADERBOARD_REWARD_LIST
    //   ) => {
    //     for (const element of rewards) {
    //       if (!element.seen) {
    //         const reward = await apiGetter(element.id);
    //         if (reward) {
    //           allUnlockedRewards.push({
    //             id: element.id,
    //             type,
    //             image: reward.image || reward.thumbnail,
    //             name: reward.name || reward.title,
    //             leaderboardRewardList: rewardList,
    //           });
    //         }
    //       }
    //     }
    //   };
    //   const allUnlockedRewards: unlockedRewardsInfo[] = [];
    //   await processRewards(
    //     currentStudent.rewards.badges || [],
    //     LeaderboardRewardsType.BADGE,
    //     (id) => api.getBadgeById(id),
    //     LEADERBOARD_REWARD_LIST.BADGES
    //   );
    //   await processRewards(
    //     currentStudent.rewards.bonus || [],
    //     LeaderboardRewardsType.BONUS,
    //     (id) => api.getLesson(id),
    //     LEADERBOARD_REWARD_LIST.BONUS
    //   );
    //   await processRewards(
    //     currentStudent.rewards.sticker || [],
    //     LeaderboardRewardsType.STICKER,
    //     (id) => api.getStickerById(id),
    //     LEADERBOARD_REWARD_LIST.STICKER
    //   );
    //   return allUnlockedRewards;
    return;
  }

  public static async onAppUrlOpen(event: URLOpenListenerEvent) {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const url = new URL(event.url);
    const slug = event.url.split(".cc").pop();
    // Determine target page for logging
    let destinationPage = "";
    const newSearchParams = new URLSearchParams(url.search);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("classCode", newSearchParams.get("classCode") ?? "");
    currentParams.set("page", PAGES.JOIN_CLASS);
    const currentStudent = Util.getCurrentStudent();
    if (slug?.includes(PAGES.ASSIGNMENT)) {
      destinationPage = PAGES.HOME + "?tab=" + HOMEHEADERLIST.ASSIGNMENT;
    } else if (slug?.includes(PAGES.JOIN_CLASS)) {
      destinationPage = currentStudent
        ? PAGES.HOME + "?" + currentParams.toString()
        : PAGES.DISPLAY_STUDENT + "?" + currentParams.toString();
    } else {
      // Fallback for other deeplinks
      destinationPage = PAGES.HOME;
    }

    await Util.handleDeeplinkClick(
      url,
      currentUser as TableTypes<"user">,
      destinationPage
    );
    if (destinationPage && currentStudent) {
      window.location.replace(destinationPage);
    } else {
      window.location.replace(
        PAGES.DISPLAY_STUDENT + "?" + currentParams.toString()
      );
    }
  }
  public static addRefreshTokenToLocalStorage(refreshToken: string) {
    const data = {
      token: refreshToken,
      savedAt: new Date().toISOString(), // store current date/time in ISO format
    };
    localStorage.setItem(REFRESH_TOKEN, JSON.stringify(data));
  }

  public static setCurrentSchool = async (
    school: TableTypes<"school">,
    role: RoleType
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentSchool = school !== null ? school : undefined;
    localStorage.setItem(SCHOOL, JSON.stringify(school));
    localStorage.setItem(USER_ROLE, JSON.stringify([role]));
  };

  public static getCurrentSchool(): TableTypes<"school"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentSchool) return api.currentSchool;
    const temp = localStorage.getItem(SCHOOL);
    if (!temp) return;
    const currentSchool = JSON.parse(temp) as TableTypes<"school">;
    api.currentSchool = currentSchool;
    return currentSchool;
  }

  public static setCurrentClass = async (
    classDoc: TableTypes<"class"> | null
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = classDoc !== null ? classDoc : undefined;
    localStorage.setItem(CLASS, JSON.stringify(classDoc));
  };

  public static getCurrentClass(): TableTypes<"class"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    const temp = localStorage.getItem(CLASS);
    if (!temp || temp === "undefined") return;

    try {
      const currentClass = JSON.parse(temp) as TableTypes<"class">;
      api.currentClass = currentClass;
      return currentClass;
    } catch (err) {
      console.error("Failed to parse currentClass from localStorage", err);
      return;
    }
  }

  public static async sendContentToAndroidOrWebShare(
    text: string,
    title: string,
    url?: string,
    imageFile?: File[]
  ) {
    if (Capacitor.isNativePlatform()) {
      // Convert File object to a blob URL, then extract path for Android
      const file = imageFile ? imageFile[0] : null;

      await Util.port
        .shareContentWithAndroidShare({
          text: t(text),
          title: t(title),
          url: url,
          imageFile: imageFile, // Pass the File object for Android
        })
        .then(() => {})
        .catch((error) => console.error("Error sharing content:", error));
    } else {
      // Web sharing
      const shareData: ShareData = {
        text: t(text) || "",
        title: t(title) || "",
        url: url,
        files: imageFile,
      };

      await navigator
        .share(shareData)
        .then(() => {})
        .catch((error) => console.error("Error sharing content:", error));
    }
  }

  public static setCurrentCourse = async (
    classId: string | undefined,
    courseDoc: TableTypes<"course"> | null
  ) => {
    if (!classId) return;
    const api = ServiceConfig.getI().apiHandler;
    const courseMap: Map<string, TableTypes<"course"> | undefined> = new Map();
    courseMap.set(classId, courseDoc ?? undefined);
    api.currentCourse = courseMap;
    const mapObject = Object.fromEntries(courseMap);
    localStorage.setItem(CURRENT_COURSE, JSON.stringify(mapObject));
  };

  public static getCurrentCourse(
    classId: string | undefined
  ): TableTypes<"course"> | undefined {
    if (!classId) return;
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentCourse) return api.currentCourse.get(classId);
    const temp = localStorage.getItem(CURRENT_COURSE);
    if (!temp) return;
    const tempObject = JSON.parse(temp);
    const currentCourse = new Map(Object.entries(tempObject)) as Map<
      string,
      TableTypes<"course">
    >;
    return currentCourse.get(classId);
  }
  public static dispatchClassOrSchoolChangeEvent = () => {
    const customEvent = new CustomEvent(CLASS_OR_SCHOOL_CHANGE_EVENT);
    window.dispatchEvent(customEvent);
  };
  public static getNavigationState(): {
    stage: string;
  } | null {
    return JSON.parse(localStorage.getItem(NAVIGATION_STATE) || "null");
  }

  public static setNavigationState(stage: string) {
    const navigationState = { stage };
    localStorage.setItem(NAVIGATION_STATE, JSON.stringify(navigationState));
  }

  public static clearNavigationState() {
    localStorage.removeItem(NAVIGATION_STATE);
  }

  public static async getAndroidBundlePath(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const path = await Filesystem.getUri({
          directory: Directory.External,
          path: "",
        });

        if (path && path.uri) {
          const uri = Capacitor.convertFileSrc(path.uri);
          return uri + "/"; // file:///data/user/0/org.chimple.bahama/cache
        }
      } catch (error) {
        console.error("path error", error);
      }
      throw new Error("Failed to retrieve Android bundle path.");
    }
    throw new Error("Not running on a native platform.");
  }

  public static setGameUrl(path: string) {
    localStorage.setItem(GAME_URL, path);
  }
  public static async triggerSaveProceesedXlsxFile(data: {
    fileData: string;
    fileName?: string;
  }) {
    try {
      if (!Util.port) {
        Util.port = registerPlugin<PortPlugin>("Port");
      }
      await Util.port.saveProceesedXlsxFile({
        fileData: data.fileData,
        fileName: data.fileName,
      });
    } catch (error) {
      console.error("Download failed:", error);
    }
  }
  public static handleMissingEntities(
    history: any,
    redirectPage: string,
    origin: PAGES,
    classId?: string
  ) {
    history.replace(redirectPage, {
      classId: classId,
      origin: origin,
      isSelect: true,
    });
  }
  public static async handleClassAndSubjects(
    schoolId: string,
    userId: string,
    history: any,
    originPage: PAGES
  ) {
    const api = ServiceConfig.getI().apiHandler;
    const schoolCourses = await api.getCoursesBySchoolId(schoolId);
    if (schoolCourses.length === 0) {
      this.setNavigationState(School_Creation_Stages.SCHOOL_COURSE);
      history.replace(PAGES.SUBJECTS_PAGE, {
        schoolId: schoolId,
        origin: originPage,
        isSelect: true,
      });
      return;
    }
    const fetchedClasses = await api.getClassesForSchool(schoolId, userId);
    if (fetchedClasses.length === 0) {
      history.replace(PAGES.ADD_CLASS, {
        school: { id: schoolId },
        origin: originPage,
      });
      return;
    }

    const classCoursesData = await Promise.all(
      fetchedClasses.map((classItem) =>
        api.getCoursesByClassId(classItem.id).then((courses) => ({
          classId: classItem.id,
          courses,
        }))
      )
    );

    const classWithoutSubjects = classCoursesData.find(
      (data) => data.courses.length === 0
    );

    if (classWithoutSubjects) {
      this.setNavigationState(School_Creation_Stages.CLASS_COURSE);
      this.handleMissingEntities(
        history,
        PAGES.SUBJECTS_PAGE,
        originPage,
        classWithoutSubjects.classId
      );
      return;
    }
  }
  public static async encryptData(data: object): Promise<string | null> {
    try {
      const stringData = JSON.stringify(data);
      const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;

      if (!ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY is not set.");
      }
      return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error("Encryption failed:", error);
      return null;
    }
  }

  public static async decryptData(
    ciphertext: string
  ): Promise<{ email: string; password: string } | null> {
    try {
      const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
      if (!ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY is not set.");
      }

      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }

  public static async storeLoginDetails(
    email: string,
    password: string
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
      console.error("Failed to encrypt and store login details:", error);
    }
  }

  public static async downloadFileFromUrl(fileUrl: string): Promise<void> {
    try {
      const response = await fetch(fileUrl);

      // ✅ Validate content type to avoid corrupted files
      const contentType = response.headers.get("content-type") || "";
      if (
        contentType.includes("text/html") ||
        contentType.includes("application/json")
      ) {
        const text = await response.text();
        console.error(
          "Unexpected content instead of a file:",
          text.slice(0, 100)
        );
        throw new Error(
          "Invalid file download. Check if the link is direct and the file is public."
        );
      }
      const blob = await response.blob();
      this.handleBlobDownloadAndSave(blob, "BulkUploadTemplate.xlsx");
    } catch (error) {
      console.error("Download failed:", error);
    }
  }

  public static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        resolve(base64Data.split(",")[1]);
      };
      reader.onerror = reject;
    });
  }

  public static async handleBlobDownloadAndSave(blob: Blob, fileName?: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const base64 = await Util.blobToBase64(blob);
        await Util.triggerSaveProceesedXlsxFile({
          fileData: base64,
          fileName: fileName,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "ProcessedFile.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to save or download file:", error);
    }
  }
  public static mergeStudentsByUpdatedAt(
    apiStudents: TableTypes<"user">[],
    storedMapStr: string | null
  ): TableTypes<"user">[] {
    const studentsMap: Record<string, TableTypes<"user">> = storedMapStr
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
    const body = document.querySelector("body");
    if (
      Capacitor.isNativePlatform() &&
      localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === "true"
    ) {
      try {
        const result = await Filesystem.readFile({
          path: "remoteAsset/remoteBackground.svg",
          directory: Directory.External,
        });
        const res = await this.blobToString(result.data);
        console.log("llllllllllllllllllllllll", res);

        const svgData = atob(res); // decode base64

        if (body) {
          body.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(
            svgData
          )}')`;
          body.style.backgroundRepeat = "no-repeat";
          body.style.backgroundSize = "cover";
          body.style.backgroundPosition = "center center";
        }
      } catch (e) {
        body?.style.setProperty(
          "background-image",
          "url(/pathwayAssets/pathwayBackground.svg)"
        );
        body?.style.setProperty("background-repeat", "no-repeat");
        body?.style.setProperty("background-size", "cover");
        body?.style.setProperty("background-position", "center center");
        console.error("Failed to load remote background image:", e);
      }
    } else {
      body?.style.setProperty(
        "background-image",
        "url(/pathwayAssets/pathwayBackground.svg)"
      );
      body?.style.setProperty("background-repeat", "no-repeat");
      body?.style.setProperty("background-size", "cover");
      body?.style.setProperty("background-position", "center center");
    }
  }
  public static async handleDeeplinkClick(
    url: URL,
    currentUser: TableTypes<"user"> | null,
    destinationPage: string
  ) {
    const timestamp = new Date().toISOString();

    // Convert all query parameters to an object
    const queryParams: Record<string, string | null> = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryParams[key] = value;
    }

    const eventData = {
      user_id: currentUser?.id ?? "anonymous",
      user_name: currentUser?.name ?? "",
      phone: currentUser?.phone || null,
      email: currentUser?.email || null,
      timestamp,
      destinationPage: destinationPage,
      ...queryParams,
    };

    await Util.logEvent(EVENTS.DEEPLINK_CLICKED, eventData);
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
        (lang) => lang.code === languageCode
      );

      // Skip if no language found or already set to the same language
      if (!selectedLanguage || selectedLanguage.id === currentUser.language_id)
        return;

      await api.updateLanguage(currentUser.id, selectedLanguage.id);
      localStorage.setItem(LANGUAGE, languageCode);
      await i18n.changeLanguage(languageCode ?? "");

      const updatedUserData: TableTypes<"user"> = {
        ...currentUser,
        language_id: selectedLanguage.id,
      };

      localStorage.setItem(USER_DATA, JSON.stringify(updatedUserData));
      auth.currentUser = updatedUserData;
    } catch (error) {
      console.error("Failed to update user language:", error);
    }
  }
  public static async fetchTodaysReward() {
    try {
      const allRewards = await ServiceConfig.getI().apiHandler.getAllRewards();
      if (allRewards.length === 0) return;
      const today = new Date();
      const day = today.getDate();
      let chimpleRiveMaxState = allRewards[0].max_state_value ?? 8;
      if (localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === "true") {
        chimpleRiveMaxState =
          parseInt(
            localStorage.getItem(CHIMPLE_RIVE_STATE_MACHINE_MAX) as string
          ) ?? chimpleRiveMaxState;
      }

      const mappedState = ((day - 1) % chimpleRiveMaxState) + 1;
      const todaysReward = allRewards.find(
        (reward) =>
          reward.state_number_input === mappedState && reward.type === "normal"
      );
      return todaysReward;
    } catch (error) {
      console.error("Error fetching Chimple Rive config:", error);
    }
  }
  public static async updateUserReward() {
    try {
      // Get daily user reward from localStorage
      const dailyUserReward = JSON.parse(
        localStorage.getItem(DAILY_USER_REWARD) ?? "{}"
      );

      const currentStudent = Util.getCurrentStudent();
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
          .split("T")[0] !== new Date().toISOString().split("T")[0] ||
        dailyUserReward[currentStudent.id].reward_id !==
          currentReward?.reward_id
      ) {
        // Update localStorage
        dailyUserReward[currentStudent.id].reward_id = currentReward.reward_id;
        dailyUserReward[currentStudent.id].timestamp = currentReward.timestamp;
        localStorage.setItem(
          DAILY_USER_REWARD,
          JSON.stringify(dailyUserReward)
        );
      }
    } catch (error) {
      console.error("Error updating student reward:", error);
    }
  }
  public static retrieveUserReward() {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) return {};
    const studentId = currentStudent.id;
    try {
      const allRewards = JSON.parse(
        localStorage.getItem(DAILY_USER_REWARD) || "{}"
      );

      if (!allRewards[studentId]) {
        allRewards[studentId] = {};
      }
      const currentReward = allRewards[studentId];

      return currentReward;
    } catch (error) {
      console.error("Error managing daily user reward in localStorage:", error);
      return {};
    }
  }
  public static async updateHomeworkPath(completedIndex?: number) {
    try {
      const storedPath = sessionStorage.getItem(HOMEWORK_PATHWAY);
      if (!storedPath) {
        console.error(
          "Could not find homework path in sessionStorage to update."
        );
        return;
      }

      const homeworkPath = JSON.parse(storedPath);

      // If we know exactly which index was completed, use that as the base.
      // Otherwise, fall back to "currentIndex + 1" like before.
      const newCurrentIndex =
        typeof completedIndex === "number"
          ? completedIndex + 1
          : homeworkPath.currentIndex + 1;

      // Check if the 5-lesson path is now complete
      if (newCurrentIndex >= homeworkPath.lessons.length) {
        sessionStorage.removeItem(HOMEWORK_PATHWAY);
      } else {
        homeworkPath.currentIndex = newCurrentIndex;
        sessionStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(homeworkPath));
      }
    } catch (error) {
      console.error("Failed to update homework path:", error);
    }
  }

  public static async updateLearningPath(
    currentStudent: TableTypes<"user">,
    isRewardLesson: boolean
  ) {
    if (!currentStudent) return;
    const learningPath = currentStudent.learning_path
      ? JSON.parse(currentStudent.learning_path)
      : null;

    if (!learningPath) return;

    try {
      const { courses } = learningPath;
      const currentCourse = courses.courseList[courses.currentCourseIndex];

      const prevLessonId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .path[
          learningPath.courses.courseList[
            learningPath.courses.currentCourseIndex
          ].currentIndex
        ].lesson_id;
      const prevChapterId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .path[
          learningPath.courses.courseList[
            learningPath.courses.currentCourseIndex
          ].currentIndex
        ].chapter_id;
      const prevCourseId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .course_id;
      const prevPathId =
        learningPath.courses.courseList[learningPath.courses.currentCourseIndex]
          .path_id;
      // Update currentIndex
      currentCourse.currentIndex += 1;

      // Check if currentIndex exceeds pathEndIndex
      if (currentCourse.currentIndex > currentCourse.pathEndIndex) {
        if (isRewardLesson) {
          sessionStorage.setItem(
            REWARD_LEARNING_PATH,
            JSON.stringify(learningPath)
          );
        }
        currentCourse.startIndex = currentCourse.currentIndex;
        currentCourse.pathEndIndex += 5;

        // Ensure pathEndIndex does not exceed the path length
        if (currentCourse.pathEndIndex > currentCourse.path.length) {
          currentCourse.pathEndIndex = currentCourse.path.length - 1;
        }

        // Move to the next course
        courses.currentCourseIndex += 1;

        await ServiceConfig.getI().apiHandler.setStarsForStudents(
          currentStudent.id,
          10
        );
        // Loop back to the first course if at the last course
        if (courses.currentCourseIndex >= courses.courseList.length) {
          courses.currentCourseIndex = 0;
        }
        const pathwayEndData = {
          user_id: currentStudent.id,
          current_path_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].path_id,
          current_course_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].course_id,
          current_lesson_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].path[
              learningPath.courses.courseList[
                learningPath.courses.currentCourseIndex
              ].currentIndex
            ].lesson_id,
          current_chapter_id:
            learningPath.courses.courseList[
              learningPath.courses.currentCourseIndex
            ].path[
              learningPath.courses.courseList[
                learningPath.courses.currentCourseIndex
              ].currentIndex
            ].chapter_id,
          prev_path_id: prevPathId,
          prev_course_id: prevCourseId,
          prev_lesson_id: prevLessonId,
          prev_chapter_id: prevChapterId,
        };
        await Util.logEvent(EVENTS.PATHWAY_COMPLETED, pathwayEndData);
        await Util.logEvent(EVENTS.PATHWAY_COURSE_CHANGED, pathwayEndData);
      }

      // Update the learning path in the database
      await ServiceConfig.getI().apiHandler.updateLearningPath(
        currentStudent,
        JSON.stringify(learningPath)
      );
      // Update the current student object
      const updatedStudent =
        await ServiceConfig.getI().apiHandler.getUserByDocId(currentStudent.id);
      if (updatedStudent) {
        Util.setCurrentStudent(updatedStudent);
      }
    } catch (error) {
      console.error("Error updating learning path:", error);
    }
  }

  // In Util.ts or your utility file

  public static async fetchCurrentClassAndSchool(): Promise<{
    className: string;
    schoolName: string;
  }> {
    const currentStudent = Util.getCurrentStudent();
    let className = "";
    let schoolName = "";
    if (currentStudent?.id) {
      try {
        const api = ServiceConfig.getI().apiHandler;
        const linkedData = await api.getStudentClassesAndSchools(
          currentStudent.id
        );
        if (linkedData && linkedData.classes.length > 0) {
          const classDoc = linkedData.classes[0];
          className = classDoc.name || "";

          const schoolDoc = linkedData.schools.find(
            (s: any) => s.id === classDoc.school_id
          );
          schoolName = schoolDoc?.name || "";
        }
      } catch (error) {
        console.error("Error fetching class/school details:", error);
      }
    }
    return { className, schoolName };
  }
  public static pickFiveHomeworkLessons(
    assignments: any[],
    completedCountBySubject: { [key: string]: number } = {}
  ): any[] {
    const pendingBySubject: { [key: string]: any[] } = {};

    // Group pending (not completed) assignments per subject
    assignments.forEach((a) => {
      if (!a.completed) {
        if (!pendingBySubject[a.subject_id]) {
          pendingBySubject[a.subject_id] = [];
        }
        pendingBySubject[a.subject_id].push(a);
      }
    });

    // Find subjects with max pending
    let maxPending = 0;
    let subjectsWithMaxPending: string[] = [];

    Object.keys(pendingBySubject).forEach((subject) => {
      const length = pendingBySubject[subject].length;
      if (length > maxPending) {
        maxPending = length;
        subjectsWithMaxPending = [subject];
      } else if (length === maxPending) {
        subjectsWithMaxPending.push(subject);
      }
    });

    let bestSubject: string | null = null;

    if (subjectsWithMaxPending.length === 1) {
      bestSubject = subjectsWithMaxPending[0];
    } else if (subjectsWithMaxPending.length > 1) {
      // tie-break by fewer completed using the external completed count map
      let minCompleted = Number.MAX_SAFE_INTEGER;
      subjectsWithMaxPending.forEach((subject) => {
        const completedCount = completedCountBySubject[subject] ?? 0;
        if (completedCount < minCompleted) {
          minCompleted = completedCount;
          bestSubject = subject;
        }
      });
    }

    let result: any[] = [];

    if (bestSubject && maxPending >= 5) {
      // If one subject alone has >= 5 pending, take first 5 from that subject
      result = pendingBySubject[bestSubject].slice(0, 5);
    } else if (bestSubject && maxPending < 5) {
      // Otherwise fill from bestSubject first, then other subjects with more pending
      result = [...(pendingBySubject[bestSubject] || [])];
      const remaining = 5 - result.length;

      const otherSubjects = Object.keys(pendingBySubject)
        .filter((s) => s !== bestSubject)
        .sort(
          (a, b) =>
            (pendingBySubject[b]?.length || 0) -
            (pendingBySubject[a]?.length || 0)
        );

      for (const subj of otherSubjects) {
        if (result.length >= 5) break;
        const toTake = Math.min(
          5 - result.length,
          pendingBySubject[subj].length
        );
        result = result.concat(pendingBySubject[subj].slice(0, toTake));
      }
    }

    return result;
  }
}
