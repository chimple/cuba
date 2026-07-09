import { FC, useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router';
import { Util } from '../utility/util';
import {
  ASSESSMENT_FAIL_KEY,
  BUNDLE_ZIP_URLS,
  EVENTS,
  HOMEWORK_PATHWAY,
  LIDO_SCORES_KEY,
  LidoActivityEndKey,
  LidoGameCompletedKey,
  LidoGameExitKey,
  LidoLessonEndKey,
  LidoNextContainerKey,
  CURRENT_MODE,
  MODES,
  PAGES,
  REWARD_LESSON,
  ACTIVATION_REWARD_FLOW_KEY,
  TableTypes,
  LIDO_COMMON_AUDIO_DIR,
  FAIL_STREAK_KEY,
  IS_REWARD_FEATURE_ON,
  RESULT_STATUS,
  SOURCE,
} from '../common/constants';
import Loading from '../components/Loading';
import ScoreCard from '../components/scorecards/ScoreCard';
import { IonPage, useIonToast } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '../utility/screenOrientation';
import { ServiceConfig } from '../services/ServiceConfig';
import { Lesson } from '../interface/curriculumInterfaces';
import { AvatarObj } from '../components/animation/Avatar';
import { ASSIGNMENT_COMPLETED_IDS } from '../common/courseConstants';
import { t } from 'i18next';
import React from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { palUtil } from '../utility/palUtil';
import PopupManager from '../components/GenericPopUp/GenericPopUpManager';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { registerBackButtonHandler } from '../common/backButtonRegistry';
import logger from '../utility/logger';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import {
  getBundleZipUrlsForEnv,
  REMOTE_CONFIG_KEYS,
} from '../services/RemoteConfig';

const HOMEWORK_REWARD_COMPLETED_INDEX_KEY = 'homework_reward_completed_index';
const PENDING_HOMEWORK_REWARD_TRANSITION_KEY =
  'pending_homework_reward_transition';
const LEARNING_PATH_ASSESSMENT_FINALIZATION_SETTLE_MS = 100;

const waitForLearningPathAssessmentFinalizationSettle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, LEARNING_PATH_ASSESSMENT_FINALIZATION_SETTLE_MS);
  });

type AbilityUpdates = Awaited<ReturnType<typeof palUtil.updateAndGetAbilities>>;

const getSourceFromState = (source: unknown): SOURCE | undefined =>
  Object.values(SOURCE).includes(source as SOURCE)
    ? (source as SOURCE)
    : undefined;

const resolveLessonZipUrl = async (
  zipBaseUrls: string[],
  lessonId: string,
): Promise<string | null> => {
  for (const baseUrl of Array.from(
    new Set(zipBaseUrls.map((zipUrl) => zipUrl.trim()).filter(Boolean)),
  )) {
    try {
      const zipUrl = new URL(
        `${lessonId}.zip`,
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      ).toString();
      logger.warn('[LidoPlayer] Trying ZIP URL', { lessonId, baseUrl, zipUrl });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(zipUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (response.ok) {
          logger.warn('[LidoPlayer] Using ZIP URL', {
            lessonId,
            baseUrl,
            zipUrl,
          });
          return zipUrl;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      logger.warn('[LidoPlayer] Invalid ZIP base URL skipped', {
        baseUrl,
        lessonId,
        error,
      });
    }
  }

  return null;
};

const LidoPlayer: FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  // State
  const state = history.location.state as any;
  const isActivationLesson = state?.isDefaultLesson === true;
  const source: SOURCE =
    getSourceFromState(state?.source) ??
    (state?.isHomework
      ? SOURCE.LEARNING_PATHWAY_HOMEWORK
      : state?.learning_path
        ? state?.is_assessment
          ? SOURCE.INITIAL_ASSESSMENT
          : SOURCE.LEARNING_PATHWAY_HOME_NO_PAL
        : SOURCE.SUBJECT_PAGE);
  const shouldShowDailyRewardProgressRow =
    localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';
  const shouldShowScoreCardProgressRows = [
    SOURCE.LEARNING_PATHWAY_HOMEWORK,
    SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
    SOURCE.LEARNING_PATHWAY_HOME_PAL,
    SOURCE.INITIAL_ASSESSMENT,
  ].includes(source);
  const urlSearchParams = new URLSearchParams(window.location.search);
  const lessonId = urlSearchParams.get('lessonid') ?? state?.lessonId;
  const assignmentType = state?.assignment?.type || 'self-played';
  const playedFrom = localStorage.getItem('currentHeader');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [basePath, setBasePath] = useState<string>();
  const [xmlPath, setXmlPath] = useState<string>();
  const [zipUrl, setZipUrl] = useState<string>();
  const [commonAudioPath, setCommonAudioPath] = useState<string>();
  const [playerLanguage, setPlayerLanguage] = useState<string>('en');
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [scoreCardProgressState, setScoreCardProgressState] = useState({
    isAborted: false,
    isFullPathwayTerminated: false,
  });
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

  const courseDetail: TableTypes<'course'> = state?.course
    ? JSON.parse(state.course)
    : undefined;
  const courseDetailWithPathFields = courseDetail as
    | (Partial<TableTypes<'course'>> & {
        course_id?: string | null;
        course_code?: string | null;
      })
    | undefined;
  const chapterDetail: TableTypes<'chapter'> = state?.chapter
    ? JSON.parse(state.chapter)
    : undefined;
  const lessonDetail: TableTypes<'lesson'> = state?.lesson
    ? JSON.parse(state.lesson)
    : undefined;

  const api = ServiceConfig.getI().apiHandler;
  const resultsRef = useRef<Record<number, 0 | 1>>({});
  const previousAssessmentSkippedRef = useRef<boolean | null>(null);
  const resultFinalizationStartedRef = useRef(false);
  const assessmentLessonEndSettlingRef = useRef(false);

  const contextRef = useRef({
    classId: undefined as string | undefined,
    schoolId: undefined as string | undefined,
    chapterId: undefined as string | undefined,
    isStudentLinked: false,
  });

  const isExitingRef = useRef(false);

  const getAssessmentProgressKey = () => {
    if (isAssessmentLesson && courseDetailWithPathFields?.subject_id) {
      const courseCode = (
        courseDetailWithPathFields.code ??
        courseDetailWithPathFields.course_code
      )
        ?.trim()
        ?.toLowerCase();
      const courseId =
        courseDetailWithPathFields.id ??
        courseDetailWithPathFields.course_id ??
        courseDocId;
      return courseCode
        ? `subject:${courseDetailWithPathFields.subject_id}:course:${courseCode}`
        : `subject:${courseDetailWithPathFields.subject_id}:course:${courseId}`;
    }
    return (
      courseDetailWithPathFields?.id ??
      courseDetailWithPathFields?.course_id ??
      courseDocId ??
      ''
    );
  };

  const resolveStudentContext = async (): Promise<{
    student: TableTypes<'user'> | undefined;
    studentId: string | undefined;
    userId: string | undefined;
  }> => {
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    let student = Util.getCurrentStudent();
    if (!student) {
      student = currentUser;
    }
    return {
      student,
      studentId: student?.id ?? currentUser?.id,
      userId: currentUser?.id,
    };
  };

  const resolveLidoPlayerLanguage = async (): Promise<string> => {
    const authCurrentUser = ServiceConfig.getI().authHandler.currentUser as
      | TableTypes<'user'>
      | undefined;
    const { student } = await resolveStudentContext();
    const languageId = student?.language_id ?? authCurrentUser?.language_id;

    if (!languageId) {
      return 'en';
    }

    try {
      const languageDoc = await api.getLanguageWithId(languageId);
      return languageDoc?.code ?? 'en';
    } catch (error) {
      logger.error('[LidoPlayer] Failed to resolve player language', error);
      return 'en';
    }
  };

  const resolvePreviousAssessmentSkipped = async (
    studentId: string,
  ): Promise<boolean> => {
    if (previousAssessmentSkippedRef.current !== null) {
      return previousAssessmentSkippedRef.current;
    }

    const courseKey = courseDetail?.id ?? courseDocId ?? '';
    if (!courseKey) {
      previousAssessmentSkippedRef.current = false;
      return false;
    }

    try {
      const hasPendingAbort = await api.hasPendingAbortedAssessment(
        studentId,
        courseKey,
      );
      previousAssessmentSkippedRef.current = hasPendingAbort;
      return hasPendingAbort;
    } catch (error) {
      logger.error(
        '[LidoPlayer] Failed to resolve previous assessment skip state',
        error,
      );
      previousAssessmentSkippedRef.current = false;
      return false;
    }
  };

  const getCoursePalContext = async (
    courseId: string,
  ): Promise<{
    subjectId?: string | null;
    hasFramework: boolean;
  }> => {
    if (!courseId) return { hasFramework: false };

    if (courseDetail?.id === courseId || !courseDetail?.id) {
      if (courseDetail?.subject_id || courseDetail?.framework_id) {
        return {
          subjectId: courseDetail.subject_id,
          hasFramework: !!courseDetail.framework_id,
        };
      }
    }

    try {
      const course = await api.getCourse(courseId);
      return {
        subjectId: course?.subject_id,
        hasFramework: !!course?.framework_id,
      };
    } catch (error) {
      logger.warn(
        '[LidoPlayer] Failed to resolve course PAL context before update',
        error,
      );
      return { hasFramework: false };
    }
  };

  const doesSkillBelongToCourseSubject = async (
    courseSubjectId: string | null | undefined,
    skillId: string | undefined,
  ): Promise<boolean> => {
    if (!courseSubjectId || !skillId) return false;

    try {
      const skillSubject = await api.getSubjectBySkillId(skillId);
      return skillSubject?.id === courseSubjectId;
    } catch (error) {
      logger.warn(
        '[LidoPlayer] Failed to verify skill subject before PAL update',
        error,
      );
      return false;
    }
  };

  type LidoEventDetail = Record<string, unknown> & {
    chapterId?: string;
    courseId?: string;
    correctMoves?: number | string;
    currentGameNumber?: number | null;
    finalScore?: number | null;
    gameCompleted?: boolean;
    gameName?: string | null;
    gameScore?: number | null;
    gameTimeSpent?: number | null;
    lessonId?: string;
    lessonSessionId?: string;
    lessonType?: string;
    mlClassId?: string | null;
    mlPartnerId?: string | null;
    mlStudentId?: string | null;
    quizCompleted?: boolean;
    quizScore?: number | null;
    quizTimeSpent?: number | null;
    rightMoves?: number | string;
    score?: number | null;
    timeSpentForActivity?: number | null;
    timeSpendForLesson?: number | null;
    totalGames?: number;
    totalMoves?: number;
    wrongMoves?: number | string;
  };

  type StoredLidoScore = {
    score: number;
    result: 0 | 1;
    correctMoves?: number;
    wrongMoves?: number;
    elapsedTime?: number;
    timeSpent?: number;
  };

  const parseNumericValue = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const getNormalizedMoveCounts = (detail: LidoEventDetail) => ({
    correctMoves:
      parseNumericValue(detail.correctMoves) ??
      parseNumericValue(detail.rightMoves) ??
      0,
    wrongMoves: parseNumericValue(detail.wrongMoves) ?? 0,
  });

  const getStoredLidoScores = (): StoredLidoScore[] => {
    const storedData = localStorage.getItem(LIDO_SCORES_KEY);
    if (!storedData) return [];

    const parsed = JSON.parse(storedData);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((record): StoredLidoScore => {
      const rawTimeSpent = parseNumericValue(record?.timeSpent) ?? 0;
      const rawElapsedTime = parseNumericValue(record?.elapsedTime);

      return {
        score: parseNumericValue(record?.score) ?? 0,
        result: record?.result === 1 ? 1 : 0,
        correctMoves: parseNumericValue(record?.correctMoves) ?? 0,
        wrongMoves: parseNumericValue(record?.wrongMoves) ?? 0,
        elapsedTime: rawElapsedTime ?? rawTimeSpent,
        timeSpent: rawTimeSpent,
      };
    });
  };

  const getTotalStoredLessonTime = (scoresList: StoredLidoScore[]): number =>
    scoresList.reduce((total, record) => total + (record.timeSpent ?? 0), 0);

  const shouldTerminateAssessmentPathway = async (
    studentId: string,
    courseKey: string,
  ): Promise<boolean> => {
    const failKey = `${ASSESSMENT_FAIL_KEY}_${studentId}`;
    const streakKey = `${FAIL_STREAK_KEY}_${studentId}`;
    const failMap: Record<string, boolean> = JSON.parse(
      localStorage.getItem(failKey) || '{}',
    );
    const streakMap: Record<string, number> = JSON.parse(
      localStorage.getItem(streakKey) || '{}',
    );
    const previousLessonSkipped =
      !!failMap[courseKey] ||
      (await resolvePreviousAssessmentSkipped(studentId));

    return previousLessonSkipped && (streakMap[courseKey] || 0) >= 2;
  };

  const getAssessmentFailStreak = (
    studentId: string,
    courseKey: string,
  ): number => {
    const streakKey = `${FAIL_STREAK_KEY}_${studentId}`;
    const streakMap: Record<string, number> = JSON.parse(
      localStorage.getItem(streakKey) || '{}',
    );

    return streakMap[courseKey] || 0;
  };

  const logUserActivationLessonEvent = ({
    detail,
    userId,
    studentId,
    lessonTimeSpent,
    correctMoves,
    wrongMoves,
    resultId,
    status,
  }: {
    detail: LidoEventDetail;
    userId?: string;
    studentId: string;
    lessonTimeSpent: number;
    correctMoves: number;
    wrongMoves: number;
    resultId?: string | null;
    status: 'completed' | 'incomplete';
  }) => {
    if (!isActivationLesson) {
      return;
    }

    Util.logEvent(EVENTS.USER_ACTIVATION_LESSON, {
      user_id: userId,
      student_id: studentId,
      result_id: resultId ?? null,
      chapter_id: detail.chapterId,
      chapter_name: chapterDetail?.name ?? '',
      lesson_id: detail.lessonId,
      lesson_name: lessonDetail?.name ?? lesson?.name ?? '',
      lesson_type: detail.lessonType,
      lesson_session_id: detail.lessonSessionId,
      ml_partner_id: detail.mlPartnerId,
      ml_class_id: detail.mlClassId,
      ml_student_id: detail.mlStudentId,
      course_id: detail.courseId,
      course_name: courseDetail?.name ?? '',
      time_spent: lessonTimeSpent,
      total_moves: detail.totalMoves,
      total_games: detail.totalGames,
      correct_moves: correctMoves,
      wrong_moves: wrongMoves,
      game_score: detail.gameScore,
      quiz_score: detail.quizScore,
      game_completed: detail.gameCompleted,
      quiz_completed: detail.quizCompleted,
      game_time_spent: detail.gameTimeSpent,
      quiz_time_spent: detail.quizTimeSpent,
      score: detail.finalScore,
      played_from: playedFrom,
      assignment_type: assignmentType,
      source,
      status,
    });
  };

  const onNextContainer = (e: any) => logger.info('Next', e);
  const gameCompleted = () => {
    const popupConfig = growthbook?.getFeatureValue('generic-pop-up', null);

    if (popupConfig) {
      PopupManager.onGameComplete(popupConfig);
    }
  };

  const push = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    localStorage.removeItem(LIDO_SCORES_KEY);
    const urlParams = new URLSearchParams(window.location.search);
    const fromPath: string = state?.from ?? PAGES.HOME;
    const returnState = {
      ...(state?.returnState ?? state),
      fromLido: true,
    };
    let targetPath = fromPath;
    if (Capacitor.isNativePlatform() || !!urlParams.get('isReload')) {
      const separator = fromPath.includes('?') ? '&' : '?';
      targetPath = `${fromPath}${separator}isReload=true`;
    }

    history.replace(targetPath, returnState);
    setIsLoading(false);
    setTimeout(() => {
      isExitingRef.current = false;
    }, 300);
  };

  const processStoredResults = async (
    isAborted: boolean = false,
    isFullPathwayTerminated: boolean = false,
  ) => {
    try {
      const scoresList = getStoredLidoScores();
      const {
        student: currentStudent,
        studentId,
        userId,
      } = await resolveStudentContext();
      if (scoresList.length === 0) {
        logger.warn('⚠️ No stored data found.');
        return;
      }
      if (!currentStudent || !studentId) {
        throw new Error('[LidoPlayer] Student context missing');
      }
      const parentUserId = userId;
      const totalLessonTime = getTotalStoredLessonTime(scoresList);
      let dbMetaData: any = {};
      try {
        const lessonRow = await api.getLesson(lesson.id);
        dbMetaData = lessonRow?.metadata
          ? typeof lessonRow.metadata === 'string'
            ? JSON.parse(lessonRow.metadata)
            : lessonRow.metadata
          : typeof lesson.metadata === 'string'
            ? JSON.parse(lesson.metadata || '{}')
            : lesson.metadata || {};
      } catch (e) {
        logger.error('Meta error', e);
      }
      const activitiesMeta = dbMetaData?.activity || {};
      const skillAggregator = new Map<
        string,
        {
          totalScore: number;
          count: number;
          resultsList: number[];
          correctMoves: number;
          wrongMoves: number;
          totalTimeSpent: number;
        }
      >();

      scoresList.forEach((record, idx) => {
        if (!record) return;

        const rawScore = record.score;
        const resultBin = record.result;

        // 🔑 Skill resolved by ARRAY POSITION
        const activityMeta = activitiesMeta[idx];
        const skillId =
          typeof activityMeta?.skill_id === 'string'
            ? activityMeta.skill_id.trim()
            : '';

        if (!skillId) return;

        if (!skillAggregator.has(skillId)) {
          skillAggregator.set(skillId, {
            totalScore: 0,
            count: 0,
            resultsList: [],
            correctMoves: 0,
            wrongMoves: 0,
            totalTimeSpent: 0,
          });
        }
        const group = skillAggregator.get(skillId)!;
        group.totalScore += rawScore || 0;
        group.count += 1;
        group.resultsList.push(resultBin);
        group.correctMoves += record.correctMoves ?? 0;
        group.wrongMoves += record.wrongMoves ?? 0;
        group.totalTimeSpent += record.timeSpent ?? 0;
      });
      const learning_path: boolean = state?.learning_path ?? false;
      const is_homework: boolean = state?.isHomework ?? false;
      const isReward: boolean = state?.reward ?? false;
      const isDefaultLesson: boolean = state?.isDefaultLesson ?? false;

      const shouldGiveDailyReward =
        isReward ||
        ((learning_path || is_homework || isDefaultLesson) &&
          (await Util.shouldGiveDailyReward()));

      if (isAssessmentLesson && shouldGiveDailyReward) {
        sessionStorage.setItem(REWARD_LESSON, 'true');
      }

      for (const [skillId, group] of skillAggregator.entries()) {
        const averageScore = group.totalScore / group.count;
        const activitiesScoresStr = group.resultsList.join(',');

        let abilityUpdates: Partial<AbilityUpdates> = {};
        let courseSubjectIdForResult: string | undefined =
          courseDetail?.subject_id ?? undefined;
        try {
          const currentCourseId = courseDetail?.id ?? courseDocId ?? '';
          const {
            subjectId: courseSubjectId,
            hasFramework: courseHasFramework,
          } = await getCoursePalContext(currentCourseId);
          courseSubjectIdForResult =
            courseSubjectId ?? courseSubjectIdForResult;
          const skillData = await api.getSkillById(skillId);
          const currentOutcomeId = skillData?.outcome_id;
          const canUpdateAbility =
            courseHasFramework &&
            (await doesSkillBelongToCourseSubject(courseSubjectId, skillId));

          if (canUpdateAbility) {
            const booleanOutcomes = group.resultsList.map((r) => r === 1);

            abilityUpdates = await palUtil.updateAndGetAbilities({
              studentId,
              courseId: currentCourseId,
              skillId,
              outcomes: booleanOutcomes,
            });

            if (!abilityUpdates.skill_id) abilityUpdates.skill_id = skillId;
            if (!abilityUpdates.outcome_id)
              abilityUpdates.outcome_id = currentOutcomeId;
          }
        } catch (e) {
          logger.error('PAL Error', e);
        }

        const isStudentLinked = await api.isStudentLinked(studentId);
        let classId;
        let schoolId;

        if (isStudentLinked) {
          const studentResult =
            await api.getStudentClassesAndSchools(studentId);
          if (studentResult?.classes?.length) {
            classId = studentResult.classes[0].id;
            schoolId = studentResult.schools[0].id;
          }
        }

        await api.updateResult(
          currentStudent,
          courseDetail?.id ?? courseDocId ?? '',
          lesson.id,
          Math.round(averageScore),
          group.correctMoves,
          group.wrongMoves,
          group.totalTimeSpent,
          assignment ?? null,
          null,
          classId,
          schoolId,
          false,
          false,
          abilityUpdates.skill_id,
          abilityUpdates.skill_ability,
          abilityUpdates.outcome_id,
          abilityUpdates.outcome_ability,
          abilityUpdates.competency_id,
          abilityUpdates.competency_ability,
          abilityUpdates.domain_id,
          abilityUpdates.domain_ability,
          isAssessmentLesson
            ? (abilityUpdates.subject_id ?? courseSubjectIdForResult)
            : abilityUpdates.subject_id,
          abilityUpdates.subject_ability,
          activitiesScoresStr,
          parentUserId,
          isAborted && isFullPathwayTerminated
            ? RESULT_STATUS.ASSESSMENT_TERMINATED
            : isAborted
              ? RESULT_STATUS.SYSTEM_EXIT
              : RESULT_STATUS.COMPLETED,
          source,
        );
      }

      Util.logEvent(EVENTS.RESULTS_SAVED, {
        user_id: parentUserId,
        student_id: studentId,
        lesson_id: lesson.id,
        course_id: courseDetail?.id ?? courseDocId ?? '',
        is_assessment: isAssessmentLesson,
        is_aborted: isAborted,
      });
      if (isAssessmentLesson) {
        Util.logEvent(EVENTS.ASSESSMENT_COMPLETED, {
          user_id: parentUserId,
          student_id: studentId,
          lesson_id: lesson.id,
          course_id: courseDetail?.id ?? courseDocId ?? '',
          is_assessment: true,
          played_from: playedFrom,
          time_spent: totalLessonTime, // ✅ correct total
        });
      }

      if (learning_path) {
        await Util.updateLearningPath(
          currentStudent,
          isReward,
          isFullPathwayTerminated,
          courseDetail?.id ?? courseDocId ?? '',
          isAssessmentLesson,
        );
      }
      localStorage.removeItem(LIDO_SCORES_KEY);
    } catch (error) {
      logger.error('❌ Failed to process lesson end', error);
      push();
    }
  };

  const exitLidoGame = async (
    isAborted: boolean = false,
    isFullPathwayTerminated: boolean = false,
  ) => {
    if (resultFinalizationStartedRef.current) return;
    resultFinalizationStartedRef.current = true;
    setIsLoading(true);
    await processStoredResults(isAborted, isFullPathwayTerminated);
    setScoreCardProgressState({ isAborted, isFullPathwayTerminated });
    setShowDialogBox(true);
    setIsLoading(false);
  };

  const onActivityEnd = async (e: any) => {
    const { studentId, userId } = await resolveStudentContext();
    const detail = (e.detail ?? {}) as LidoEventDetail;
    const score = detail.score ?? 0;
    const timeSpentForActivity =
      parseNumericValue(detail.timeSpentForActivity) ?? 0;
    const { correctMoves, wrongMoves } = getNormalizedMoveCounts(detail);
    const isFail = score < 70;
    const binaryScore: 0 | 1 = isFail ? 0 : 1;
    const scoresList = getStoredLidoScores();
    scoresList.push({
      score,
      result: binaryScore,
      correctMoves,
      wrongMoves,
      elapsedTime: timeSpentForActivity,
      timeSpent: timeSpentForActivity,
    });
    localStorage.setItem(LIDO_SCORES_KEY, JSON.stringify(scoresList));
    if (!studentId) return;
    const parentUserId = userId;
    if (isAssessmentLesson) {
      const assessmentKey = `assessment_star_state_${studentId}_${lesson.id}`;
      if (sessionStorage.getItem(assessmentKey) !== 'true') {
        sessionStorage.setItem(assessmentKey, 'false'); // not yet awarded
      }
    }
    if (!isAssessmentLesson) return;
    const courseKey = getAssessmentProgressKey();
    const failKey = `${ASSESSMENT_FAIL_KEY}_${studentId}`;
    const streakKey = `${FAIL_STREAK_KEY}_${studentId}`;
    const failMap: Record<string, boolean> = JSON.parse(
      localStorage.getItem(failKey) || '{}',
    );
    const streakMap: Record<string, number> = JSON.parse(
      localStorage.getItem(streakKey) || '{}',
    );
    let failStreak = streakMap[courseKey] || 0;
    /* ✅ Correct answer → reset streak */
    if (!isFail) {
      streakMap[courseKey] = 0;
      localStorage.setItem(streakKey, JSON.stringify(streakMap));
      return;
    }
    failStreak += 1;
    streakMap[courseKey] = failStreak;
    localStorage.setItem(streakKey, JSON.stringify(streakMap));
    const previousLessonSkipped = await shouldTerminateAssessmentPathway(
      studentId,
      courseKey,
    );
    if (resultFinalizationStartedRef.current) return;
    if (previousLessonSkipped) {
      const courseKey = getAssessmentProgressKey();
      Util.removeCourseScopedKey(FAIL_STREAK_KEY, studentId, courseKey);
      Util.removeCourseScopedKey(ASSESSMENT_FAIL_KEY, studentId, courseKey);
      const isAborted = true;
      const isFullPathwayTerminated = true;
      await exitLidoGame(isAborted, isFullPathwayTerminated); // aborted + full pathway terminated
      Util.logEvent(EVENTS.ASSESSMENT_TERMINATED, {
        user_id: parentUserId,
        student_id: studentId,
        lesson_id: lesson.id,
        course_id: courseDocId,
        is_assessment: isAssessmentLesson,
        played_from: playedFrom,
      }); // aborted
      return;
    }
    if (failStreak >= 4) {
      failMap[courseKey] = true;
      localStorage.setItem(failKey, JSON.stringify(failMap));
      streakMap[courseKey] = 0;
      localStorage.setItem(streakKey, JSON.stringify(streakMap));
      Util.logEvent(EVENTS.ASSESSMENT_ABORTED, {
        user_id: parentUserId,
        student_id: studentId,
        lesson_id: lesson.id,
        course_id: courseDocId,
        is_assessment: isAssessmentLesson,
        played_from: playedFrom,
      }); // aborted
      const isAborted = true;
      await exitLidoGame(isAborted); // skipped
    }
  };

  const onLessonEnd = async (e: any) => {
    if (resultFinalizationStartedRef.current) return;
    const isLearningPathAssessment = isAssessmentLesson && state?.learning_path;
    if (!isLearningPathAssessment) {
      resultFinalizationStartedRef.current = true;
      setIsLoading(true);
    }
    const lessonData = (e?.detail ?? {}) as LidoEventDetail;
    const {
      student: currentStudent,
      studentId,
      userId,
    } = await resolveStudentContext();
    try {
      if (!currentStudent?.id || !studentId) {
        throw new Error(
          '[LidoPlayer] currentStudent missing while saving lesson result',
        );
      }
      const parentUserId = userId;
      const courseDocId: string | undefined = state.courseDocId;
      const { correctMoves, wrongMoves } = getNormalizedMoveCounts(lessonData);
      if (isAssessmentLesson) {
        if (isLearningPathAssessment) {
          if (assessmentLessonEndSettlingRef.current) return;
          assessmentLessonEndSettlingRef.current = true;
          await waitForLearningPathAssessmentFinalizationSettle();
          assessmentLessonEndSettlingRef.current = false;
          if (resultFinalizationStartedRef.current) return;
          resultFinalizationStartedRef.current = true;
          setIsLoading(true);
        }
        const courseKey = getAssessmentProgressKey();
        const isFullPathwayTerminated = await shouldTerminateAssessmentPathway(
          studentId,
          courseKey,
        );
        const isAssessmentSystemExit =
          !isFullPathwayTerminated &&
          getAssessmentFailStreak(studentId, courseKey) >= 4;
        Util.removeCourseScopedKey(FAIL_STREAK_KEY, studentId, courseKey);
        Util.removeCourseScopedKey(ASSESSMENT_FAIL_KEY, studentId, courseKey);
        if (isFullPathwayTerminated) {
          Util.logEvent(EVENTS.ASSESSMENT_TERMINATED, {
            user_id: parentUserId,
            student_id: studentId,
            lesson_id: lesson.id,
            course_id: courseDocId,
            is_assessment: isAssessmentLesson,
            played_from: playedFrom,
          });
        }
        resultFinalizationStartedRef.current = false;
        await exitLidoGame(
          isFullPathwayTerminated || isAssessmentSystemExit,
          isFullPathwayTerminated,
        );
        return;
      }
      const api = ServiceConfig.getI().apiHandler;
      const assignment = state.assignment;
      const currentCourseId = courseDetail?.id ?? courseDocId ?? '';
      const { subjectId: courseSubjectId, hasFramework: courseHasFramework } =
        await getCoursePalContext(currentCourseId);
      const skillId: string | undefined = state.skillId;
      let normalizedSkillId =
        courseHasFramework &&
        typeof skillId === 'string' &&
        skillId.trim().length > 0
          ? skillId.trim()
          : undefined;

      if (courseHasFramework && !normalizedSkillId) {
        const normalizeIdentifier = (value: unknown) =>
          typeof value === 'string' && value.trim().length > 0
            ? value.trim()
            : undefined;
        const lessonIdentifiers = Array.from(
          new Set(
            [
              lessonDetail?.lido_lesson_id,
              lessonId,
              lessonDetail?.cocos_lesson_id,
              lesson.id,
            ]
              .map(normalizeIdentifier)
              .filter((id): id is string => !!id),
          ),
        );
        for (const lessonIdentifier of lessonIdentifiers) {
          const skills = await api.getSkillByLessonIdentifier(lessonIdentifier);
          for (const skill of skills) {
            if (
              await doesSkillBelongToCourseSubject(courseSubjectId, skill.id)
            ) {
              normalizedSkillId = skill.id;
              break;
            }
          }
          if (normalizedSkillId) break;
        }
      }
      // const currentStudent = api.currentStudent;
      const data = lessonData;
      let assignmentId = assignment ? assignment.id : null;
      const scoresList = getStoredLidoScores();
      let booleanOutcomes: boolean[] = [];
      let activitiesScoresStr = '';

      if (scoresList.length > 0) {
        booleanOutcomes = scoresList.map((item) => item.result === 1);
        activitiesScoresStr = scoresList.map((item) => item.result).join(',');
      }

      const isStudentLinked = await api.isStudentLinked(currentStudent.id);
      let classId;
      let schoolId;
      let chapter_id;
      if (isStudentLinked) {
        const studentResult = await api.getStudentClassesAndSchools(
          currentStudent.id,
        );
        if (!!studentResult && studentResult.classes.length > 0) {
          classId = studentResult.classes[0].id;
          schoolId = studentResult.schools[0].id;
        }
        if (!assignmentId) {
          const result = await api.getPendingAssignmentForLesson(
            lesson.id,
            classId ?? '',
            currentStudent.id,
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
          currentStudent.id,
        );
      }

      // Check if the game was played from `learning_pathway`
      const learning_path: boolean = state?.learning_path ?? false;
      const is_homework: boolean = state?.isHomework ?? false;
      const homeworkIndex: number | undefined = state?.homeworkIndex;
      const lessonTimeSpent = parseNumericValue(data.timeSpendForLesson) ?? 0;
      // 🔹 PRE-CHECK: figure out *before* updating path if this is the last homework lesson
      let shouldGiveHomeworkBonus = false;
      if (is_homework) {
        try {
          const pathStr = localStorage.getItem(HOMEWORK_PATHWAY);
          if (!pathStr) {
            logger.warn(
              '[Homework bonus pre-check] No HOMEWORK_PATHWAY in sessionStorage',
            );
          } else {
            const path = JSON.parse(pathStr) as {
              lessons?: any[];
              currentIndex?: number;
            };
            const lessonsLen = path.lessons?.length ?? 0;
            const isLastLessonInPath =
              lessonsLen > 0 &&
              typeof homeworkIndex === 'number' &&
              homeworkIndex === lessonsLen - 1;
            if (isLastLessonInPath) {
              shouldGiveHomeworkBonus = true;
            }
          }
        } catch (err) {
          logger.error(
            '[Homework bonus pre-check] Error while reading HOMEWORK_PATHWAY',
            err,
          );
        }
      }
      let avatarObj = AvatarObj.getInstance();
      let finalProgressTimeSpent =
        avatarObj.weeklyTimeSpent['min'] * 60 +
        avatarObj.weeklyTimeSpent['sec'];
      finalProgressTimeSpent = finalProgressTimeSpent + lessonTimeSpent;
      let computeMinutes = Math.floor(finalProgressTimeSpent / 60);
      let computeSec = finalProgressTimeSpent % 60;
      avatarObj.weeklyTimeSpent['min'] = computeMinutes;
      avatarObj.weeklyTimeSpent['sec'] = computeSec;
      avatarObj.weeklyPlayedLesson++;
      setGameResult(data);
      const isReward: boolean = state?.reward ?? false;
      const shouldGiveDailyReward =
        isReward ||
        ((learning_path || is_homework) &&
          (await Util.shouldGiveDailyReward()));
      if (shouldGiveDailyReward) {
        sessionStorage.setItem(REWARD_LESSON, 'true');
      }

      let abilityUpdates: any = {};
      let canUseSkillForAbility = false;
      if (normalizedSkillId && courseHasFramework) {
        try {
          canUseSkillForAbility = await doesSkillBelongToCourseSubject(
            courseSubjectId,
            normalizedSkillId,
          );

          if (canUseSkillForAbility) {
            abilityUpdates = await palUtil.updateAndGetAbilities({
              studentId: currentStudent.id,
              courseId: currentCourseId,
              skillId: normalizedSkillId,
              outcomes: booleanOutcomes,
            });
          }
        } catch (palError) {
          logger.warn(
            '[LidoPlayer] PAL ability update skipped due to invalid skill context',
            palError,
          );
          canUseSkillForAbility = false;
        }
      }

      const result = await api.updateResult(
        currentStudent,
        courseDocId,
        lesson.id,
        Math.round(data.finalScore ?? 0),
        correctMoves,
        wrongMoves,
        lessonTimeSpent,
        assignmentId,
        chapterDetail?.id ?? chapter_id?.toString() ?? '',
        classId,
        schoolId,
        false, // isImediateSync
        false, // isHomework
        canUseSkillForAbility ? normalizedSkillId : undefined,
        abilityUpdates.skill_ability,
        abilityUpdates.outcome_id,
        abilityUpdates.outcome_ability,
        abilityUpdates.competency_id,
        abilityUpdates.competency_ability,
        abilityUpdates.domain_id,
        abilityUpdates.domain_ability,
        abilityUpdates.subject_id,
        abilityUpdates.subject_ability,
        activitiesScoresStr,
        parentUserId,
        RESULT_STATUS.COMPLETED,
        source,
      );

      if (shouldGiveDailyReward && state?.isDefaultLesson) {
        sessionStorage.setItem(ACTIVATION_REWARD_FLOW_KEY, 'true');
      }

      // Update the learning path
      if (learning_path) {
        await Util.updateLearningPath(currentStudent, isReward);
      } else if (is_homework && homeworkIndex !== undefined) {
        // This handles our temporary homework path
        if (shouldGiveDailyReward) {
          sessionStorage.setItem(
            HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
            String(homeworkIndex),
          );
        }
        await Util.refreshHomeworkPathWithLatestAfterIndex(homeworkIndex);
        // Snapshot before advancing: final lesson may remove HOMEWORK_PATHWAY.
        const pathBeforeAdvance = localStorage.getItem(HOMEWORK_PATHWAY);
        if (shouldGiveDailyReward && pathBeforeAdvance) {
          sessionStorage.setItem(
            PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
            JSON.stringify({
              completedIndex: homeworkIndex,
              nextIndex: homeworkIndex + 1,
              pathSnapshot: pathBeforeAdvance,
            }),
          );
        }
        await Util.updateHomeworkPath(homeworkIndex);
      }

      if (shouldGiveHomeworkBonus) {
        try {
          const student = Util.getCurrentStudent() ?? currentStudent;
          if (student?.id) {
            const bonusStars = 10;
            const newLocalStars = Util.bumpLocalStarsForStudent(
              student.id,
              bonusStars,
              student.stars || 0,
            );
            try {
              await api.updateStudentStars(student.id, newLocalStars);
            } catch (err) {
              logger.warn(
                '[Homework bonus] Failed to sync +10 bonus to backend, keeping local only',
                err,
              );
            }
          }
        } catch (err) {
          logger.error(
            '[Homework bonus] Failed to award homework completion bonus',
            err,
          );
        }
      }
      Util.logEvent(EVENTS.LESSON_END, {
        user_id: parentUserId,
        student_id: studentId,
        result_id: result?.id ?? null,
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
        course_name: courseDetail?.name ?? '',
        time_spent: lessonTimeSpent,
        total_moves: data.totalMoves,
        total_games: data.totalGames,
        correct_moves: correctMoves,
        wrong_moves: wrongMoves,
        game_score: data.gameScore,
        quiz_score: data.quizScore,
        game_completed: data.gameCompleted,
        quiz_completed: data.quizCompleted,
        game_time_spent: data.gameTimeSpent,
        quiz_time_spent: data.quizTimeSpent,
        score: data.finalScore,
        played_from: playedFrom,
        assignment_type: assignmentType,
        source,
      });
      logUserActivationLessonEvent({
        detail: data,
        userId: parentUserId,
        studentId,
        lessonTimeSpent,
        correctMoves,
        wrongMoves,
        resultId: result?.id ?? null,
        status: 'completed',
      });
      let tempAssignmentCompletedIds = localStorage.getItem(
        ASSIGNMENT_COMPLETED_IDS,
      );
      let assignmentCompletedIds;
      if (!tempAssignmentCompletedIds) {
        assignmentCompletedIds = {};
      } else {
        assignmentCompletedIds = JSON.parse(tempAssignmentCompletedIds);
      }
      if (!assignmentCompletedIds[studentId]) {
        assignmentCompletedIds[studentId] = [];
      }
      localStorage.setItem(
        ASSIGNMENT_COMPLETED_IDS,
        JSON.stringify(assignmentCompletedIds),
      );
      setIsLoading(false);
      setScoreCardProgressState({
        isAborted: false,
        isFullPathwayTerminated: false,
      });
      setShowDialogBox(true);
    } catch (error) {
      logger.error('❌ Failed to process lesson end', error);
      localStorage.removeItem(LIDO_SCORES_KEY);
      push();
    }
  };

  const onGameExit = async (e: any) => {
    const data = (e.detail ?? {}) as LidoEventDetail;
    const { studentId, userId } = await resolveStudentContext();
    if (!studentId) {
      push();
      return;
    }

    const parentUserId = userId;
    const courseKey = getAssessmentProgressKey();
    Util.removeCourseScopedKey(FAIL_STREAK_KEY, studentId, courseKey);

    const { correctMoves, wrongMoves } = getNormalizedMoveCounts(data);
    const storedScores = getStoredLidoScores();
    const lessonTimeSpent = parseNumericValue(data.timeSpendForLesson) ?? 0;
    Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
      user_id: parentUserId,
      student_id: studentId,
      // assignment_id: lessonDetail.assignment?.id,
      left_game_no: data.currentGameNumber,
      left_game_name: data.gameName,
      chapter_id: data.chapterId,
      chapter_name: chapterDetail?.name ?? '',
      lesson_id: data.lessonId,
      lesson_name: lessonDetail?.name ?? lesson?.name ?? '',
      lesson_type: data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: data.courseId,
      course_name: courseDetail?.name ?? '',
      time_spent: lessonTimeSpent,
      total_moves: data.totalMoves,
      total_games: data.totalGames,
      correct_moves: correctMoves,
      wrong_moves: wrongMoves,
      game_score: data.gameScore,
      quiz_score: data.quizScore,
      game_completed: data.gameCompleted,
      quiz_completed: data.quizCompleted,
      game_time_spent: data.gameTimeSpent,
      quiz_time_spent: data.quizTimeSpent,
      played_from: playedFrom,
      assignment_type: assignmentType,
    });
    logUserActivationLessonEvent({
      detail: data,
      userId: parentUserId,
      studentId,
      lessonTimeSpent,
      correctMoves,
      wrongMoves,
      resultId: null,
      status: 'incomplete',
    });
    push();
  };
  useEffect(() => {
    // localStorage.removeItem(LIDO_SCORES_KEY);
    init();
    if (
      Capacitor.isNativePlatform() &&
      localStorage.getItem(CURRENT_MODE) === MODES.TEACHER
    ) {
      ScreenOrientation.lock({ orientation: 'landscape' }).catch((error) => {
        logger.warn('[LidoPlayer] Failed to lock initial orientation', error);
      });
    }
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

  useEffect(() => {
    const unregister = registerBackButtonHandler(
      () => {
        if (window.location.pathname !== PAGES.LIDO_PLAYER) return false;
        push();
        return true;
      },
      { path: PAGES.LIDO_PLAYER },
    );

    return unregister;
  }, []);

  const presentToast = async () => {
    await present({
      message: 'Something went wrong!',
      color: 'danger',
      duration: 3000,
      position: 'bottom',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
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
    if (typeof window !== 'undefined') {
      window.__LIDO_COMMON_AUDIO_PATH__ = undefined;
    }
    const urlSearchParams = new URLSearchParams(window.location.search);
    const lessonToDownload = lessonDetail;
    const lessonId =
      Util.getLessonBundleId(lessonToDownload) ??
      urlSearchParams.get('lessonid') ??
      state.lessonId;
    if (!lessonToDownload || !lessonId) {
      presentToast();
      push();
      return;
    }
    const dow = await Util.downloadZipBundle(
      [lessonToDownload],
      undefined,
      REMOTE_CONFIG_KEYS.LIDO_BUNDLE_ZIP_URLS,
    );
    if (!dow) {
      presentToast();
      push();
      return;
    }

    const resolvedPlayerLanguage = await resolveLidoPlayerLanguage();
    setPlayerLanguage(resolvedPlayerLanguage);

    if (Capacitor.isNativePlatform()) {
      const path = await Util.getLessonPath({ lessonId: lessonId });
      if (path) {
        setBasePath(path);
      } else {
        presentToast();
        push();
        return;
      }
      try {
        const { student } = await resolveStudentContext();
        const authCurrentUser = ServiceConfig.getI().authHandler.currentUser as
          | TableTypes<'user'>
          | undefined;
        const languageId = student?.language_id ?? authCurrentUser?.language_id;
        if (!languageId) {
          throw new Error('[LidoPlayer] Student language_id missing');
        }
        const audioPath = `${LIDO_COMMON_AUDIO_DIR}/${languageId}`;

        let commonAudioUri;
        try {
          commonAudioUri = await Filesystem.getUri({
            directory: Directory.Data,
            path: audioPath,
          });
        } catch (firstError) {
          logger.error(
            '[LidoPlayer] Common audio not accessible, retrying once...',
          );
          // small delay to handle async extract race (very common on Android)
          await new Promise((r) => setTimeout(r, 150));
          commonAudioUri = await Filesystem.getUri({
            directory: Directory.Data,
            path: audioPath,
          });
        }
        setCommonAudioPath(Capacitor.convertFileSrc(commonAudioUri.uri));
      } catch (e) {
        logger.error('[LidoPlayer] Failed to resolve common audio path', e);
        presentToast();
        push();
        return;
      }
    } else {
      // Extracted folder support used base-url/xml-path here; web now loads the ZIP directly.
      // const pathBase = `${lidoBaseUrl}${lessonId}/`;
      // const pathXml = `${lidoBaseUrl}${lessonId}/index.xml`;
      // setBasePath(pathBase);
      // setXmlPath(pathXml);
      const explicitZipUrl =
        urlSearchParams.get('zipUrl') ?? state?.zipUrl ?? null;

      if (explicitZipUrl) {
        logger.warn('Resolved Lido ZIP URL from override', {
          lessonId,
          zipUrl: explicitZipUrl,
        });
        setZipUrl(explicitZipUrl);
        setIsLoading(false);
        setIsReady(true);
        return;
      }

      const bundleZipUrls = getCachedGrowthBookFeatureValue<string[]>(
        BUNDLE_ZIP_URLS,
        getBundleZipUrlsForEnv(),
      );
      const resolvedZipUrl = await resolveLessonZipUrl(bundleZipUrls, lessonId);
      if (!resolvedZipUrl) {
        logger.error('[LidoPlayer] No working ZIP URL found for lesson', {
          lessonId,
          featureKey: BUNDLE_ZIP_URLS,
          bundleZipUrls,
        });
        presentToast();
        push();
        return;
      }

      logger.warn('Resolved Lido ZIP URL', {
        lessonId,
        featureKey: BUNDLE_ZIP_URLS,
        bundleZipUrls,
        zipUrl: resolvedZipUrl,
      });
      setZipUrl(resolvedZipUrl);
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
            lessonDetail?.plugin_type === 'lido_assessment'
              ? 100
              : Math.round(gameResult?.finalScore ?? 0)
          }
          message={t('You Completed the Lesson:')}
          showDialogBox={showDialogBox}
          lessonName={lessonDetail?.name ?? ''}
          noText={t('Continue Playing')}
          handleClose={() => setShowDialogBox(false)}
          onContinueButtonClicked={() => {
            setShowDialogBox(false);
            setIsLoading(true);
            push();
          }}
          progressContext={
            shouldShowScoreCardProgressRows
              ? {
                  completedCourseId: courseDetail?.id ?? courseDocId,
                  completedLessonId: lessonDetail?.id ?? lessonId ?? undefined,
                  completedHomeworkIndex:
                    state?.isHomework &&
                    typeof state?.homeworkIndex === 'number'
                      ? state.homeworkIndex
                      : undefined,
                  animateDailyReward: Boolean(state?.reward),
                  showDailyReward: shouldShowDailyRewardProgressRow,
                  showStickerProgress: !isActivationLesson,
                  countCompletedLessonTowardStickerProgress:
                    !scoreCardProgressState.isFullPathwayTerminated,
                  allowZeroStickerProgress:
                    scoreCardProgressState.isFullPathwayTerminated,
                  stickerProgressCurrentOverride:
                    scoreCardProgressState.isFullPathwayTerminated
                      ? 0
                      : undefined,
                }
              : undefined
          }
          courseId={courseDetail?.id ?? courseDocId}
          lessonId={lessonDetail?.id ?? lessonId ?? undefined}
          showProgressRows={shouldShowScoreCardProgressRows}
          variant="progress"
        />
      )}
      {isReady && (xmlPath || basePath || zipUrl) && !showDialogBox
        ? React.createElement('lido-standalone', {
            'xml-path': xmlPath,
            'base-url': basePath,
            canplay: true,
            'code-folder-path': '/Lido-player-code-versions',
            'common-audio-path': commonAudioPath ?? '/Lido-CommonAudios',
            'zip-url': zipUrl ?? '',
            language: playerLanguage,
          })
        : null}
    </IonPage>
  );
};

export default LidoPlayer;
