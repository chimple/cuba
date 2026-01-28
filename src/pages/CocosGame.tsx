import { IonContent, IonPage, useIonToast } from "@ionic/react";
import { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router";
import PopupManager from "../components/GenericPopUp/GenericPopUpManager";
import { useGrowthBook } from "@growthbook/growthbook-react";
import {
  EVENTS,
  GAME_END,
  GAME_EXIT,
  HOMEWORK_PATHWAY,
  LESSONS_PLAYED_COUNT,
  LESSON_END,
  PAGES,
  PROBLEM_END,
  REWARD_LEARNING_PATH,
  REWARD_LESSON,
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
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { palUtil } from "../utility/palUtil";

const CocosGame: React.FC = () => {
  const history = useHistory();
  const location = history.location.state as {
    from?: string;
    assignment?: any;
  };
  const growthbook = useGrowthBook();
  // const playedFrom = location?.from?.split('/')[1].split('?')[0]
  const playedFrom = localStorage.getItem("currentHeader");
  const assignmentType = location?.assignment?.type || "self-played";
  const state = history.location.state as any;
  const iFrameUrl = state?.url;
  const [isLoading, setIsLoading] = useState<any>();
  const [present] = useIonToast();
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [gameResult, setGameResult] = useState<any>();
  const [isDeviceAwake, setDeviceAwake] = useState(false);
  const [outcomes, setOutcomes] = useState<boolean[]>([]);
  const outcomesRef = useRef<boolean[]>([]);
  const prevCorrectMovesRef = useRef<number>(0);
  const prevWrongMovesRef = useRef<number>(0);
  const currentStudent = Util.getCurrentStudent();
  const savingPromiseRef = useRef<Promise<void> | null>(null);
  const courseDetail: TableTypes<"course"> = state.course
    ? JSON.parse(state.course)
    : undefined;
  const selectedLesson: Map<string, string> = state.selectedLesson ?? undefined;

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
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "landscape" });
    }
    CapApp.addListener("appStateChange", handleAppStateChange);
    return () => {
      CapApp.removeAllListeners();
      CapApp.addListener("appStateChange", Util.onAppStateChange);
      CapApp.addListener("appUrlOpen", Util.onAppUrlOpen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAppStateChange = (state: any) => {
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
        history.replace(fromPath + "&isReload=true", {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true,
        });
      } else {
        history.replace(fromPath + "&isReload=false", {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true,
        });
      }
      setIsLoading(false);
    } else {
      if (!!urlParams.get("isReload")) {
        if (fromPath.includes("?"))
          history.replace(fromPath + "&isReload=true", {
            course: courseDetail,
            lesson: lesson,
            chapterId: chapterDetail?.id,
            selectedLesson: selectedLesson,
            fromCocos: true,
          });
        else
          history.replace(fromPath + "?isReload=true", {
            course: courseDetail,
            lesson: lesson,
            chapterId: chapterDetail?.id,
            selectedLesson: selectedLesson,
            fromCocos: true,
          });
        window.location.reload();
      } else {
        history.replace(fromPath, {
          course: courseDetail,
          lesson: lesson,
          chapterId: chapterDetail?.id,
          selectedLesson: selectedLesson,
          fromCocos: true,
        });
      }
    }
    setIsLoading(false);
  };

  const gameExit = async (e: any) => {
    const api = ServiceConfig.getI().apiHandler;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const data = e.detail as CocosLessonData;

    await Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: api.currentStudent?.id ?? _currentUser?.id,
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
    }, 100);
  };

  const handleLessonEndListner = (event: any) => {
  savingPromiseRef.current = saveTempData(event.detail); // Store the promise
  setGameResult(event);
  const popupConfig = growthbook?.getFeatureValue(
    "generic-pop-up",
    null
  );

  if (popupConfig) {
    PopupManager.onGameComplete(popupConfig);
  }
};

  function handleProblemEnd(event: any) {
    const { correctMoves = 0, wrongMoves = 0 } = event?.detail || {};

    // Calculate delta (change since last activity)
    const deltaCorrect = correctMoves - prevCorrectMovesRef.current;
    const deltaWrong = wrongMoves - prevWrongMovesRef.current;

    // This activity is correct if more correct moves than wrong moves were added
    const newOutcome = deltaCorrect > deltaWrong;

    // Update previous values for next activity
    prevCorrectMovesRef.current = correctMoves;
    prevWrongMovesRef.current = wrongMoves;

    setOutcomes((prev) => [...prev, newOutcome]);
    outcomesRef.current = [...outcomesRef.current, newOutcome];
  }

  async function init() {
    // Reset outcomes and move counters for new lesson
    setOutcomes([]);
    outcomesRef.current = [];
    prevCorrectMovesRef.current = 0;
    prevWrongMovesRef.current = 0;

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

    document.body.addEventListener(LESSON_END, handleLessonEndListner, {
      once: true,
    });
    document.body.addEventListener(PROBLEM_END, handleProblemEnd);
    document.body.addEventListener(GAME_END, killGame, { once: true });
    document.body.addEventListener(GAME_EXIT, gameExit, { once: true });
  }

  const currentStudentDocId: string = Util.getCurrentStudent()?.id || "";

  let ChapterDetail: Chapter | undefined;
  const api = ServiceConfig.getI().apiHandler;
  const lesson: Lesson = JSON.parse(state.lesson);

  const updateLessonAsFavorite = async () => {
    const currentStudent = Util.getCurrentStudent();
    const lesson: Lesson = JSON.parse(state.lesson);
    if (currentStudent != null) {
      await api.updateFavoriteLesson(currentStudent.id, lesson.id);
    }
  };

  const saveTempData = async (lessonData: CocosLessonData) => {
    const api = ServiceConfig.getI().apiHandler;
    const courseDocId: string | undefined = state.courseDocId;
    const lesson: Lesson = JSON.parse(state.lesson);
    const assignment = state.assignment;
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) return;
    const data = lessonData;
    let assignmentId = assignment ? assignment.id : null;
    const isStudentLinked = await api.isStudentLinked(currentStudent.id);
    let classId;
    let schoolId;
    let chapter_id;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
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
    const isReward: boolean = state?.reward ?? false;

    if (isReward === true) {
      sessionStorage.setItem(REWARD_LESSON, "true");
    }

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

    let abilityUpdates: {
      skill_id?: string;
      skill_ability?: number;
      outcome_id?: string;
      outcome_ability?: number;
      competency_id?: string;
      competency_ability?: number;
      domain_id?: string;
      domain_ability?: number;
      subject_id?: string;
      subject_ability?: number;
    } = {};

    if (state?.skillId) {
      const courseIdForAbility = courseDetail?.id ?? courseDocId ?? "";
      abilityUpdates = await palUtil.updateAndGetAbilities({
        studentId: currentStudent.id,
        courseId: courseIdForAbility,
        skillId: state.skillId,
        outcomes: outcomesRef.current,
      });
    }

    // Calculate activities_scores from outcomes (1 for true/correct, 0 for false/incorrect)
    const activities_scores = outcomesRef.current.length > 0
      ? outcomesRef.current.map(outcome => outcome ? "1" : "0").join(",")
      : null;

    // Avatar / time spent updates
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
      currentStudent,
      courseDocId,
      lesson.id,
      data.score!,
      data.correctMoves,
      data.wrongMoves,
      data.timeSpent,
      assignmentId,
      chapterDetail?.id ?? chapter_id?.toString() ?? undefined,
      classId,
      schoolId,
      shouldGiveHomeworkBonus,
      is_homework,
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
      activities_scores ?? undefined,
      _currentUser?.id
    );

    // Update the learning path / homework path
    if (learning_path) {
      await Util.updateLearningPath(currentStudent, isReward);
    } else if (is_homework && homeworkIndex !== undefined) {
      await Util.refreshHomeworkPathWithLatestAfterIndex(homeworkIndex);  // NEW
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

    await Util.logEvent(EVENTS.LESSON_END, {
      user_id: currentStudent.id,
      chapter_id: data.chapterId,
      lesson_id: data.lessonId,
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      course_name: data.courseName,
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
  return (
    <IonPage id="cocos-game-page">
      <IonContent>
        <Loading isLoading={isLoading} />
        {showDialogBox && (
          <div>
            <ScoreCard
              score={gameResult?.detail?.score ?? 0}
              message={t("You Completed the Lesson:")}
              showDialogBox={showDialogBox}
              lessonName={lessonDetail?.name ?? ""}
              noText={t("Continue Playing")}
              handleClose={(e: any) => {
                setShowDialogBox(true);
              }}
              onContinueButtonClicked={async (e: any) => {
                setIsLoading(true);
                try {
                  if (savingPromiseRef.current) {
                    await savingPromiseRef.current;
                  }
                } catch (error) {
                  console.error("Error saving data", error);
                }
                setShowDialogBox(false);
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
