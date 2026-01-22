import { FC, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import {
  ASSESSMENT_FAIL_KEY,
  EVENTS,
  HOMEWORK_PATHWAY,
  LIDO_SCORES_KEY,
  LidoActivityEndKey,
  LidoGameCompletedKey,
  LidoGameExitKey,
  LidoLessonEndKey,
  LidoNextContainerKey,
  PAGES,
  REWARD_LESSON,
  TableTypes,
  LIDO_COMMON_AUDIO_DIR,
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
import React from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { palUtil } from "../utility/palUtil";
import PopupManager from "../components/GenericPopUp/GenericPopUpManager";
import { useGrowthBook } from "@growthbook/growthbook-react";


const LidoPlayer: FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  // State
  const state = history.location.state as any;
  const urlSearchParams = new URLSearchParams(window.location.search);
  const lessonId = urlSearchParams.get("lessonId") ?? state?.lessonId;
  const assignmentType = state?.assignment?.type || "self-played";
  const playedFrom = localStorage.getItem("currentHeader");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [basePath, setBasePath] = useState<string>();
  const [xmlPath, setXmlPath] = useState<string>();
  const [commonAudioPath, setCommonAudioPath] = useState<string>();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const growthbook = useGrowthBook();

  // Data Objects
  // Ensure we handle String vs string here if needed, but usually these are safe if parsed from JSON
  const courseDocId: string | undefined = state?.courseDocId;
  const lesson: Lesson = state?.lesson
    ? JSON.parse(state.lesson)
    : ({} as Lesson);
  const isAssessmentLesson = state?.is_assessment;
  const assignment = state?.assessmentId;

  const courseDetail: TableTypes<"course"> = state?.course
    ? JSON.parse(state.course)
    : undefined;
  const chapterDetail: TableTypes<"chapter"> = state?.chapter
    ? JSON.parse(state.chapter)
    : undefined;
  const lessonDetail: TableTypes<"lesson"> = state?.lesson
    ? JSON.parse(state.lesson)
    : undefined;

  const api = ServiceConfig.getI().apiHandler;
  const currentStudent = Util.getCurrentStudent()!;
  const resultsRef = useRef<Record<number, 0 | 1>>({});
  const user_id = sessionStorage.getItem("AuthUser.id");
  console.log("Current User ID:", user_id);
  const contextRef = useRef({
    classId: undefined as string | undefined,
    schoolId: undefined as string | undefined,
    chapterId: undefined as string | undefined,
    isStudentLinked: false,
  });

  const onNextContainer = (e: any) => console.log("Next", e);
  const gameCompleted = (e: any) => {
    // setShowDialogBox(true);
    const popupConfig = growthbook?.getFeatureValue(
    "generic-pop-up",
    null
  );

  if (popupConfig) {
    PopupManager.onGameComplete(popupConfig);
  }
  };

  const push = () => {
    localStorage.removeItem(LIDO_SCORES_KEY);
    const fromPath: string = state?.from ?? PAGES.HOME;
    history.replace(fromPath, state);
    setIsLoading(false);
  };

  const processStoredResults = async (isAborted: boolean = false) => {
    // 1. Get Data
    try {
      const storedData = localStorage.getItem(LIDO_SCORES_KEY);
      if (!storedData) {
        console.warn("⚠️ No stored data found.");
        return;
      }

      const scoresMap: Record<string, any> = JSON.parse(storedData);
      const indices = Object.keys(scoresMap)
        .map(Number)
        .sort((a, b) => a - b);

      if (indices.length === 0) return;

      // 2. Fetch Metadata
      let dbMetaData: any = {};
      try {
        const lessonRow = await api.getLesson(lesson.id);
        dbMetaData = lessonRow?.metadata
          ? typeof lessonRow.metadata === "string"
            ? JSON.parse(lessonRow.metadata)
            : lessonRow.metadata
          : typeof lesson.metadata === "string"
            ? JSON.parse(lesson.metadata || "{}")
            : lesson.metadata || {};
      } catch (e) {
        console.error("Meta error", e);
      }
      // 4. Group Data (Average Score logic)
      const skillAggregator = new Map<
        string,
        {
          totalScore: number;
          count: number;
          resultsList: number[];
        }
      >();

      indices.forEach((index) => {
        const record = scoresMap[index];
        // Handle legacy number vs new object format
        const rawScore = typeof record === "object" ? record.score : record;
        const resultBin =
          typeof record === "object" ? record.result : rawScore >= 10 ? 1 : 0;

        const activityKey = index;
        const skillId = dbMetaData?.activity?.[activityKey]?.skill_id || "";

        if (skillId) {
          if (!skillAggregator.has(skillId)) {
            skillAggregator.set(skillId, {
              totalScore: 0,
              count: 0,
              resultsList: [],
            });
          }
          const group = skillAggregator.get(skillId)!;
          group.totalScore += rawScore || 0;
          group.count += 1;
          group.resultsList.push(resultBin);
        }
      });

      // 5. Execute API Calls
      for (const [skillId, group] of skillAggregator.entries()) {
        const averageScore = group.totalScore / group.count;
        const activitiesScoresStr = group.resultsList.join(",");
        let abilityUpdates: any = {};
        try {
          const skillData = await api.getSkillById(skillId);
          const currentOutcomeId = skillData?.outcome_id;
          const booleanOutcomes = group.resultsList.map((r) => r === 1);
          abilityUpdates = await palUtil.updateAndGetAbilities({
            studentId: currentStudent.id,
            courseId: courseDetail?.id ?? courseDocId ?? "",
            skillId: skillId,
            outcomes: booleanOutcomes,
          });
          if (!abilityUpdates.skill_id) abilityUpdates.skill_id = skillId;
          if (!abilityUpdates.outcome_id)
            abilityUpdates.outcome_id = currentOutcomeId;
        } catch (e) {
          console.error("PAL Error", e);
        }
        const isStudentLinked = await api.isStudentLinked(currentStudent.id);
        let classId;
        let schoolId;
        if (isStudentLinked) {
          const studentResult = await api.getStudentClassesAndSchools(
            currentStudent.id
          );
          if (!!studentResult && studentResult.classes.length > 0) {
            classId = studentResult.classes[0].id;
            schoolId = studentResult.schools[0].id;
          }
        }
        await api.updateResult(
          currentStudent,
          courseDocId,
          lesson.id,
          Math.round(averageScore),
          0,
          0,
          0, // Moves/Time placeholders
          assignment ?? null,
          null,
          classId,
          schoolId,
          false, // isImediateSync
          false, // isHomework
          abilityUpdates.skill_id,
          abilityUpdates.skill_ability,
          abilityUpdates.outcome_id,
          abilityUpdates.outcome_ability,
          abilityUpdates.competency_id,
          abilityUpdates.competency_ability,
          abilityUpdates.domain_id,
          abilityUpdates.domain_ability,
          abilityUpdates.subject_id,
          abilityUpdates.subject_ability,
          activitiesScoresStr
        );
      }
      Util.logEvent(EVENTS.RESULTS_SAVED, {
        user_id: currentStudent.id,
        lesson_id: lesson.id,
        course_id: courseDocId,
        is_assessment: isAssessmentLesson,
        is_aborted: isAborted,
      });

      const learning_path: boolean = state?.learning_path ?? false;
      const isReward: boolean = state?.reward ?? false;
      if (learning_path)
        await Util.updateLearningPath(
          currentStudent,
          isReward,
          isAborted,
          courseDocId,
          isAssessmentLesson
        );
      localStorage.removeItem(LIDO_SCORES_KEY);
    } catch (error) {
      console.error("❌ Failed to process lesson end", error);
      push();
    }
  };
  const exitLidoGame = async (isAborted: boolean = false) => {
    setIsLoading(true);
    Util.logEvent(
      isAborted ? EVENTS.ASSESSMENT_ABORTED : EVENTS.ASSESSMENT_COMPLETED,
      {
        user_id: currentStudent.id,
        lesson_id: lesson.id,
        course_id: courseDocId,
        is_assessment: isAssessmentLesson,
        played_from: playedFrom,
      }
    );
    await processStoredResults(isAborted);
    setShowDialogBox(true);
    setIsLoading(false);
  };

  const onActivityEnd = async (e: any) => {
    const { index, score } = e.detail;
    const isFail = score < 70;
    const binaryScore = isFail ? 0 : 1;
    const existingData = localStorage.getItem(LIDO_SCORES_KEY);
    const scoresMap = existingData ? JSON.parse(existingData) : {};

    scoresMap[index] = {
      score: score, // e.g. 100
      result: binaryScore, // e.g. 1
    };
    localStorage.setItem(LIDO_SCORES_KEY, JSON.stringify(scoresMap));
    // 3. Save to Ref (Strictly for Assessment Rules A/B logic)
    resultsRef.current[index] = binaryScore as 0 | 1;
    // 4. Check Rules
    const checkContinuousFails = (currIdx: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const checkIndex = currIdx - i;
        const res = resultsRef.current[checkIndex];
        if (res !== 0) {
          return false;
        }
      }
      return true;
    };
    if (isAssessmentLesson) {
      const previousLessonSkipped =
        localStorage.getItem(`${ASSESSMENT_FAIL_KEY}_${currentStudent.id}`) === "true";
      // Rule B: Abort
      if (previousLessonSkipped && checkContinuousFails(index, 2)) {
        localStorage.removeItem(`${ASSESSMENT_FAIL_KEY}_${currentStudent.id}`);
        const isAborted = true;
        await exitLidoGame(isAborted);
        return;
      }
      // Rule A: Skip
      if (checkContinuousFails(index, 4)) {
        localStorage.setItem(
          `${ASSESSMENT_FAIL_KEY}_${currentStudent.id}`,
          "true"
        );
        await exitLidoGame();
        return;
      }
    }
  };

  const onLessonEnd = async (e: any) => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent()!;
    try {
      const lessonData = e.detail;
      if (isAssessmentLesson) {
        localStorage.removeItem(
          `${ASSESSMENT_FAIL_KEY}_${currentStudent.id}`
        );
        await exitLidoGame();
        return;
      }
      const api = ServiceConfig.getI().apiHandler;
      const courseDocId: string | undefined = state.courseDocId;
      const lesson: Lesson = JSON.parse(state.lesson);
      const assignment = state.assignment;
      const skillId: string | undefined = state.skillId;
      // const currentStudent = api.currentStudent;
      const data = lessonData;
      let assignmentId = assignment ? assignment.id : null;
      const storedData = localStorage.getItem(LIDO_SCORES_KEY);

      let booleanOutcomes: boolean[] = [];
      let activitiesScoresStr = "";

      if (storedData) {
        const values = Object.values(JSON.parse(storedData));

        booleanOutcomes = values.map((item: any) => item?.result === 1);
        activitiesScoresStr = values
          .map((item: any) => item?.result ?? 0)
          .join(",");
      }

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
      const learning_path: boolean = state?.learning_path ?? false;
      const is_homework: boolean = state?.isHomework ?? false;
      const homeworkIndex: number | undefined = state?.homeworkIndex;
      // 🔹 PRE-CHECK: figure out *before* updating path if this is the last homework lesson
      let shouldGiveHomeworkBonus = false;
      if (is_homework) {
        try {
          const pathStr = localStorage.getItem(HOMEWORK_PATHWAY);
          if (!pathStr) {
            console.warn(
              "[Homework bonus pre-check] No HOMEWORK_PATHWAY in sessionStorage"
            );
          } else {
            const path = JSON.parse(pathStr) as {
              lessons?: any[];
              currentIndex?: number;
            };
            const lessonsLen = path.lessons?.length ?? 0;
            const isLastLessonInPath =
              lessonsLen > 0 &&
              typeof homeworkIndex === "number" &&
              homeworkIndex === lessonsLen - 1;
            if (isLastLessonInPath) {
              shouldGiveHomeworkBonus = true;
            }
          }
        } catch (err) {
          console.error(
            "[Homework bonus pre-check] Error while reading HOMEWORK_PATHWAY",
            err
          );
        }
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
      const isReward: boolean = state?.reward ?? false;
      if (isReward === true) {
        sessionStorage.setItem(REWARD_LESSON, "true");
      }

      const abilityUpdates = await palUtil.updateAndGetAbilities({
        studentId: currentStudent.id,
        courseId: courseDetail?.id ?? courseDocId ?? "",
        skillId: skillId ?? "",
        outcomes: booleanOutcomes,
      });

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
        schoolId,
        false, // isImediateSync
        false, // isHomework
        skillId,
        abilityUpdates.skill_ability,
        abilityUpdates.outcome_id,
        abilityUpdates.outcome_ability,
        abilityUpdates.competency_id,
        abilityUpdates.competency_ability,
        abilityUpdates.domain_id,
        abilityUpdates.domain_ability,
        abilityUpdates.subject_id,
        abilityUpdates.subject_ability,
        activitiesScoresStr
      );

      // Update the learning path
      if (learning_path) {
        await Util.updateLearningPath(currentStudent, isReward);
      } else if (is_homework && homeworkIndex !== undefined) {
        // This handles our temporary homework path
        Util.refreshHomeworkPathWithLatestAfterIndex(homeworkIndex); 
        await Util.updateHomeworkPath(homeworkIndex);
      }

      // ⭐ 2) Bonus +10 stars if this was the last lesson in pathway
      if (shouldGiveHomeworkBonus) {
        try {
          const student = Util.getCurrentStudent();
          if (student?.id) {
            const bonusStars = 10;
            const newLocalStars = Util.bumpLocalStarsForStudent(
              student.id,
              bonusStars,
              student.stars || 0
            );
            try {
              await api.updateStudentStars(student.id, newLocalStars);
            } catch (err) {
              console.warn(
                "[Homework bonus] Failed to sync +10 bonus to backend, keeping local only",
                err
              );
            }
            localStorage.removeItem(HOMEWORK_PATHWAY);
          }
        } catch (err) {
          console.error(
            "[Homework bonus] Failed to award homework completion bonus",
            err
          );
        }
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
      setShowDialogBox(true);
    } catch (error) {
      console.error("❌ Failed to process lesson end", error);
      localStorage.removeItem(LIDO_SCORES_KEY);
      push();
    }
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
    // localStorage.removeItem(LIDO_SCORES_KEY);
    init();
    window.addEventListener(LidoGameExitKey, onGameExit);
    window.addEventListener(LidoNextContainerKey, onNextContainer);
    window.addEventListener(LidoGameCompletedKey, gameCompleted);
    window.addEventListener(LidoLessonEndKey, onLessonEnd);
    window.addEventListener(LidoActivityEndKey, onActivityEnd);
    return () => {
      window.removeEventListener(LidoGameExitKey, onGameExit);
      window.removeEventListener(LidoNextContainerKey, onNextContainer);
      window.removeEventListener(LidoGameCompletedKey, gameCompleted);
      window.removeEventListener(LidoLessonEndKey, onLessonEnd);
      window.removeEventListener(LidoActivityEndKey, onActivityEnd);
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
    resultsRef.current = {};
    setIsLoading(true);
    setIsReady(false);
    setShowDialogBox(false);
    // --- CRITICAL FIX: Clear the global variable pollution ---
    // This ensures that when the new player starts, it doesn't see the 
    // path from the PREVIOUS student's language.
    if (typeof window !== "undefined") {
     (window as any).__LIDO_COMMON_AUDIO_PATH__ = undefined;
    }
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
      try {
        const student = Util.getCurrentStudent();
        if (student && student.language_id) {
          const audioPath = `${LIDO_COMMON_AUDIO_DIR}/${student.language_id}`;
          const commonAudioUri = await Filesystem.getUri({
            directory: Directory.Data,
            path: audioPath,
          });
          setCommonAudioPath(Capacitor.convertFileSrc(commonAudioUri.uri));
        } else {
          console.warn(
            "[LidoPlayer] Could not determine student language for common audio path."
          );
        }
      } catch (e) {
        console.error("Could not get common audio path", e);
      }
    } else {
      const path = "https://raw.githubusercontent.com/chimple/lido-player/refs/heads/main/src/components/root/assets/xmlData.xml";
      setXmlPath(path);
    }
    setIsLoading(false);
    setIsReady(true); // ONLY NOW allow the Web Component to mount

  }

  return (
    <IonPage>
      <Loading isLoading={isLoading} />
      {showDialogBox && (
        <ScoreCard
         score={
            lessonDetail?.plugin_type === "lido_assessment"
              ? 100
              : Math.round(gameResult?.score ?? 0)
          }
          message={ lessonDetail?.plugin_type === "lido_assessment"? t("Well Done!"): t("You Completed the Lesson:")}
          showDialogBox={showDialogBox}
          lessonName={lessonDetail?.name ?? ""}
          noText={t("Continue Playing")}
          handleClose={() => setShowDialogBox(false)}
          onContinueButtonClicked={() => {
            setShowDialogBox(false);
            setIsLoading(true);
            push();
          }}
        />
      )}
      {isReady && (xmlPath || basePath)
        ? React.createElement("lido-standalone", {
          "xml-path": xmlPath,
          "base-url": basePath,
          "code-folder-path": "/Lido-player-code-versions",
          "common-audio-path": commonAudioPath ?? "/Lido-CommonAudios",
        })
        : null}
    </IonPage>
  );
};

export default LidoPlayer;
