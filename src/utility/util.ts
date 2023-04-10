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
  HEADERLIST,
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

    if (courseId === HEADERLIST.ENGLISH) {
      return gradeMap[HEADERLIST.ENGLISH] === SL_GRADES.GRADE1
        ? COURSES.ENGLISH_G1
        : COURSES.ENGLISH_G2;
    } else if (courseId === HEADERLIST.MATHS) {
      return gradeMap[HEADERLIST.MATHS] === SL_GRADES.GRADE1
        ? COURSES.MATHS_G1
        : COURSES.MATHS_G2;
    } else {
      return courseId;
    }
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
      window.location.pathname !== PAGES.GAME
    ) {
      window.location.reload();
    }
  };
}
