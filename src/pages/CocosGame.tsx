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
  PREVIOUS_PLAYED_COURSE,
  PRE_QUIZ,
  TEMP_LESSONS_STORE,
} from "../common/constants";
import Loading from "../components/Loading";
import { Lesson } from "../interface/curriculumInterfaces";
import Auth from "../models/auth";
import CurriculumController from "../models/curriculumController";
import { Util } from "../utility/util";
import { OneRosterApi } from "../services/api/OneRosterApi";

const CocosGame: React.FC = () => {
  const history = useHistory();
  console.log("cocos game", history.location.state);
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  console.log("iFrameUrl", state?.url, iFrameUrl);
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
    // if (window.killGame) window.killGame();
    Util.killCocosGame();
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
          let lessonId =
            lessonsInChapter[i].chapter.course.isCourseMapped &&
            lessonsInChapter[i].orig_lesson_id != undefined
              ? lessonsInChapter[i].orig_lesson_id
              : lessonsInChapter[i].id;
          lessonIds.push(lessonId || "");
        } else if (lessonsInChapter[i].id === lesson.id) {
          foundLesson = true;
        }
      }
    } else {
      let lessonId =
        lesson.chapter.course.isCourseMapped &&
        lesson.orig_lesson_id != undefined
          ? lesson.orig_lesson_id
          : lesson.id;
      lessonIds.push(lessonId);
    }
    console.log("cocosGame page lessonIds", lessonIds);
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    console.log("donwloaded ", dow);
    setIsLoading(false);
    // document.getElementById("iframe")?.focus();
    // if (window.launchGame) window.launchGame();
    Util.launchCocosGame();

    //Just fot Testing
    const saveTempData = async (e: any) => {
      setIsLoading(true);
      console.log("Lesson progress ", e);
      let progressCourseId: string,
        progressChapterId: string,
        progressLessonId: string,
        progressScore: number,
        progressTimeSpent: string;
      if (
        lesson.chapter.course.isCourseMapped &&
        lesson.orig_course_id != undefined &&
        lesson.orig_chapter_id != undefined &&
        lesson.orig_lesson_id != undefined
      ) {
        progressCourseId = state.lesson.chapter.course.id;
        progressChapterId = state.lesson.chapter.id;
        progressLessonId = state.lesson.id;
        progressScore = e.detail.score;
        progressTimeSpent = e.detail.timeSpent;
        console.log(
          "Mapped lesson Progress ",
          progressCourseId,
          "  ",
          progressChapterId,
          "  ",
          progressLessonId,
          "  ",
          progressScore,
          "  ",
          progressTimeSpent
        );
      } else {
        progressCourseId = e.detail.courseName;
        progressChapterId = e.detail.chapterId;
        progressLessonId = e.detail.lessonId;
        progressScore = e.detail.score;
        progressTimeSpent = e.detail.timeSpent;
        console.log(
          "lesson Progress ",
          progressCourseId,
          "  ",
          progressChapterId,
          "  ",
          progressLessonId,
          "  ",
          progressScore,
          "  ",
          progressTimeSpent
        );
      }

      const json = localStorage.getItem(TEMP_LESSONS_STORE());
      let lessons: any = {};
      if (json) {
        lessons = JSON.parse(json);
      }
      lessons[progressLessonId] = progressScore;
      localStorage.setItem(TEMP_LESSONS_STORE(), JSON.stringify(lessons));
      localStorage.setItem(PREVIOUS_PLAYED_COURSE(), progressCourseId);
      const levelJson = localStorage.getItem(CURRENT_LESSON_LEVEL());
      let currentLessonLevel: any = {};
      if (levelJson) {
        currentLessonLevel = JSON.parse(levelJson);
      }
      currentLessonLevel[progressCourseId] = progressLessonId;
      localStorage.setItem(
        CURRENT_LESSON_LEVEL(),
        JSON.stringify(currentLessonLevel)
      );
      const apiInstance = OneRosterApi.getInstance();
      const tempClass = await apiInstance.getClassForUserForSubject(
        Auth.i.sourcedId,
        progressCourseId
      );
      if (progressLessonId.endsWith(PRE_QUIZ)) {
        const preQuiz = await apiInstance.updatePreQuiz(
          progressCourseId,
          tempClass?.docId ?? "",
          Auth.i.sourcedId,
          e.detail.preQuizChapterId ?? progressChapterId,
          false
        );
        const levelChapter = await apiInstance.getChapterForPreQuizScore(
          progressCourseId,
          preQuiz?.score ?? 0,
          await CurriculumController.i.allChapterForSubject(progressCourseId)
        );
        currentLessonLevel[progressCourseId] = levelChapter.lessons[0].id;
        localStorage.setItem(
          CURRENT_LESSON_LEVEL(),
          JSON.stringify(currentLessonLevel)
        );
        CurriculumController.i.clear();
        lessons[progressLessonId] = preQuiz?.score;
        localStorage.setItem(TEMP_LESSONS_STORE(), JSON.stringify(lessons));
        console.log("preQuiz after update", preQuiz);
      } else {
        const result = await apiInstance.putResult(
          Auth.i.sourcedId,
          tempClass?.docId ?? "",
          progressLessonId,
          progressScore,
          progressCourseId
        );
        console.log("result ", result);
      }
      await CurriculumController.i.unlockNextLesson(
        progressCourseId,
        progressLessonId,
        progressScore
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
