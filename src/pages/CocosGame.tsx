import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  EVENTS,
  GAME_END,
  GAME_EXIT,
  LESSONS_PLAYED_COUNT,
  LESSON_END,
  PAGES,
  TableTypes,
} from "../common/constants";
import Loading from "../components/Loading";
import { Util } from "../utility/util";
import Lesson from "../models/lesson";
import {
  ASSIGNMENT_COMPLETED_IDS,
  Chapter,
  CocosLessonData,
} from "../common/courseConstants";
import { ServiceConfig } from "../services/ServiceConfig";
import ScoreCard from "../components/parent/ScoreCard";
import { t } from "i18next";
import { AvatarObj } from "../components/animation/Avatar";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
const CocosGame: React.FC = () => {
  const history = useHistory();
  const location = history.location.state as { from?: string, assignment?: any }; 
  // const playedFrom = location?.from?.split('/')[1].split('?')[0] 
  const playedFrom = localStorage.getItem("currentHeader")
  const assignmentType = location?.assignment?.type || 'self-played';
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  const [isLoading, setIsLoading] = useState<any>();
  const [present] = useIonToast();
  const [showDialogBox, setShowDialogBox] = useState(false);
  // let gameResult : any;
  const [gameResult, setGameResult] = useState<any>();
  const [isDeviceAwake, setDeviceAwake] = useState(false);
  const currentStudent = Util.getCurrentStudent();
  const courseDetail: TableTypes<"course"> = state.course
    ? JSON.parse(state.course)
    : undefined;
  const chapterDetail: TableTypes<"chapter"> = state.chapter
    ? JSON.parse(state.chapter)
    : undefined;
  const lessonDetail: TableTypes<"lesson"> = state.lesson
    ? JSON.parse(state.lesson)
    : undefined;
  let initialCount = Number(localStorage.getItem(LESSONS_PLAYED_COUNT)) || 0;
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
    Util.checkingIfGameCanvasAvailable();
    CapApp.addListener("appStateChange", handleAppStateChange);
    return () => {
      CapApp.removeAllListeners();
      CapApp.addListener("appStateChange", Util.onAppStateChange);
      CapApp.addListener("appUrlOpen", Util.onAppUrlOpen);
    };
  }, []);

  const handleAppStateChange = (state) => {
    if (state.isActive) {
      setDeviceAwake(true);
    } else {
      setDeviceAwake(false);
    }
  };
  const killGame = (e: any) => {
    document.body.removeEventListener(LESSON_END, handleLessonEndListner);
    setShowDialogBox(true);
    Util.killCocosGame();
    initialCount++;
    localStorage.setItem(LESSONS_PLAYED_COUNT, initialCount.toString());
  };

  const push = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPath: string = state?.from ?? PAGES.HOME;
    if (Capacitor.isNativePlatform()) {
      if (!!isDeviceAwake) {
        history.replace(fromPath + "&isReload=true");
        window.location.reload();
      } else {
        history.replace(fromPath + "&isReload=false");
        window.location.reload();
      }
      setIsLoading(false);
    } else {
      if (!!urlParams.get("isReload")) {
        if (fromPath.includes("?"))
          history.replace(fromPath + "&isReload=true");
        else history.replace(fromPath + "?isReload=true");
        window.location.reload();
      } else {
        history.replace(fromPath);
      }
    }
    setIsLoading(false);
  };

  const gameExit = async (e: any) => {
    const api = ServiceConfig.getI().apiHandler;
    const data = e.detail as CocosLessonData;

    Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent!.id,
      left_game_no: data.currentGameNumber,
      left_game_name: data.gameName,
      chapter_id: data.chapterId,
      chapter_name: chapterDetail?.name ?? "",
      lesson_id: data.lessonId,
      lesson_name: lessonDetail.name,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      course_name: courseDetail?.name ?? "",
      time_spent: data.timeSpent,
      total_moves: data.totalMoves,
      total_games: data.totalGames,
      correct_moves: data.correctMoves,
      wrong_moves: data.wrongMoves,
      game_score: data.gameScore,
      quiz_score: data.quizScore,
      game_completed: data.gameCompleted,
      quiz_completed: data.quizCompleted,
      game_time_spent: data.gameTimeSpent,
      quiz_time_spent: data.quizTimeSpent,
      played_from: playedFrom,
      assignment_type: assignmentType,
    });

    setTimeout(() => {
      killGame(e);
      document.body.removeEventListener(LESSON_END, handleLessonEndListner);
      setShowDialogBox(false);
      push();
    }, 100)

  };
  const handleLessonEndListner = (event) => {
    saveTempData(event.detail);
    setGameResult(event);
  };
  
  const updateLearningPath = async () => {
    if (!currentStudent) return;
    const learningPath = currentStudent.learning_path
      ? JSON.parse(currentStudent.learning_path)
      : null;

    if (!learningPath) return;

    try {
      const { courses } = learningPath;
      const currentCourse = courses.courseList[courses.currentCourseIndex];

      // Update currentIndex
      currentCourse.currentIndex += 1;

      // Check if currentIndex exceeds pathEndIndex
      if (currentCourse.currentIndex > currentCourse.pathEndIndex) {
        currentCourse.startIndex = currentCourse.currentIndex;
        currentCourse.pathEndIndex += 5;

        // Ensure pathEndIndex does not exceed the path length
        if (currentCourse.pathEndIndex > currentCourse.path.length) {
          currentCourse.pathEndIndex = currentCourse.path.length - 1;
        }

        // Move to the next course
        courses.currentCourseIndex += 1;
       
        await api.setStarsForStudents(currentStudent.id, 10);
        // Loop back to the first course if at the last course
        if (courses.currentCourseIndex >= courses.courseList.length) {
          courses.currentCourseIndex = 0;
        }
      }

      // Update the learning path in the database
    await api.updateLearningPath(currentStudent, JSON.stringify(learningPath));
      // Update the current student object
      const updatedStudent = await api.getUserByDocId(currentStudent.id);
      if (updatedStudent) {
        Util.setCurrentStudent(updatedStudent);
      }
    } catch (error) {
      console.error("Error updating learning path:", error);
    }
  };

  async function init() {
    const currentStudent = Util.getCurrentStudent();
    setIsLoading(true);
    const lessonId: string = state.lessonId;
    const lessonIds: string[] = [];
    lessonIds.push(lessonId);
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    setIsLoading(false);
    Util.launchCocosGame();

    //Just fot Testing

    // const onProblemEnd = async (e: any) => {
    //   push();
    // };

    document.body.addEventListener(LESSON_END, handleLessonEndListner, {
      once: true,
    });
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });

    // document.body.addEventListener("problemEnd", onProblemEnd);
  }
  const currentStudentDocId: string = Util.getCurrentStudent()?.id || "";

  let ChapterDetail: Chapter | undefined;
  const api = ServiceConfig.getI().apiHandler;
  const lesson: Lesson = JSON.parse(state.lesson);

  const updateLessonAsFavorite = async () => {
    const currentStudent = Util.getCurrentStudent();
    const lesson: Lesson = JSON.parse(state.lesson);
    if (currentStudent != null) {
      const result = await api.updateFavoriteLesson(
        currentStudent.id,
        lesson.id
      );
    }
  };

  const saveTempData = async (lessonData: CocosLessonData) => {
    const api = ServiceConfig.getI().apiHandler;
    const courseDocId: string | undefined = state.courseDocId;
    const lesson: Lesson = JSON.parse(state.lesson);
    const assignment = state.assignment;
    const currentStudent = api.currentStudent!;
    const data = lessonData;
    let assignmentId = assignment ? assignment.id : null;
    const isStudentLinked = await api.isStudentLinked(currentStudent.id);
    let classId;
    let schoolId;
    let chapter_id;
    if (isStudentLinked) {
      const studentResult = await api.getStudentClassesAndSchools(
        currentStudent.id
      );
      if (!!studentResult && studentResult.classes.length > 0) {
        classId = studentResult.classes[0].id;
        schoolId = studentResult.schools[0].id;
      }
      if (!assignmentId) {
        const result = await api.getPendingAssignmentForLesson(
          lesson.id,
          classId,
          currentStudent.id
        );
        if (result) {
          assignmentId = result?.id;
        }
      }
      chapter_id = await api.getChapterByLesson(lesson.id, classId);
    } else {
      chapter_id = await api.getChapterByLesson(
        lesson.id,
        undefined,
        currentStudent.id
      );
    }
    // Check if the game was played from `learning_pathway`
    const learning_path: string = state?.learning_path ?? false;

    let avatarObj = AvatarObj.getInstance();
    let finalProgressTimespent =
      avatarObj.weeklyTimeSpent["min"] * 60 + avatarObj.weeklyTimeSpent["sec"];
    finalProgressTimespent = finalProgressTimespent + data.timeSpent;
    let computeMinutes = Math.floor(finalProgressTimespent / 60);
    let computeSec = finalProgressTimespent % 60;
    avatarObj.weeklyTimeSpent["min"] = computeMinutes;
    avatarObj.weeklyTimeSpent["sec"] = computeSec;
    avatarObj.weeklyPlayedLesson++;
    const result = await api.updateResult(
      currentStudent.id,
      courseDocId,
      lesson.id,
      data.score!,
      data.correctMoves,
      data.wrongMoves,
      data.timeSpent,
      assignmentId,
      chapterDetail?.id ?? chapter_id?.toString() ?? undefined,
      classId,
      schoolId
    );
    // Check if the game was played from the `/home` URL and if the user is connected to a class, Update the learning path only if the conditions are met
    if (learning_path) {
      await updateLearningPath();
    }
    // if (!!lessonDetail.cocos_chapter_code) {
    //   let cChap = courseDetail.chapters.find(
    //     (chap) => lessonDetail.cocos_chapter_code === chap.id
    //   );
    //   if (cChap) {
    //     ChapterDetail = cChap;
    //   }
    //   let existing = new Map();
    //   let res: { [key: string]: string } = JSON.parse(
    //     localStorage.getItem(`${currentStudentDocId}-${RECOMMENDATIONS}`) ||
    //       "{}"
    //   );
    //   const finalLesson = await Util.getNextLessonFromGivenChapter(
    //     courseDetail.chapters,
    //     lessonData.chapterId,
    //     lesson.id,
    //     ChapterDetail
    //   );
    //   existing.set(courseDetail.courseCode, finalLesson?.id);
    //   for (let [key, value] of existing) {
    //     res[key] = value;
    //   }
    //   localStorage.setItem(
    //     `${currentStudentDocId}-${RECOMMENDATIONS}`,
    //     JSON.stringify(res)
    //   );
    // }
    Util.logEvent(EVENTS.LESSON_END, {
      user_id: currentStudent.id,
      // assignment_id: lesson.assignment?.id,
      chapter_id: data.chapterId,
      // chapter_name: ChapterDetail ? ChapterDetail.name : "",
      lesson_id: data.lessonId,
      // lesson_name: lesson.name,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      course_name: courseDetail.name,
      time_spent: data.timeSpent,
      total_moves: data.totalMoves,
      total_games: data.totalGames,
      correct_moves: data.correctMoves,
      wrong_moves: data.wrongMoves,
      game_score: data.gameScore,
      quiz_score: data.quizScore,
      game_completed: data.gameCompleted,
      quiz_completed: data.quizCompleted,
      game_time_spent: data.gameTimeSpent,
      quiz_time_spent: data.quizTimeSpent,
      score: data.score,
      played_from: playedFrom,
      assignment_type: assignmentType,
    });
    let tempAssignmentCompletedIds = localStorage.getItem(
      ASSIGNMENT_COMPLETED_IDS
    );
    let assignmentCompletedIds;
    if (!tempAssignmentCompletedIds) {
      assignmentCompletedIds = {};
    } else {
      assignmentCompletedIds = JSON.parse(tempAssignmentCompletedIds);
    }
    if (!assignmentCompletedIds[api.currentStudent?.id!]) {
      assignmentCompletedIds[api.currentStudent?.id!] = [];
    }
    // assignmentCompletedIds[api.currentStudent?.id!].push(lesson.assignment?.id);
    localStorage.setItem(
      ASSIGNMENT_COMPLETED_IDS,
      JSON.stringify(assignmentCompletedIds)
    );
  };

  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <Loading isLoading={isLoading} />
        {showDialogBox && (
          <div>
            <ScoreCard
              title={t("🎉Congratulations🎊")}
              score={gameResult.detail?.score ?? 0}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              yesText={t("Like the Game")}
              lessonName={lessonDetail.name ?? ""}
              noText={t("Continue Playing")}
              handleClose={(e: any) => {
                setShowDialogBox(true);
                //  saveTempData(gameResult.detail, undefined);
                // push();
              }}
              onYesButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                setIsLoading(true);
                await updateLessonAsFavorite();
                if (initialCount >= 5) {
                  Util.showInAppReview();
                  initialCount = 0;
                  localStorage.setItem(
                    LESSONS_PLAYED_COUNT,
                    initialCount.toString()
                  );
                }
                push();
              }}
              onContinueButtonClicked={async (e: any) => {
                setShowDialogBox(false);
                setIsLoading(true);
                // await saveTempData(gameResult.detail, undefined);
                push();
              }}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CocosGame;
