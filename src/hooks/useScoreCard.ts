import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Dialog, DialogContentText } from '@mui/material';
import { t } from 'i18next';
import ScoreCardProgressRows from '../components/scorecards/ScoreCardProgressRows';
import type { ScoreCardProgressContext, ScoreCardProgressRowData } from '../components/scorecards/scoreCardTypes';
import ScoreCardStarIcons from '../components/scorecards/ScoreCardStarIcons';
import ScoreCardTitle from '../components/scorecards/ScoreCardTitle';
import { EVENTS, TableTypes } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { AudioUtil } from '../utility/AudioUtil';
import { Util } from '../utility/util';
import i18n from '../i18n';
import { usePostLessonGoals } from './usePostLessonGoals';

const SCORECARD_AUDIO_URL = '/assets/audios/scorecard/victory.mp3';
const EMPTY_GOALS: ScoreCardProgressRowData[] = [];
const GOAL_ANALYTICS_IDS: Record<ScoreCardProgressRowData['id'], string> = {
  dailyReward: 'daily_reward',
  sticker: 'sticker',
  badge: 'badge',
  campaign: 'campaign',
};

const resolveScoreCardStudentContext = async (): Promise<{
  student: TableTypes<'user'> | undefined;
  studentId: string | undefined;
  parentId: string | undefined;
}> => {
  const authHandler = ServiceConfig.getI()?.authHandler;
  const currentUser = await authHandler?.getCurrentUser();
  const student = Util.getCurrentStudent() ?? currentUser;
  return {
    student,
    studentId: student?.id ?? currentUser?.id,
    parentId: currentUser?.id,
  };
};

export const useScoreCard = ({
  showDialogBox,
  message,
  lessonName,
  score,
  noText,
  audioUrl = SCORECARD_AUDIO_URL,
  courseId,
  lessonId,
  progressRows,
  progressContext,
  variant = 'default',
  showProgressRows = true,
  handleClose,
  onContinueButtonClicked,
}: {
  showDialogBox: boolean;
  score: number;
  message: string;
  lessonName: string;
  noText: string;
  audioUrl?: string;
  courseId?: string;
  lessonId?: string;
  progressRows?: ScoreCardProgressRowData[];
  progressContext?: ScoreCardProgressContext;
  showProgressRows?: boolean;
  variant?: 'default' | 'progress';
  handleClose: (event: object) => void;
  onContinueButtonClicked: MouseEventHandler<HTMLButtonElement>;
}) => {
  const hasProvidedGoals = Boolean(progressRows?.length);
  const shouldLoadGoals =
    showDialogBox &&
    variant === 'progress' &&
    showProgressRows &&
    !hasProvidedGoals;
  const {
    goals,
    isLoadingRows,
    isPending,
    nonPathwayOverride,
  } = usePostLessonGoals({
    shouldLoad: shouldLoadGoals,
    progressRows,
    progressContext,
  });
  const displayedProgressRows = showProgressRows ? goals : EMPTY_GOALS;
  const hasProgressRows = displayedProgressRows.length > 0;
  const useProgressLayout = variant === 'progress' || hasProgressRows;
  const progressNoRowsClass = hasProgressRows ? '' : '--progress-no-rows';
  const dialogClassName = useProgressLayout
    ? `score-card-dialog score-card-dialog--progress${progressNoRowsClass ? ' score-card-dialog' + progressNoRowsClass : ''}`
    : 'score-card-dialog';
  const paperClassName = useProgressLayout
    ? `score-card-dialog__paper score-card-dialog__paper--progress${progressNoRowsClass ? ' score-card-dialog__paper' + progressNoRowsClass : ''}`
    : 'score-card-dialog__paper';
  const progressRowCountClass = `score-card-progress-count-${Math.min(
    displayedProgressRows.length,
    2,
  )}`;
  const progressRowsAnimationKey = displayedProgressRows
    .map(
      (row) =>
        `${row.id}:${row.current}:${row.total}:${row.completed ? '1' : '0'}:${
          row.animateCompletion ? '1' : '0'
        }`,
    )
    .join('|');
  const [areProgressRowsAnimationComplete, setAreProgressRowsAnimationComplete] =
    useState(true);
  const progressContinueStateClass = useProgressLayout
    ? areProgressRowsAnimationComplete
      ? 'score-card-continue--ready'
      : 'score-card-continue--pending'
    : '';
  const shouldRenderDialog = showDialogBox && !isPending;
  const hasLoggedGoalProgressRef = useRef(false);

  const logGoalProgressShown = useCallback(async () => {
    const { student, studentId, parentId } =
      await resolveScoreCardStudentContext();
    Util.logEvent(EVENTS.GOAL_PROGRESS, {
      action: 'shown',
      score,
      parent_id: parentId ?? 'null',
      student_id: studentId ?? 'null',
      student_stars: student?.stars ?? 'null',
      progress_rows_count: displayedProgressRows.length,
      course_id: courseId ?? progressContext?.completedCourseId ?? 'null',
      lesson_id: lessonId ?? progressContext?.completedLessonId ?? 'null',
      lesson_name: lessonName ?? 'null',
    });
    void Util.logEvent(EVENTS.POST_LESSON_GOALS_VIEWED, {
      goals_rendered: JSON.stringify(
        displayedProgressRows.map((row) => GOAL_ANALYTICS_IDS[row.id]),
      ),
      non_pathway_override: nonPathwayOverride,
      source: progressContext?.source ?? 'unknown',
    });
  }, [
    courseId,
    displayedProgressRows,
    lessonId,
    lessonName,
    nonPathwayOverride,
    progressContext?.completedCourseId,
    progressContext?.completedLessonId,
    progressContext?.source,
    score,
  ]);

  const logContinueClick = useCallback(async () => {
    const { studentId, parentId } = await resolveScoreCardStudentContext();
    Util.logEvent(EVENTS.CLICKS_ANALYTICS, {
      action: 'continue_click',
      click_value: 'Continue Playing',
      click_identifier: 'lesson_end_continue',
      action_type: 'click',
      user_id: parentId ?? studentId ?? 'null',
      parent_id: parentId ?? 'null',
      student_id: studentId ?? 'null',
      course_id: courseId ?? progressContext?.completedCourseId ?? 'null',
      lesson_id: lessonId ?? progressContext?.completedLessonId ?? 'null',
      lesson_name: lessonName ?? 'null',
    });
  }, [
    courseId,
    lessonId,
    lessonName,
    progressContext?.completedCourseId,
    progressContext?.completedLessonId,
  ]);

  const handleContinueClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void logContinueClick();
    onContinueButtonClicked(event);
  };

  useEffect(() => {
    if (!shouldRenderDialog || !useProgressLayout || !hasProgressRows) {
      setAreProgressRowsAnimationComplete(true);
      return;
    }

    setAreProgressRowsAnimationComplete(false);
    const continueTimerId = window.setTimeout(
      () => setAreProgressRowsAnimationComplete(true),
      4000,
    );
    return () => window.clearTimeout(continueTimerId);
  }, [
    hasProgressRows,
    progressRowsAnimationKey,
    shouldRenderDialog,
    useProgressLayout,
  ]);

  useEffect(() => {
    if (!shouldRenderDialog) {
      hasLoggedGoalProgressRef.current = false;
      void AudioUtil.stopAudioUrlOrTtsPlayback();
      return;
    }

    void AudioUtil.playAudioOrTts({ audioUrl, delayMs: 300, loop: false });
    return () => void AudioUtil.stopAudioUrlOrTtsPlayback();
  }, [audioUrl, lessonName, message, shouldRenderDialog]);

  useEffect(() => {
    if (
      !shouldRenderDialog ||
      isLoadingRows ||
      hasLoggedGoalProgressRef.current
    ) {
      return;
    }
    hasLoggedGoalProgressRef.current = true;
    void logGoalProgressShown();
  }, [isLoadingRows, logGoalProgressShown, shouldRenderDialog]);

  return {
    Dialog,
    DialogContentText,
    ScoreCardProgressRows,
    ScoreCardStarIcons,
    ScoreCardTitle,
    dialogClassName,
    displayedProgressRows,
    handleClose,
    handleContinueClick,
    i18n,
    isLoadingRows,
    lessonName,
    message,
    noText,
    paperClassName,
    progressContinueStateClass,
    progressRowCountClass,
    score,
    shouldRenderDialog,
    t,
    useProgressLayout,
  };
};
