import { IonContent, IonLoading, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  CURRENT_LESSON_LEVEL,
  EXAM,
  GAME_END,
  LESSON_END,
  PAGES,
  PRE_QUIZ,
  TEMP_LESSONS_STORE,
} from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import Curriculum from "../models/curriculum";
import { OneRosterApi } from "../services/OneRosterApi";
import { Util } from "../utility/util";
declare global {
  interface Window {
    launchGame: Function;
    killGame: Function;
  }
}

const CocosGame: React.FC = () => {
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  console.log("iFrameUrl", iFrameUrl);
  const [isLoading, setIsLoading] = useState<any>();
  const [present] = useIonToast();

  const presentToast = async () => {
    await present({
      message: "Something went wrong!",
      color: "danger",
      duration: 3000,
      position: "bottom",
      buttons: [
        {
          text: "Dismiss",
          role: "cancel",
        },
      ],
    });
  };

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setIsLoading(true);
    const lesson: Lesson = state.lesson;
    const lessonIds: string[] = [];
    if (lesson.type === EXAM && !lesson.id.endsWith(PRE_QUIZ)) {
      const lessonsInChapter = lesson.chapter.lessons;
      let foundLesson = false;
      for (let i = lessonsInChapter.length - 1; i >= 0; i--) {
        if (foundLesson) {
          if (lessonsInChapter[i].type === EXAM) break;
          lessonIds.push(lessonsInChapter[i].id);
        } else if (lessonsInChapter[i].id === lesson.id) {
          foundLesson = true;
        }
      }
    } else {
      lessonIds.push(lesson.id);
    }
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      history.replace(state.from ?? PAGES.HOME);
      return;
    }
    console.log("donwloaded ", dow);
    setIsLoading(false);
    // document.getElementById("iframe")?.focus();
    if (window.launchGame) window.launchGame();
    const push = (e: any) => {
      if (window.killGame) window.killGame();
      history.replace(state.from ?? PAGES.HOME);
    };

    //Just fot Testing
    const saveTempData = async (e: any) => {
      const json = localStorage.getItem(TEMP_LESSONS_STORE);
      let lessons: any = {};
      if (json) {
        lessons = JSON.parse(json);
      }
      lessons[e.detail.lessonId] = e.detail.score;
      localStorage.setItem(TEMP_LESSONS_STORE, JSON.stringify(lessons));

      const levelJson = localStorage.getItem(CURRENT_LESSON_LEVEL);
      let currentLessonLevel: any = {};
      if (levelJson) {
        currentLessonLevel = JSON.parse(levelJson);
      }
      currentLessonLevel[e.detail.courseName] = e.detail.lessonId;
      localStorage.setItem(
        CURRENT_LESSON_LEVEL,
        JSON.stringify(currentLessonLevel)
      );
      const apiInstance = OneRosterApi.getInstance();
      const tempClass = await apiInstance.getClassForUserForSubject(
        "user",
        e.detail.courseName
      );
      if (e.detail.lessonId.endsWith(PRE_QUIZ)) {
        const preQuiz = await apiInstance.updatePreQuiz(
          e.detail.courseName,
          tempClass?.sourcedId ?? "",
          "user",
          e.detail.preQuizChapterId ?? e.detail.chapterId,
          false
        );
        lessons[e.detail.lessonId] = preQuiz?.score;
        localStorage.setItem(TEMP_LESSONS_STORE, JSON.stringify(lessons));
        console.log("preQuiz after update", preQuiz);
      } else {
        const result = await apiInstance.putResult(
          "user",
          tempClass?.sourcedId ?? "",
          e.detail.lessonId,
          e.detail.score,
          e.detail.courseName
        );
        console.log("result ", result);
      }
      await Curriculum.i.clear();
    };

    document.body.addEventListener(LESSON_END, saveTempData, { once: true });
    document.body.addEventListener(GAME_END, push, { once: true });

    // let prevPercentage = 0;
    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <IonLoading
          cssClass="my-custom-class"
          isOpen={isLoading}
          message={"Please wait..."}
        />
        {/* {!isLoading ? (
          <iframe
            src={iFrameUrl}
            id="iframe"
            style={{ height: "100vh", width: "100vw" }}
            frameBorder="0"
          ></iframe>
        ) : null} */}
      </IonContent>
    </IonPage>
  );
};

export default CocosGame;
