import { FC, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import {
  EVENTS,
  LidoActivityChangeKey,
  LidoActivityEndKey,
  LidoGameCompletedKey,
  LidoGameExitKey,
  LidoLessonEndKey,
  LidoNextContainerKey,
  PAGES,
  REWARD_LESSON,
  TableTypes,
} from "../common/constants";
import Loading from "../components/Loading";
import ScoreCard from "../components/parent/ScoreCard";
import { IonPage, useIonToast } from "@ionic/react";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import { Lesson } from "../interface/curriculumInterfaces";
import { AvatarObj } from "../components/animation/Avatar";
import { ASSIGNMENT_COMPLETED_IDS } from "../common/courseConstants";
import { t } from "i18next";
import { App as CapApp } from "@capacitor/app";
import React from "react";

const LidoPlayer: FC = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const state = history.location.state as any;
  const playedFrom = localStorage.getItem("currentHeader");
  const assignmentType = state?.assignment?.type || "self-played";
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [basePath, setBasePath] = useState<string>();
  const [xmlPath, setXmlPath] = useState<string>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const urlSearchParams = new URLSearchParams(window.location.search);
  const lessonId = urlSearchParams.get("lessonId") ?? state.lessonId;

  const onNextContainer = (e: any) => {};

  const gameCompleted = (e: any) => {
    setShowDialogBox(true);
  };

  const push = () => {
    const fromPath: string = state?.from ?? PAGES.HOME;
    history.replace(fromPath);
    setIsLoading(false);
  };
  const onActivityEnd = (e: any) => {
    // push();
  };
  const courseDetail: TableTypes<"course"> = state.course
    ? JSON.parse(state.course)
    : undefined;
  const chapterDetail: TableTypes<"chapter"> = state.chapter
    ? JSON.parse(state.chapter)
    : undefined;
  const lessonDetail: TableTypes<"lesson"> = state.lesson
    ? JSON.parse(state.lesson)
    : undefined;

  const onLessonEnd = async (e: any) => {
    const lessonData = e.detail;

    const api = ServiceConfig.getI().apiHandler;
    const courseDocId: string | undefined = state.courseDocId;
    const lesson: Lesson = JSON.parse(state.lesson);
    const assignment = state.assignment;
    // const currentStudent = api.currentStudent;
    const currentStudent = Util.getCurrentStudent()!;
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
    let avatarObj = AvatarObj.getInstance();
    let finalProgressTimeSpent =
      avatarObj.weeklyTimeSpent["min"] * 60 + avatarObj.weeklyTimeSpent["sec"];
    finalProgressTimeSpent = finalProgressTimeSpent + data.timeSpent;
    let computeMinutes = Math.floor(finalProgressTimeSpent / 60);
    let computeSec = finalProgressTimeSpent % 60;
    avatarObj.weeklyTimeSpent["min"] = computeMinutes;
    avatarObj.weeklyTimeSpent["sec"] = computeSec;
    avatarObj.weeklyPlayedLesson++;
    setGameResult(data);
    // Check if the game was played from `learning_pathway`
    const learning_path: string = state?.learning_path ?? false;
    const is_homework: boolean = state?.isHomework ?? false; // Check for our new flag
    const homeworkIndex: number | undefined = state?.homeworkIndex; // 👈 ADD THIS

    const isReward: boolean = state?.reward ?? false;
    if (isReward === true) {
      sessionStorage.setItem(REWARD_LESSON, "true");
    }
    const result = await api.updateResult(
      currentStudent,
      courseDocId,
      lesson.id,
      Math.round(data.score ?? 0),
      data.correctMoves ?? 0,
      data.wrongMoves ?? 0,
      data.timeSpent ?? 0,
      assignmentId,
      chapterDetail?.id ?? chapter_id?.toString() ?? "",
      classId,
      schoolId
    );
    // Update the learning path
    if (learning_path) {
      await Util.updateLearningPath(currentStudent, isReward);
    } else if (is_homework) {
      // This handles our temporary homework path
      await Util.updateHomeworkPath(homeworkIndex);
    }
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
    localStorage.setItem(
      ASSIGNMENT_COMPLETED_IDS,
      JSON.stringify(assignmentCompletedIds)
    );
  };
  const onGameExit = (e: any) => {
    const api = ServiceConfig.getI().apiHandler;
    const data = e.detail;
    Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent!.id,
      // assignment_id: lessonDetail.assignment?.id,
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
    });
    push();
  };

  useEffect(() => {
    init();
    window.addEventListener(LidoGameExitKey, onGameExit);
    window.addEventListener(LidoNextContainerKey, onNextContainer);
    window.addEventListener(LidoGameCompletedKey, gameCompleted);
    window.addEventListener(LidoActivityChangeKey, onActivityEnd);
    window.addEventListener(LidoLessonEndKey, onLessonEnd);
    window.addEventListener(LidoActivityEndKey, (e: any) => {
      //   setCurrentIndex(e.detail.index);
    });
    return () => {
      window.removeEventListener(LidoGameExitKey, onGameExit);
      window.removeEventListener(LidoNextContainerKey, onNextContainer);
      window.removeEventListener(LidoGameCompletedKey, gameCompleted);
      window.removeEventListener(LidoActivityChangeKey, onActivityEnd);
      window.removeEventListener(LidoLessonEndKey, onLessonEnd);
      window.removeEventListener(LidoActivityEndKey, (e: any) => {});
    };
  }, []);

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

  async function init() {
    setIsLoading(true);
    setShowDialogBox(false);
    const urlSearchParams = new URLSearchParams(window.location.search);
    const lessonId = urlSearchParams.get("lessonId") ?? state.lessonId;
    const lessonIds: string[] = [lessonId];
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    if (Capacitor.isNativePlatform()) {
      const path = await Util.getLessonPath({ lessonId: lessonId });
      if (path) {
        setBasePath(path);
      } else {
        return;
      }
    } else {
      const path =
        "https://raw.githubusercontent.com/chimple/lido-player/refs/heads/main/src/components/root/assets/xmlData.xml";
      setXmlPath(path);
    }
    setIsLoading(false);
  }

  return (
    <IonPage>
      <Loading isLoading={isLoading} />
      {showDialogBox && (
        <ScoreCard
          // title={t("🎉Congratulations🎊")}
          score={Math.round(gameResult?.score ?? 0)}
          message={t("You Completed the Lesson:")}
          showDialogBox={showDialogBox}
          // yesText={t("Like the Game")}
          lessonName={lessonDetail?.name ?? ""}
          noText={t("Continue Playing")}
          handleClose={() => {
            setShowDialogBox(false);
          }}
          onContinueButtonClicked={() => {
            setShowDialogBox(false);
            setIsLoading(true);
            push();
          }}
        />
      )}
      {xmlPath || basePath
        ? React.createElement("lido-standalone", {
            "xml-path": xmlPath,
            "base-url": basePath,
          })
        : null}
    </IonPage>
  );
};

export default LidoPlayer;
