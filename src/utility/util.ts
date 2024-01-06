import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Toast } from "@capacitor/toast";
import createFilesystem from "capacitor-fs";
import { unzip } from "zip2";
import {
  CURRENT_STUDENT,
  BUNDLE_URL,
  COURSES,
  CURRENT_LESSON_LEVEL,
  EVENTS,
  FCM_TOKENS,
  LANG,
  LANGUAGE,
  LAST_PERMISSION_CHECKED,
  LAST_UPDATE_CHECKED,
  PAGES,
  PortPlugin,
  PRE_QUIZ,
  SELECTED_GRADE,
  SL_GRADES,
  IS_MIGRATION_CHECKED,
  SOUND,
  MUSIC,
  CONTINUE,
  DOWNLOADED_LESSON_AND_CHAPTER_ID,
  LAST_FUNCTION_CALL,
  CHAPTER_LESSON_MAP,
  // APP_LANG,
} from "../common/constants";
import {
  Chapter as curriculamInterfaceChapter,
  Course as curriculamInterfaceCourse,
  Lesson as curriculamInterfaceLesson,
} from "../interface/curriculumInterfaces";
import Course1 from "../models/course";
import { GUIDRef } from "../interface/modelInterfaces";
import Result from "../models/result";
import { OneRosterApi } from "../services/api/OneRosterApi";
import User from "../models/user";
import { ServiceConfig } from "../services/ServiceConfig";
import i18n from "../i18n";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
import {
  DocumentReference,
  doc,
  getFirestore,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { Keyboard } from "@capacitor/keyboard";
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from "@capawesome/capacitor-app-update";
import { LocalNotifications } from "@capacitor/local-notifications";
import { RateApp } from "capacitor-rate-app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  Chapter,
  CollectionIds,
  StudentLessonResult,
} from "../common/courseConstants";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from "../services/RemoteConfig";
import { Router } from "react-router-dom";
import lesson from "../models/lesson";
import Lesson from "../models/lesson";

declare global {
  interface Window {
    cc: any;
    _CCSettings: any;
  }
}

export class Util {
  public static port: PortPlugin;

  public static convertCourses(_courses: Course1[]): Course1[] {
    let courses: Course1[] = [];
    _courses.forEach((course) => {
      course.chapters.forEach((chapter) => {
        chapter.lessons = this.convertDoc(chapter.lessons);
      });

      course.curriculum = Util.getRef(course.curriculum);
      course.grade = Util.getRef(course.grade);
      course.subject = Util.getRef(course.subject);
    });
    return _courses;
  }

  public static async getNextLessonFromGivenChapter(
    chapters,
    currentChapterId,
    currentLessonId,
    ChapterDetail
  ) {
    const api = ServiceConfig.getI().apiHandler;
    // let ChapterDetail: Chapter | undefined;
    const currentChapter = ChapterDetail;
    const currentStudentDocId: string = Util.getCurrentStudent()?.docId || "";

    console.log("currentChapter", currentChapter);

    if (!currentChapter) return undefined;
    let currentLessonIndex;

    currentChapter.lessons = Util.convertDoc(currentChapter.lessons);
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
        | { [lessonDocId: string]: StudentLessonResult }
        | undefined = {};
      const studentProfile = await api.getStudentResult(currentStudentDocId);
      studentResult = studentProfile?.lessons;

      if (!studentResult) return undefined;
      while (studentResult && studentResult[lessonId]) {
        currentLessonIndex += 1;
        nextLesson = currentChapter.lessons[currentLessonIndex + 1];
        lessonId = nextLesson.id;
      }
      const lessonObj = (await api.getLesson(nextLesson.id)) as lesson;
      console.log("lessonObj", lessonObj);
      if (lessonObj) {
        return lessonObj;
      }
    }

    const nextChapterIndex =
      chapters.findIndex((chapter) => chapter.id === currentChapterId) + 1;
    if (nextChapterIndex < chapters.length) {
      const nextChapter = chapters[nextChapterIndex];
      const firstLessonId = nextChapter.lessons[0];
      if (firstLessonId instanceof lesson) {
        return firstLessonId;
      }
      return undefined;
    }
  }

  public static convertDoc(refs: any[]): DocumentReference[] {
    const data: DocumentReference[] = [];
    for (let ref of refs) {
      const newCourseRef = Util.getRef(ref);

      data.push(newCourseRef);
    }
    return data;
  }

  public static getRef(ref): DocumentReference {
    const db = getFirestore();
    const newCourseRef = doc(
      db,
      ref["_key"].path.segments.at(-2),
      ref["_key"].path.segments.at(-1)
    );
    return newCourseRef;
  }

  public static getCurrentStudent(): User | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentStudent) return api.currentStudent;
    const temp = localStorage.getItem(CURRENT_STUDENT);

    if (!temp) return;
    const currentStudent = JSON.parse(temp) as User;

    if (!!currentStudent.users)
      currentStudent.users = Util.convertDoc(currentStudent.users);
    if (!!currentStudent.courses)
      currentStudent.courses = Util.convertDoc(currentStudent.courses);
    if (!!currentStudent.grade)
      currentStudent.grade = Util.getRef(currentStudent.grade);
    if (!!currentStudent.language)
      currentStudent.language = Util.getRef(currentStudent.language);
    if (!!currentStudent.board)
      currentStudent.board = Util.getRef(currentStudent.board);
    api.currentStudent = currentStudent;

    this.logCurrentPageEvents(currentStudent);
    return currentStudent;
  }
  public static getCurrentSound(): boolean {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (!!currUser?.soundFlag) return currUser.soundFlag;
    const currSound = localStorage.getItem(SOUND);
    if (!currSound) return true;
    console.log(currSound);
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateSoundFlag(
        currUser,
        currSound === "true" ? true : false
      );
    }
    return currSound === "true" ? true : false;
  }
  public static setCurrentSound = async (currSound: boolean) => {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateSoundFlag(currUser, currSound);
    }
    localStorage.setItem(SOUND, currSound.toString());
  };

  public static getCurrentMusic(): boolean {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (!!currUser?.musicFlag) return currUser.musicFlag;
    const currMusic = localStorage.getItem(MUSIC);
    if (!currMusic) return true;
    console.log(currMusic);
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateMusicFlag(
        currUser,
        currMusic === "true" ? true : false
      );
    }
    return currMusic === "true" ? true : false;
  }
  public static setCurrentMusic = async (currMusic: boolean) => {
    const auth = ServiceConfig.getI().authHandler;
    const currUser = auth.currentUser;
    if (currUser) {
      ServiceConfig.getI().apiHandler.updateMusicFlag(currUser, currMusic);
    }
    localStorage.setItem(MUSIC, currMusic.toString());
  };
  public static getGUIDRef(map: any): GUIDRef {
    return { href: map?.href, sourcedId: map?.sourcedId, type: map?.type };
  }

  public static storeLessonOrChaterIdToLocalStorage = (
    id: string | string[],
    lessonAndChapterIdStorageKey: string,
    typeOfId: "lesson" | "chapter"
  ) => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonAndChapterIdStorageKey) ||
        '{"lesson":[], "chapter":[]}'
    );

    const updatedItems = {
      lesson:
        typeOfId === "lesson"
          ? [...storedItems.lesson, ...(Array.isArray(id) ? id : [id])]
          : storedItems.lesson,
      chapter:
        typeOfId === "chapter"
          ? [...storedItems.chapter, ...(Array.isArray(id) ? id : [id])]
          : storedItems.chapter,
    };

    // Set the values outside the conditional statements
    if (typeOfId === "chapter") {
      updatedItems.lesson = storedItems.lesson;
    }

    localStorage.setItem(
      lessonAndChapterIdStorageKey,
      JSON.stringify(updatedItems)
    );
  };
  public static getStoredLessonAndChapterIds = () => {
    const storedItems = JSON.parse(
      localStorage.getItem(DOWNLOADED_LESSON_AND_CHAPTER_ID) ||
        JSON.stringify({ lesson: [], chapter: [] })
    );

    return storedItems;
  };
  public static isStored = (
    id: string,
    lessonAndChapterIdStorageKey: string
  ): boolean => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonAndChapterIdStorageKey) ||
        JSON.stringify({ lesson: [], chapter: [] })
    );

    const isLessonStored =
      // Array.isArray(storedItems.lesson) && storedItems.lesson.includes(id);
      storedItems.lesson.includes(id);

    const isChapterStored =
      // Array.isArray(storedItems.chapter) && storedItems.chapter.includes(id);
      storedItems.chapter.includes(id);

    return isLessonStored || isChapterStored;
  };

  public static removeLessonOrChapterIdFromLocalStorage = (
    id: string | string[],
    lessonAndChapterIdStorageKey: string
  ): void => {
    const storedItems = JSON.parse(
      localStorage.getItem(lessonAndChapterIdStorageKey) ||
        JSON.stringify({ lesson: [], chapter: [] })
    );

    let idsToRemove: string[];

    if (Array.isArray(id)) {
      idsToRemove = id;
    } else {
      idsToRemove = [id];
    }

    const updatedItems = {
      lesson: Array.isArray(storedItems.lesson)
        ? storedItems.lesson.filter(
            (lessonId: string) => !idsToRemove.includes(lessonId)
          )
        : [],
      chapter: Array.isArray(storedItems.chapter)
        ? storedItems.chapter.filter(
            (chapterId: string) => !idsToRemove.includes(chapterId)
          )
        : [],
    };

    localStorage.setItem(
      lessonAndChapterIdStorageKey,
      JSON.stringify(updatedItems)
    );
  };

  public static async downloadZipBundle(lessonIds: string[]): Promise<boolean> {
    for (let lessonId of lessonIds) {
      try {
        if (!Capacitor.isNativePlatform()) return true;
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
        console.log("cheching path..", "path", path);
        const res = await fetch(path);
        const isExists = res.ok;
        console.log("fethting path", path);
        console.log("isexists", isExists);
        if (isExists) continue;

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

        if (fetchingLocalBundle.ok) continue;

        console.log("fs", fs);
        const bundleZipUrls: string[] = await RemoteConfig.getJSON(
          REMOTE_CONFIG_KEYS.BUNDLE_ZIP_URLS
        );
        if (!bundleZipUrls || bundleZipUrls.length < 1) return false;
        let zip;
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
            this.storeLessonOrChaterIdToLocalStorage(
              lessonId,
              DOWNLOADED_LESSON_AND_CHAPTER_ID,
              "lesson"
            );

            if (!!zip && !!zip.data && zip.status === 200) break;
          } catch (error) {
            console.log(
              "🚀 ~ file: util.ts:216 ~ downloadZipBundle ~ error:",
              error
            );
          }
        }

        if (!zip || !zip.data || zip.status !== 200) return false;

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
          console.log("un  zip done");
          this.storeLessonOrChaterIdToLocalStorage(
            lessonId,
            DOWNLOADED_LESSON_AND_CHAPTER_ID,
            "lesson"
          );
        }
        console.log("zip ", zip);
      } catch (error) {
        console.log(
          "🚀 ~ file: util.ts:249 ~ downloadZipBundle ~ error:",
          error
        );
        return false;
      }
    }
    return true;
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
        this.removeLessonOrChapterIdFromLocalStorage(
          lessonId,
          DOWNLOADED_LESSON_AND_CHAPTER_ID
        );
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
    ) {
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

        const storedLessonAndChapterIdMap = JSON.parse(
          localStorage.getItem(CHAPTER_LESSON_MAP) ?? "null"
        );
        const downloadedLessonAndChapterId = JSON.parse(
          localStorage.getItem(DOWNLOADED_LESSON_AND_CHAPTER_ID) ?? "null"
        );

        const downloadedChapterId = downloadedLessonAndChapterId.chapter || [];

        for (const chapter of downloadedChapterId) {
          const lessonIds = storedLessonAndChapterIdMap[chapter] || [];
          if (!lessonIds) {
            const api = ServiceConfig.getI().apiHandler;
            const lessons = await api.getLessonsForChapter(chapter);
            const storedDataString = localStorage.getItem(CHAPTER_LESSON_MAP);
            const storedData = storedDataString
              ? JSON.parse(storedDataString)
              : {};
            storedData[chapter.id] = lessons.map((lesson) => lesson.id);
            localStorage.setItem(
              CHAPTER_LESSON_MAP,
              JSON.stringify(storedData)
            );
          }
          const downloadedLessonID = downloadedChapterId.lesson || [];
          const allElementsPresent = lessonIds.every((element) =>
            downloadedLessonID.includes(element)
          );
          if (!allElementsPresent) {
            await this.removeLessonOrChapterIdFromLocalStorage(
              chapter,
              DOWNLOADED_LESSON_AND_CHAPTER_ID
            );
          }
        }

        downloadedLessonAndChapterId.lesson = [];
        this.storeLessonOrChaterIdToLocalStorage(
          folderNamesArray,
          DOWNLOADED_LESSON_AND_CHAPTER_ID,
          "lesson"
        );

        lastRendered = new Date().getTime();
        localStorage.setItem(LAST_FUNCTION_CALL, lastRendered.toString());
      } catch (error) {
        console.error("Error listing folders:", error);
        return null;
      }
    }
    return lastRendered;
  }

  public static async updateChapterOrLessonDownloadStatus(
    lessonId: Lesson[] | undefined
  ): Promise<boolean> {
    if (lessonId) {
      const allIdsPresent = lessonId.every((e) =>
        this.isStored(e.id, DOWNLOADED_LESSON_AND_CHAPTER_ID)
      );
      if (!allIdsPresent) {
        const chaptersToRemove = lessonId.reduce((newArray, lesson) => {
          if (lesson.cocosChapterCode) {
            newArray.push(lesson.cocosChapterCode);
          }
          return newArray;
        }, [] as string[]);

        this.removeLessonOrChapterIdFromLocalStorage(
          chaptersToRemove,
          DOWNLOADED_LESSON_AND_CHAPTER_ID
        );
        return false;
      }
      const chaptersToStore = lessonId.reduce((newArray, lesson) => {
        if (lesson.cocosChapterCode) {
          newArray.push(lesson.cocosChapterCode);
        }
        return newArray;
      }, [] as string[]);

      this.storeLessonOrChaterIdToLocalStorage(
        chaptersToStore,
        DOWNLOADED_LESSON_AND_CHAPTER_ID,
        "chapter"
      );
      return true;
    }
    return false;
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
    lessonResultMap: { [key: string]: Result } = {}
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
    lessonResultMap: { [key: string]: Result } = {}
  ): number {
    let tempCurrentIndex = 0;
    for (let i = 0; i < lessons.length; i++) {
      if (lessonResultMap[lessons[i].id]) {
        tempCurrentIndex = i;
      }
    }
    return tempCurrentIndex;
  }

  public static async getPort(errorIndex = 0): Promise<number> {
    if (!Util.port) Util.port = registerPlugin<PortPlugin>("Port");
    try {
      const port = await Util.port.getPort();
      return port.port;
    } catch (error) {
      console.log(
        "🚀 ~ file: util.ts:218 ~ Util ~ getPort ~ error:",
        JSON.stringify(error),
        "errorIndex",
        errorIndex
      );
      if (errorIndex > 120) return 0;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await Util.getPort(++errorIndex);
    }
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
  public static async setUserProperties(currentUser: User) {
    try {
      await FirebaseAnalytics.setUserProperty({
        name: "parent user_id",
        value: currentUser.docId,
      });
      await FirebaseAnalytics.setUserProperty({
        name: "name",
        value: currentUser.name,
      });
      await FirebaseAnalytics.setUserProperty({
        name: "age",
        value: currentUser.age?.toLocaleString() || "",
      });
      await FirebaseAnalytics.setUserProperty({
        name: "gender",
        value: currentUser.gender?.toLocaleString() || "",
      });
      await FirebaseAnalytics.setUserProperty({
        name: "user_type",
        value: currentUser.role,
      });
      await FirebaseAnalytics.setUserProperty({
        name: "username",
        value: currentUser.username,
      });
    } catch (error) {
      console.log("Set User Properties Error ", error);
    }
  }

  public static async logCurrentPageEvents(user: User) {
    //Setting User Id in User Properites
    await FirebaseAnalytics.setUserId({
      userId: user.docId,
    });

    await Util.setUserProperties(user);

    //Setting Screen Name
    await FirebaseAnalytics.setScreenName({
      screenName: window.location.pathname,
      nameOverride: window.location.pathname,
    });
  }

  public static onAppStateChange = ({ isActive }) => {
    const url = new URL(window.location.toString());

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
        window.history.pushState(window.history.state, "", url.toString());
        window.location.reload();
      } else {
        url.searchParams.set("isReload", "true");
        url.searchParams.delete(CONTINUE);
        window.history.pushState(window.history.state, "", url.toString());
      }
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

  public static setCurrentStudent = async (
    student: User,
    languageCode: string | undefined = undefined,
    langFlag: boolean = true,
    isStudent: boolean = true
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentStudent = student;

    localStorage.setItem(
      CURRENT_STUDENT,
      JSON.stringify({
        age: student.age ?? null,
        avatar: student.avatar ?? null,
        board: student.board ?? null,
        courses: student.courses,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        gender: student.gender ?? null,
        grade: student.grade ?? null,
        image: student.image ?? null,
        language: student.language ?? null,
        name: student.name,
        role: student.role,
        uid: student.uid,
        username: student.username,
        users: student.users,
        docId: student.docId,
      })
    );

    if (!languageCode && !!student.language?.id) {
      const langDoc = await api.getLanguageWithId(student.language.id);
      if (langDoc) {
        languageCode = langDoc.code;
      }
    }
    const tempLangCode = languageCode ?? LANG.ENGLISH;
    if (!!langFlag) localStorage.setItem(LANGUAGE, tempLangCode);
    if (!!isStudent) await i18n.changeLanguage(tempLangCode);

    //Setting Student Id in User Properites
    await FirebaseAnalytics.setUserId({
      userId: student?.docId,
    });
    await Util.setUserProperties(student);
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
    currentUser: User
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const students: DocumentReference[] = currentUser.users;
    if (!students || students.length < 1) return;
    const api = ServiceConfig.getI().apiHandler;
    for (let studentRef of students) {
      if (!studentRef.id) continue;
      api.getStudentResult(studentRef.id).then((studentProfile) => {
        if (
          !!studentProfile &&
          !!studentProfile.classes &&
          studentProfile.classes.length > 0 &&
          studentProfile.classes.length === studentProfile.schools.length
        ) {
          for (let i = 0; i < studentProfile.classes.length; i++) {
            const classId = studentProfile.classes[i];
            const schoolId = studentProfile.schools[i];
            if (!this.isClassTokenSubscribed(classId))
              this.subscribeToClassTopic(classId, schoolId);
          }
        }
      });
    }
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

  public static async checkNotificationPermissions() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await FirebaseMessaging.addListener(
        "notificationReceived",
        async ({ notification }) => {
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
        "🚀 ~ file: util.ts:514 ~ checkNotificationPermissions ~ error:",
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
    const _db = getFirestore();
    if (navigator.onLine) {
      enableNetwork(_db);
    } else {
      disableNetwork(_db);
    }
    window.addEventListener("online", (e) => {
      console.log("🚀 ~ file: util.ts:677 ~ window.addEventListener ~ e:", e);
      enableNetwork(_db);
    });
    window.addEventListener("offline", (e) => {
      console.log("🚀 ~ file: util.ts:681 ~ window.addEventListener ~ e:", e);
      disableNetwork(_db);
    });
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
      if (res.migrated) {
        const _db = getFirestore();
        const newStudents: DocumentReference[] = res.studentIds.map(
          (studentId) => doc(_db, CollectionIds.USER, studentId)
        );
        await Filesystem.deleteFile({ path: filePath });
        localStorage.setItem(IS_MIGRATION_CHECKED, "true");
        return { migrated: true, newStudents: newStudents };
      }
    } catch (error) {
      console.log("🚀 ~ file: util.ts:707 ~ migrate ~ error:", error);
      return { migrated: false };
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
}
