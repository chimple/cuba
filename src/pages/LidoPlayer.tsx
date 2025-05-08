import { FC, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import {
  EVENTS,
  LidoActivityChangeKey,
  LidoActivityEndKey,
  LidoGameCompletedKey,
  LidoLessonEndKey,
  LidoNextContainerKey,
  PAGES,
  TableTypes,
} from "../common/constants";
import Loading from "../components/Loading";
import { IonPage, useIonToast } from "@ionic/react";
import { Capacitor } from "@capacitor/core";
import { ServiceConfig } from "../services/ServiceConfig";
import { Lesson } from "../interface/curriculumInterfaces";
import { AvatarObj } from "../components/animation/Avatar";
import { ASSIGNMENT_COMPLETED_IDS } from "../common/courseConstants";

const LidoPlayer: FC = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const state = history.location.state as any;
  const playedFrom = localStorage.getItem("currentHeader")
  const assignmentType = state?.assignment?.type || 'self-played';
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [basePath, setBasePath] = useState<string>();
  const [xmlPath, setXmlPath] = useState<string>();

  const onNextContainer = (e: any) => {
    console.log("nextContainer", e.detail);
  };

  const gameCompleted = (e: any) => {
    console.log("gameCompleted", e.detail);
    push();
  };

  const push = () => {
    const fromPath: string = state?.from ?? PAGES.HOME;
    Util.setPathToBackButton(fromPath, history);
  };
  const onActivityEnd = (e: any) => {
    console.log("onActivityEnd", e.detail.score);
    // push();
  };
  const courseDetail: TableTypes<"course"> = state.course
    ? JSON.parse(state.course)
    : undefined;
  const chapterDetail: TableTypes<"chapter"> = state.chapter
    ? JSON.parse(state.chapter)
    : undefined;
  const onLessonEnd = async (e: any) => {
    console.log("onLessonEnd", e.detail.score);
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
    const result = await api.updateResult(
      currentStudent.id,
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
    console.log("🚀 ~ file: CocosGame.tsx:88 ~ saveTempData ~ result:", result);
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

  useEffect(() => {
    init();
    window.addEventListener(LidoNextContainerKey, onNextContainer);
    window.addEventListener(LidoGameCompletedKey, gameCompleted);
    window.addEventListener(LidoActivityChangeKey, onActivityEnd);
    window.addEventListener(LidoLessonEndKey, onLessonEnd);
    window.addEventListener(LidoActivityEndKey, (e: any) => {
      //   setCurrentIndex(e.detail.index);
    });
    return () => {
      window.removeEventListener(LidoNextContainerKey, onNextContainer);
      window.removeEventListener(LidoGameCompletedKey, gameCompleted);
      window.removeEventListener(LidoActivityChangeKey, onActivityEnd);
      window.removeEventListener(LidoLessonEndKey, onLessonEnd);
      window.removeEventListener(LidoActivityEndKey, (e: any) => {
        //   setCurrentIndex(e.detail.index);
      });
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
    const urlSearchParams = new URLSearchParams(window.location.search);
    const lessonId = urlSearchParams.get("lessonId") ?? state.lessonId;
    console.log("🚀 ~ init ~ lessonId:", lessonId);
    const lessonIds: string[] = [lessonId];
    console.log("cocosGame page lessonIds", lessonIds);
    const dow = await Util.downloadZipBundle(lessonIds);
    if (!dow) {
      presentToast();
      push();
      return;
    }
    console.log("download ", dow);
    if (Capacitor.isNativePlatform()) {
      const path = await Util.getLessonPath(lessonId);
      setBasePath(path);
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
      {(xmlPath || basePath) && (
        <lido-standalone xml-path={xmlPath} base-url={basePath} />
      )}
    </IonPage>
  );
};

export default LidoPlayer;
