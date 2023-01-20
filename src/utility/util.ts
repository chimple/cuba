import { Http } from "@capacitor-community/http";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import createFilesystem from "capacitor-fs";
import { unzip } from "zip2";
import {
  BUNDLE_URL,
  COURSES,
  CURRENT_LESSON_LEVEL,
  PRE_QUIZ,
} from "../common/constants";
import { Chapter, Course, Lesson } from "../interface/curriculumInterfaces";
import { GUIDRef } from "../interface/modelInterfaces";
import { Result } from "../models/result";
import { OneRosterApi } from "../services/OneRosterApi";
declare global {
  interface Window {
    cc: any;
    _CCSettings: any;
  }
}

export class Util {
  public static getGUIDRef(map: any): GUIDRef {
    return { href: map?.href, sourcedId: map?.sourcedId, type: map?.type };
  }

  public static async downloadZipBundle(lessonIds: string[]): Promise<boolean> {
    for (let lessonId of lessonIds) {
      try {
        if (!Capacitor.isNativePlatform()) return true;
        console.log(
          "downloading Directory.Cache",
          Directory.Cache,
          "Directory.Library"
        );
        const fs = createFilesystem(Filesystem, {
          rootDir: "/",
          directory: Directory.Cache,
          base64Alway: false,
        });
        const path =
          (localStorage.getItem("gameUrl") ??
            "http://localhost/_capacitor_file_/data/user/0/org.chimple.cuba/cache/") +
          lessonId +
          "/index.js";
        console.log("cheching path..", "path", path);
        const res = await fetch(path);
        const isExists = res.ok;
        console.log("fethting path", path);
        console.log("isexists", isExists);
        if (isExists) continue;
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

  public static async getCurrentLessonIndex(
    subjectCode: string,
    lessons: Lesson[],
    chapters: Chapter[] = [],
    lessonResultMap: { [key: string]: Result } = {}
  ): Promise<number> {
    const currentLessonJson = localStorage.getItem(CURRENT_LESSON_LEVEL);
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
      let currentIndex = -1;
      if (Object.keys(lessonResultMap).length <= 0) return 0;
      for (let i = 0; i < lessons.length; i++) {
        if (lessonResultMap[lessons[i].id]) {
          currentIndex = i;
        }
      }
      return currentIndex;
    }
    const apiInstance = OneRosterApi.getInstance();
    const preQuiz = lessonResultMap[subjectCode + "_" + PRE_QUIZ];
    if (!preQuiz) return -1;
    const tempLevelChapter = await apiInstance.getChapterForPreQuizScore(
      subjectCode,
      preQuiz.score ?? 0,
      chapters
    );
    let tempCurrentIndex = 0;
    for (let i = 0; i < tempLevelChapter.lessons.length; i++) {
      if (lessonResultMap[tempLevelChapter.lessons[i].id]) {
        tempCurrentIndex = i;
      }
    }
    let currentIndex: number = lessons.findIndex(
      (lesson: any) =>
        lesson.id === tempLevelChapter.lessons[tempCurrentIndex].id
    );
    // currentIndex--;
    return currentIndex < 0 ? 0 : currentIndex;
  }
}
