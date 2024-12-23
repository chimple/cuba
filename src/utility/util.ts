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
} from "../common/constants";
import {
  Chapter as curriculamInterfaceChapter,
  Course as curriculamInterfaceCourse,
  Lesson as curriculamInterfaceLesson,
} from "../interface/curriculumInterfaces";
import { GUIDRef, RoleType } from "../interface/modelInterfaces";
import { OneRosterApi } from "../services/api/OneRosterApi";
import { ServiceConfig } from "../services/ServiceConfig";
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
import { RateApp } from "capacitor-rate-app";
import { getFunctions, httpsCallable } from "firebase/functions";
// import { CollectionIds } from "../common/courseConstants";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "../services/RemoteConfig";
import { schoolUtil } from "./schoolUtil";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { URLOpenListenerEvent } from "@capacitor/app";
import { t } from "i18next";
import { FirebaseCrashlytics } from "@capacitor-firebase/crashlytics";

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

    console.log("currentChapter", currentChapter);

    if (!currentChapter) return undefined;
    let currentLessonIndex;

    // currentChapter.lessons = Util.convertDoc(currentChapter.lessons);
    const cChapter = await api.getLessonsForChapter(currentChapter);

    for (let i = 0; i < cChapter.length - 1; i++) {
      const currentLesson = cChapter[i];
      console.log(`Checking lesson at index ${i}:`, currentLesson);
      console.log("currentlesson id:", currentLesson.id);
      if (currentLesson.id === currentLessonId) {
        currentLessonIndex = i;
        break;
      }
    }

    console.log("currentLessonIndex", currentLessonIndex);

    if (currentLessonIndex < currentChapter.lessons.length - 1) {
      let nextLesson = currentChapter.lessons[currentLessonIndex + 1];
      let lessonId = nextLesson.id;
      let studentResult:
        | { [lessonDocId: string]: TableTypes<"result"> }
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
          nextLesson.id
        )) as TableTypes<"lesson">;
        console.log("lessonObj", lessonObj);
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
    console.log("handleAppStateChange triggered");
    if (state.isActive && Capacitor.isNativePlatform()) {
      const currentTime = Date.now();
      const startTime = Number(localStorage.getItem("startTime") || "0");
      const timeElapsed = (currentTime - startTime) / 1000; // in seconds
      if (timeElapsed >= Util.TIME_LIMIT) {
        const lastShownDate = localStorage.getItem(Util.LAST_MODAL_SHOWN_KEY);
        const today = new Date().toISOString().split("T")[0];
        console.log(
          "lastShownDate in handleAppStateChange",
          today,
          lastShownDate
        );
        if ("2024-11-05" !== today) {
          // if (STAGES.MODE === "parent") {
          console.log("handleAppStateChange modal triggered");
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
    console.log(currSound);
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
    console.log("currentMISIC", currMusic);
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

  public static async downloadZipBundle(
    lessonIds: string[],
    chapterId?: string
  ): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) return true;

      for (let i = 0; i < lessonIds.length; i += DOWNLOAD_LESSON_BATCH_SIZE) {
        const lessonIdsChunk = lessonIds.slice(
          i,
          i + DOWNLOAD_LESSON_BATCH_SIZE
        );
        const results = await Promise.all(
          lessonIdsChunk.map(async (lessonId) => {
            try {
              let lessonDownloadSuccess = true; // Flag to track lesson download success
              console.log(
                "downloading Directory.External",
                Directory.External,
                "Directory.Library"
              );
              const fs = createFilesystem(Filesystem, {
                rootDir: "/",
                directory: Directory.External,
                base64Alway: false,
              });

              const path =
                (localStorage.getItem("gameUrl") ??
                  "http://localhost/_capacitor_file_/storage/emulated/0/Android/data/org.chimple.bahama/files/") +
                lessonId +
                "/config.json";
              console.log("checking path..", "path", path);
              const res = await fetch(path);
              const isExists = res.ok;
              console.log("fetching path", path);
              console.log("isexists", isExists);
              if (isExists) {
                this.storeLessonIdToLocalStorage(
                  lessonId,
                  DOWNLOADED_LESSON_ID
                );
                return true;
              } // Skip if lesson exists

              console.log(
                "before local lesson Bundle http url:" +
                  "assets/" +
                  lessonId +
                  "/config.json"
              );

              const fetchingLocalBundle = await fetch(
                "assets/" + lessonId + "/config.json"
              );
              console.log(
                "after local lesson Bundle fetch url:" +
                  "assets/" +
                  lessonId +
                  "/config.json",
                fetchingLocalBundle.ok,
                fetchingLocalBundle.json,
                fetchingLocalBundle
              );

              if (fetchingLocalBundle.ok) return true;

              console.log("fs", fs);
              const bundleZipUrls: string[] = await RemoteConfig.getJSON(
                REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS
              );
              if (!bundleZipUrls || bundleZipUrls.length < 1) return false;
              let zip;

              let downloadAttempts = 0;
              while (downloadAttempts < MAX_DOWNLOAD_LESSON_ATTEMPTS) {
                for (let bundleUrl of bundleZipUrls) {
                  const zipUrl = bundleUrl + lessonId + ".zip";
                  try {
                    zip = await CapacitorHttp.get({
                      url: zipUrl,
                      responseType: "blob",
                    });
                    console.log(
                      "🚀 ~ file: util.ts:219 ~ downloadZipBundle ~ zip:",
                      zip.status
                    );
                    if (!!zip && !!zip.data && zip.status === 200) break;
                  } catch (error) {
                    console.log(
                      "🚀 ~ file: util.ts:216 ~ downloadZipBundle ~ error:",
                      error
                    );
                  }
                }
                downloadAttempts++;
              }
              if (!zip || !zip.data || zip.status !== 200)
                lessonDownloadSuccess = false;
              if (zip instanceof Object) {
                console.log("unzipping ");
                const buffer = Uint8Array.from(atob(zip.data), (c) =>
                  c.charCodeAt(0)
                );
                await unzip({
                  fs: fs,
                  extractTo: lessonId,
                  filepaths: ["."],
                  filter: (filepath: string) =>
                    filepath.startsWith("dist/") === false,
                  onProgress: (event) =>
                    console.log(
                      "event unzipping ",
                      event.total,
                      event.filename,
                      event.isDirectory,
                      event.loaded
                    ),
                  data: buffer,
                });
                console.log("Unzip done");
                this.storeLessonIdToLocalStorage(
                  lessonId,
                  DOWNLOADED_LESSON_ID
                );

                const customEvent = new CustomEvent(
                  LESSON_DOWNLOAD_SUCCESS_EVENT,
                  {
                    detail: { lessonId },
                  }
                );

                window.dispatchEvent(customEvent);
              }

              return lessonDownloadSuccess; // Return the result of lesson download
            } catch (error) {
              console.error("Error during lesson download: ", error);
              return false;
            }
          })
        );

        if (!results.every((result) => result === true)) {
          return false; // If any lesson download failed, return false
        }
      }
      const customEvent = new CustomEvent(ALL_LESSON_DOWNLOAD_SUCCESS_EVENT, {
        detail: { chapterId },
      });
      if (chapterId) {
        this.removeLessonIdFromLocalStorage(chapterId, DOWNLOADING_CHAPTER_ID);
      }

      window.dispatchEvent(customEvent);
      return true; // Return true if all lessons are successfully downloaded
    } catch (error) {
      console.error("Error during lesson download: ", error);
      return false;
    }
  }

  public static async deleteDownloadedLesson(
    lessonIds: string[]
  ): Promise<boolean> {
    try {
      for (const lessonId of lessonIds) {
        const lessonPath = `${lessonId}`;
        await Filesystem.rmdir({
          path: lessonPath,
          directory: Directory.External,
          recursive: true,
        });
        console.log("Lesson deleted successfully:", lessonId);
        this.removeLessonIdFromLocalStorage(lessonId, DOWNLOADED_LESSON_ID);
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
    return false;
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
          console.log("Processing folder:", contents.files[i].name);
          folderNamesArray.push(contents.files[i].name);
        }
        localStorage.setItem(DOWNLOADED_LESSON_ID, JSON.stringify([]));
        console.log("local ids", folderNamesArray);
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
            // show canvas
            var canvas = document.getElementById("GameCanvas");
            if (canvas) {
              canvas.style.visibility = "";
              canvas.style.display = "";
            }
            const container = document.getElementById("Cocos2dGameContainer");
            if (container) {
              container.style.display = "";
            }
            var div = document.getElementById("GameDiv");
            if (div) {
              div.style.backgroundImage = "";
            }
            console.log("Success to load scene: " + launchScene);
          }
          resolve(scene);
        } else {
          reject(err);
        }
      });
    });
  }

  public static killCocosGame(): void {
    if (!window.cc) {
      return;
    }
    console.log("pausing the game");
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
      console.log("in util if (!selectedGrade) {", gradeMap);
    } else {
      gradeMap = JSON.parse(selectedGrade);
      console.log("else (selectedGrade) {", gradeMap);
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
    console.log("🚀 ~ file: util.ts:303 ~ showLog ~ msg:", msg);
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

      console.log("FirebaseAnalytics.setUserId({", FirebaseAnalytics);
      await FirebaseAnalytics.logEvent({
        name: eventName,
        params: params,
      });
    } catch (error) {
      console.log(
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
      console.log("Set User Properties Error ", error);
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

  public static checkingIfGameCanvasAvailable = async () => {
    // return new Promise<boolean>(async (resolve, reject) => {
    try {
      const canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
      if (canvas) {
        const webgl2Context = canvas.getContext("webgl");
        canvas.addEventListener(
          "webglcontextlost",
          function (event) {
            // inform WebGL that we handle context restoration
            console.log("WebGl webglcontextlost in cocosGame.tsx");
            event.preventDefault();
            if (webgl2Context) {
              const rest = webgl2Context.getExtension("WEBGL_lose_context");

              // Reloading cocos Game if GameCanvas buffer is not restored
              if (!rest) {
                // const url = new URL(window.location.toString());
                // url.searchParams.set("isReload", "false");
                // url.searchParams.delete(CONTINUE);
                // window.history.replaceState(
                //   window.history.state,
                //   "",
                //   url.toString()
                // );
                window.location.reload();
                // resolve(false);
                console.log("page got reloaded ", false);
              }
              if (rest) {
                rest.loseContext();
                // return true;
                // resolve(false);
              }
            }
          },
          false
        );
        canvas.addEventListener(
          "webglcontextrestored",
          function (event) {
            // inform WebGL that we handle context restoration
            console.log("WebGl webglcontextrestored in cocosGame.tsx");
            event.preventDefault();

            if (webgl2Context) {
              const rest = webgl2Context.getExtension("WEBGL_lose_context");

              if (rest) {
                rest.restoreContext();
                // return true;
                // resolve(false);
              }
            }
          },
          false
        );
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: util.ts:965 ~ checkingIfGameCanvasAvailable ~ error:",
        error
      );
      // throw error;
    }
    // });
  };

  public static setPathToBackButton(path: string, history: any) {
    const url = new URLSearchParams(window.location.search);
    if (url.get(CONTINUE)) {
      history.replace(`${path}?${CONTINUE}=true`);
    } else {
      history.replace(path);
    }
  }

  public static setCurrentStudent = async (
    student: TableTypes<"user"> | null,
    languageCode?: string,
    langFlag: boolean = true,
    isStudent: boolean = true
  ) => {
    console.log("setCurrentStudent called", student);

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
    console.log("🚀 ~ tempLangCode:", tempLangCode);
    if (!!langFlag) localStorage.setItem(LANGUAGE, tempLangCode);
    console.log("🚀 ~ langFlag:", langFlag);
    if (!!isStudent) await i18n.changeLanguage(tempLangCode);
    console.log("🚀 ~ isStudent:", isStudent);

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
        console.log("info", JSON.stringify(info));
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
      console.log(
        "🚀 ~ file: util.ts:473 ~ startFlexibleUpdate ~ canCheckUpdate:",
        canCheckUpdate
      );
      if (!canCheckUpdate) return;
      const result = await AppUpdate.getAppUpdateInfo();
      console.log(
        "🚀 ~ file: util.ts:471 ~ startFlexibleUpdate ~ result:",
        JSON.stringify(result)
      );
      if (
        result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE
      ) {
        return;
      }
      if (result.flexibleUpdateAllowed) {
        const appUpdateResult = await AppUpdate.startFlexibleUpdate();
        console.log(
          "🚀 ~ file: util.ts:482 ~ startFlexibleUpdate ~ appUpdateResult:",
          JSON.stringify(appUpdateResult)
        );
        if (appUpdateResult.code === AppUpdateResultCode.OK) {
          console.log(
            "🚀 ~ file: util.ts:487 ~ startFlexibleUpdate ~ appUpdateResult.code:",
            appUpdateResult.code
          );
          await AppUpdate.completeFlexibleUpdate();
          console.log(
            "🚀 ~ file: util.ts:492 ~ startFlexibleUpdate ~ completeFlexibleUpdate:"
          );
        }
      }
    } catch (error) {
      console.log(
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
          if (
            notification.data &&
            notification.data["notificationType"] === TABLES.Assignment
          ) {
            const api = ServiceConfig.getI().apiHandler;
            await api.syncDB();
          }
          console.log("notificationReceived", JSON.stringify(notification));
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
                console.log(
                  "Local Notification Action Performed",
                  notification
                );
                const extraData = notification.notification.extra;
                onNotification(extraData);
              }
            );
            console.log(
              "🚀 ~ file: util.ts:622 ~ res:",
              JSON.stringify(res.notifications)
            );
          } catch (error) {
            console.log(
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
      console.log(
        "🚀 ~ file: util.ts:514 ~ checkNotificationPermissionsAndType ~ error:",
        JSON.stringify(error)
      );
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
    //     console.log("🚀 ~ file: util.ts:677 ~ window.addEventListener ~ e:", e);
    //     enableNetwork(_db);
    //   });
    //   window.addEventListener("offline", (e) => {
    //     console.log("🚀 ~ file: util.ts:681 ~ window.addEventListener ~ e:", e);
    //     disableNetwork(_db);
    //   });
    // } catch (err) {
    //   console.log("🚀 ~ listenToNetwork ~ err:", err);
    // }
  }

  public static async showInAppReview() {
    try {
      await RateApp.requestReview();
    } catch (error) {
      console.log(
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
    console.log("🚀 ~ file: util.ts:714 ~ migrate ~ filePath:", filePath);
    const url = Capacitor.convertFileSrc(filePath);
    const res = await fetch(url);
    const isExists = res.ok;
    console.log("🚀 ~ file: util.ts:717 ~ migrate ~ isExists:", isExists);
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
      console.log(
        "🚀 ~ file: util.ts:734 ~ migrate ~ result:",
        JSON.stringify(result)
      );
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
      console.log("🚀 ~ file: util.ts:707 ~ migrate ~ error:", error);
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
      console.log(
        "getCanShowAvatar() return canShowAvatarValue;",
        canShowAvatarValue
      );

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
      console.log("Migrate existing Json File ");
      // if (!Capacitor.isNativePlatform()) {
      //   console.log("Not a native platform. JSON migration skipped.");
      //   return;
      // }

      if (!newFileURL) {
        console.log("new avatar newFileURL is undefined ", newFileURL);

        return;
      }

      let newFileResponse = await fetch(newFileURL);

      let newFileJson = await newFileResponse.json();
      console.log("newAvatarSuggesstionJson ", newFileJson);

      let oldFileResponse = await fetch(oldFilePath);

      let oldFileJson = await oldFileResponse.json();

      console.log("newAvatarSuggesstionJson.data", oldFileJson);
      console.log(
        "oldFileJson.version >= newFileJson.version",
        oldFileJson.version,
        newFileJson.version,
        oldFileJson.version >= newFileJson.version
      );

      if (oldFileJson.version >= newFileJson.version) {
        console.log("No need to migrate. Current version is up to date.");
        return;
      }

      let res = await Filesystem.writeFile({
        path: newFilePathLocation,
        directory: Directory.Data,
        data: JSON.stringify(newFileJson),
        encoding: Encoding.UTF8,
        recursive: true,
      });
      console.log(
        "const res = await Filesystem.writeFile({ slice",
        res.uri //.slice(1, res.uri.length)
      );
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
    const now: Date = new Date();
    const currentDay: number = now.getDay();
    const daysToMonday: number = currentDay === 0 ? 6 : currentDay - 1;
    now.setDate(now.getDate() - daysToMonday);
    const onejan: Date = new Date(now.getFullYear(), 0, 1);
    const millisecsInDay: number = 86400000;
    const dayOfYear: number =
      (now.getTime() - onejan.getTime()) / millisecsInDay + 1;
    const firstDayOfWeek: number = onejan.getDay() || 7;
    const weekNumber: number = Math.ceil((dayOfYear + firstDayOfWeek) / 7);
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
    console.log("getStudentInfo called");

    const api = ServiceConfig.getI().apiHandler;
    let currentStudent = await Util.getCurrentStudent();
    console.log("Util.getCurrentStudent() ", currentStudent);
    if (!currentStudent) return;
    console.log("Util.getCurrentStudent().id ", currentStudent.id);
    const updatedStudent = await api.getUserByDocId(currentStudent.id);
    console.log("api.getUserByDocId(currentStudent.id); ", updatedStudent);
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

      console.log(
        "const weeklyData = rewardsDoc.weeklySticker;",
        rewardsDoc.weeklySticker
      );

      let currentReward;

      weeklyData?.[currentWeek.toString()].forEach(async (value) => {
        console.log(
          "weeklyData[currentWeek.toString()].forEach((value) => {",
          value
        );
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
      //   console.log("const element = currentUser.rewards.sticker[i];", element);
      //   if (element.id === currentReward.id) {
      //     canPushCurrentReward = false;
      //   }
      // }
      // if (canPushCurrentReward)
      //   currentUser.rewards.sticker.push({
      //     id: currentReward.id,
      //     seen: false,
      //   });
      // console.log("currentUser.rewards?.sticker.push({", currentUser.rewards);
      // await api.updateRewardsForStudent(currentUser.id, currentUser.rewards);
      return true;
    } catch (error) {
      console.log("unlockWeeklySticker() error ", error);
      return false;
    }
  }

  public static async getAllUnlockedRewards(): Promise<
    unlockedRewardsInfo[] | undefined
  > {
    //   console.log("getAllUnlockedRewards() called");
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
    //           console.log("Reward added: ", element, reward);
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
    //   console.log("getAllUnlockedRewards() called ", allUnlockedRewards);
    //   return allUnlockedRewards;
    return;
  }

  public static onAppUrlOpen(event: URLOpenListenerEvent) {
    const slug = event.url.split(".cc").pop();
    if (slug?.startsWith(PAGES.JOIN_CLASS)) {
      const newSearParams = new URLSearchParams(new URL(event.url).search);
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("classCode", newSearParams.get("classCode") ?? "");
      currentParams.set("page", PAGES.JOIN_CLASS);
      const currentStudent = Util.getCurrentStudent();
      if (currentStudent) {
        window.location.replace(PAGES.HOME + "?" + currentParams.toString());
      } else {
        window.location.replace(
          PAGES.DISPLAY_STUDENT + "?" + currentParams.toString()
        );
      }
    }
  }
  public static addRefreshTokenToLocalStorage(refreshToken: string) {
    localStorage.setItem(REFRESH_TOKEN, JSON.stringify(refreshToken));
  }
  public static setCurrentSchool = async (
    school: TableTypes<"school">,
    role: RoleType
  ) => {
    console.log("setCurrentSchool called", school);
    const api = ServiceConfig.getI().apiHandler;
    api.currentSchool = school !== null ? school : undefined;
    localStorage.setItem(SCHOOL, JSON.stringify(school));
    localStorage.setItem(USER_ROLE, JSON.stringify(role));
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
    console.log("setCurrentClass called", classDoc);
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = classDoc !== null ? classDoc : undefined;
    localStorage.setItem(CLASS, JSON.stringify(classDoc));
  };

  public static getCurrentClass(): TableTypes<"class"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    const temp = localStorage.getItem(CLASS);
    if (!temp) return;
    const currentClass = JSON.parse(temp) as TableTypes<"class">;
    api.currentClass = currentClass;
    return currentClass;
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
        .then(() => console.log("Content shared successfully"))
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
        .then(() => console.log("Content shared successfully"))
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
}
