import { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router';
import {
  LIDO_SCORES_KEY,
  LidoActivityEndKey,
  LidoGameCompletedKey,
  LidoGameExitKey,
  LidoLessonEndKey,
  LidoNextContainerKey,
  CURRENT_MODE,
  MODES,
  PAGES,
  TableTypes,
  IS_REWARD_FEATURE_ON,
  SOURCE,
  CURRENT_HEADER,
  GENERIC_POP_UP,
} from '../common/constants';
import { useIonToast } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '../utility/screenOrientation';
import { ServiceConfig } from '../services/ServiceConfig';
import { Lesson } from '../interface/curriculumInterfaces';
import PopupManager from '../components/GenericPopUp/GenericPopUpManager';
import { useFeatureValue } from '@growthbook/growthbook-react';
import { registerBackButtonHandler } from '../common/backButtonRegistry';
import logger from '../utility/logger';
import { getAppPathname, getAppSearchParams } from '../utility/routerLocation';
import { parsePath } from 'history';
import { PopupConfig } from '../components/GenericPopUp/GenericPopUpType';
import {
  getSourceFromState,
  resolveLessonZipUrl,
  waitForLearningPathAssessmentFinalizationSettle,
} from './LidoPlayer.helpers';
import { processLidoStoredResults } from './LidoPlayer.results';
import { handleLidoLessonEnd } from './LidoPlayer.lessonEnd';
import {
  handleLidoActivityEnd,
  handleLidoGameExit,
} from './LidoPlayer.activityEvents';
import { initializeLidoPlayer } from './LidoPlayer.init';
import { createLidoPlayerControllerHelpers } from './LidoPlayer.controllerHelpers';

export const useLidoPlayerController = () => {
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
  const urlSearchParams = getAppSearchParams();
  const lessonId = urlSearchParams.get('lessonid') ?? state?.lessonId;
  const assignmentType = state?.assignment?.type || 'self-played';
  const playedFrom = localStorage.getItem(CURRENT_HEADER);

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
  const popupConfig = useFeatureValue<PopupConfig | null>(GENERIC_POP_UP, null);

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

  const {
    getAssessmentFailStreak,
    getAssessmentProgressKey,
    getCoursePalContext,
    getNormalizedMoveCounts,
    getStoredLidoScores,
    getTotalStoredLessonTime,
    doesSkillBelongToCourseSubject,
    logUserActivationLessonEvent,
    parseNumericValue,
    resolveLidoPlayerLanguage,
    resolveStudentContext,
    shouldTerminateAssessmentPathway,
  } = createLidoPlayerControllerHelpers({
    api,
    assignmentType,
    chapterDetail,
    courseDetail,
    courseDetailWithPathFields,
    courseDocId,
    isActivationLesson,
    isAssessmentLesson,
    lesson,
    lessonDetail,
    playedFrom,
    previousAssessmentSkippedRef,
    source,
  });

  const onNextContainer = (e: any) => logger.info('Next', e);
  const gameCompleted = () => {
    if (popupConfig) {
      PopupManager.onGameComplete(popupConfig);
    }
  };

  const push = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    localStorage.removeItem(LIDO_SCORES_KEY);
    const urlParams = getAppSearchParams();
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

    history.replace({ ...parsePath(targetPath), state: returnState });
    setIsLoading(false);
    setTimeout(() => {
      isExitingRef.current = false;
    }, 300);
  };

  const processStoredResults = (
    isAborted: boolean = false,
    isFullPathwayTerminated: boolean = false,
  ) =>
    processLidoStoredResults(
      {
        api,
        assignment,
        courseDetail,
        courseDocId,
        doesSkillBelongToCourseSubject,
        getCoursePalContext,
        getStoredLidoScores,
        getTotalStoredLessonTime,
        isAssessmentLesson,
        lesson,
        playedFrom,
        push,
        resolveStudentContext,
        source,
        state,
      },
      isAborted,
      isFullPathwayTerminated,
    );
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

  const onActivityEnd = (e: any) =>
    handleLidoActivityEnd(
      {
        courseDocId,
        exitLidoGame,
        getAssessmentProgressKey,
        getNormalizedMoveCounts,
        getStoredLidoScores,
        isAssessmentLesson,
        lesson,
        parseNumericValue,
        playedFrom,
        resolveStudentContext,
        resultFinalizationStartedRef,
        shouldTerminateAssessmentPathway,
      },
      e,
    );

  const onLessonEnd = (e: any) =>
    handleLidoLessonEnd(
      {
        assessmentLessonEndSettlingRef,
        assignmentType,
        chapterDetail,
        courseDetail,
        doesSkillBelongToCourseSubject,
        exitLidoGame,
        getAssessmentFailStreak,
        getAssessmentProgressKey,
        getCoursePalContext,
        getNormalizedMoveCounts,
        getStoredLidoScores,
        isAssessmentLesson,
        lesson,
        lessonDetail,
        lessonId,
        logUserActivationLessonEvent,
        parseNumericValue,
        playedFrom,
        push,
        resolveStudentContext,
        resultFinalizationStartedRef,
        setGameResult,
        setIsLoading,
        setScoreCardProgressState,
        setShowDialogBox,
        shouldTerminateAssessmentPathway,
        source,
        state,
        waitForLearningPathAssessmentFinalizationSettle,
      },
      e,
    );

  const onGameExit = (e: any) =>
    handleLidoGameExit(
      {
        assignmentType,
        chapterDetail,
        courseDetail,
        getAssessmentProgressKey,
        getNormalizedMoveCounts,
        getStoredLidoScores,
        lesson,
        lessonDetail,
        logUserActivationLessonEvent,
        parseNumericValue,
        playedFrom,
        push,
        resolveStudentContext,
      },
      e,
    );
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
        if (getAppPathname() !== PAGES.LIDO_PLAYER) return false;
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

  const init = () =>
    initializeLidoPlayer({
      lessonDetail,
      presentToast,
      push,
      resolveLessonZipUrl,
      resolveLidoPlayerLanguage,
      resolveStudentContext,
      resultsRef,
      setBasePath,
      setCommonAudioPath,
      setIsLoading,
      setIsReady,
      setPlayerLanguage,
      setShowDialogBox,
      setZipUrl,
      state,
    });

  return {
    basePath,
    commonAudioPath,
    courseDetail,
    courseDocId,
    gameResult,
    isActivationLesson,
    isLoading,
    isReady,
    lessonDetail,
    lessonId,
    playerLanguage,
    push,
    scoreCardProgressState,
    setIsLoading,
    setShowDialogBox,
    shouldShowDailyRewardProgressRow,
    shouldShowScoreCardProgressRows,
    showDialogBox,
    state,
    xmlPath,
    zipUrl,
  };
};
