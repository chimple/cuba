import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  CURRENT_LESSON_LEVEL,
  EXAM,
  GAME_END,
  GAME_EXIT,
  LESSON_END,
  PAGES,
  PRE_QUIZ,
  TEMP_LESSONS_STORE,
} from "../common/constants";
import Loading from "../components/Loading";
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

  const killGame = (e: any) => {
    if (window.killGame) window.killGame();
  };

  const push = () => {
    history.replace(state.from ?? PAGES.HOME);
  };

  const gameExit = (e: any) => {
    killGame(e);
    push();
  };
  
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
      push();
      return;
    }
    console.log("donwloaded ", dow);
    setIsLoading(false);
    // document.getElementById("iframe")?.focus();
    if (window.launchGame) window.launchGame();

    //Just fot Testing
    const saveTempData = async (e: any) => {
      setIsLoading(true);
      console.log("e", e);

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
        const levelChapter = await apiInstance.getChapterForPreQuizScore(
          e.detail.courseName,
          preQuiz?.score ?? 0,
          await Curriculum.i.allChapterForSubject(e.detail.courseName)
        );
        currentLessonLevel[e.detail.courseName] = levelChapter.lessons[0].id;
        localStorage.setItem(
          CURRENT_LESSON_LEVEL,
          JSON.stringify(currentLessonLevel)
        );
        Curriculum.i.clear();
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
      await Curriculum.i.unlockNextLesson(
        e.detail.courseName,
        e.detail.lessonId,
        e.detail.score
      );

      setIsLoading(false);
      push();
    };

    document.body.addEventListener(LESSON_END, saveTempData, { once: true });
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });

    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default CocosGame;
