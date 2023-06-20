import { Http } from "@capacitor-community/http";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Toast } from "@capacitor/toast";
import createFilesystem from "capacitor-fs";
import { unzip } from "zip2";
import {
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
} from "../common/constants";
import { Chapter, Course, Lesson } from "../interface/curriculumInterfaces";
import { GUIDRef } from "../interface/modelInterfaces";
import Result from "../models/result";
import { OneRosterApi } from "../services/api/OneRosterApi";
import User from "../models/user";
import { ServiceConfig } from "../services/ServiceConfig";
import i18n from "../i18n";
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { DocumentReference } from "firebase/firestore";
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from "@capawesome/capacitor-app-update";

declare global {
  interface Window {
    cc: any;
    _CCSettings: any;
  }
}

export class Util {
  public static port: PortPlugin;

  public static getGUIDRef(map: any): GUIDRef {
    return { href: map?.href, sourcedId: map?.sourcedId, type: map?.type };
  }

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
            "http://localhost/_capacitor_file_/storage/emulated/0/Android/data/org.chimple.cuba/files/") +
          lessonId +
          "/index.js";
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
          "/index.js"
        );

        const fetchingLocalBundle = await fetch(
          "assets/" + lessonId + "/index.js"
        );
        console.log(
          "after local lesson Bundle fetch url:" +
          "assets/" +
          lessonId +
          "/index.js",
          fetchingLocalBundle.ok,
          fetchingLocalBundle.json,
          fetchingLocalBundle
        );

        if (fetchingLocalBundle.ok) continue;

        console.log("fs", fs);
        const url = BUNDLE_URL + lessonId + ".zip";
        const zip = await Http.get({ url: url, responseType: "blob" });
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
        }

        console.log("zip ", zip);
      } catch (error) {
        console.log("errpor", error);
        return false;
      }
    }
    return true;
  }

  // To parse this data:
  //   const course = Convert.toCourse(json);

  public static toCourse(json: string): Course {
    return JSON.parse(JSON.stringify(json));
  }

  public static courseToJson(value: Course): string {
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
    lessons: Lesson[],
    chapters: Chapter[] = [],
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
    lessons: Lesson[],
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

  public static onAppStateChange = ({ isActive }) => {
    if (
      Capacitor.isNativePlatform() &&
      isActive &&
      window.location.pathname !== PAGES.GAME &&
      window.location.pathname !== PAGES.LOGIN
    ) {
      window.location.reload();
    }
  };

  public static setCurrentStudent = async (
    student: User,
    languageCode: string | undefined = undefined
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentStudent = student;
    if (!languageCode && !!student.language?.id) {
      const langDoc = await api.getLanguageWithId(student.language.id);
      if (langDoc) {
        languageCode = langDoc.code;
      }
    }
    const tempLangCode = languageCode ?? LANG.ENGLISH;
    localStorage.setItem(LANGUAGE, tempLangCode);
    await i18n.changeLanguage(tempLangCode);
  };

  public static randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  public static async logEvent(
    eventName: EVENTS,
    params?: {
      [key: string]: any;
    }
  ) {
    await FirebaseAnalytics.logEvent({
      name: eventName,
      params: params,
    });
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

  public static async checkNotificationPermissions() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const canCheckPermission = Util.canCheckUpdate(LAST_PERMISSION_CHECKED);
      console.log(
        "🚀 ~ file: util.ts:513 ~ checkNotificationPermissions ~ canCheckPermission:",
        canCheckPermission
      );
      if (!canCheckPermission) return;
      const result = await FirebaseMessaging.checkPermissions();
      console.log(
        "🚀 ~ file: util.ts:509 ~ checkNotificationPermissions ~ result:",
        JSON.stringify(result)
      );
      if (result.receive === "granted") return;
      const permissionStatus = await FirebaseMessaging.requestPermissions();
      console.log(
        "🚀 ~ file: util.ts:512 ~ checkNotificationPermissions ~ permissionStatus:",
        JSON.stringify(permissionStatus)
      );
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
}

