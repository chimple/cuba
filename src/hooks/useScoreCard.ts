import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Dialog, DialogContentText } from '@mui/material';
import ScoreCardStarIcons from '../components/scorecards/ScoreCardStarIcons';
import ScoreCardTitle from '../components/scorecards/ScoreCardTitle';
import ScoreCardProgressRows, {
  type ScoreCardProgressRowData,
} from '../components/scorecards/ScoreCardProgressRows';
import i18n from '../i18n';
import { t } from 'i18next';
import { AudioUtil } from '../utility/AudioUtil';
import { EVENTS, TableTypes } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { buildScoreCardProgressRows } from '../components/scorecards/scoreCardLogic';
import { PENDING_BADGE_MILESTONE_KEY } from '../common/Badges/badgeProgress';
import { logBadgeEvent } from '../common/Badges/badgeAnalytics';
import type { BadgeAnalyticsProgress } from '../common/Badges/badgeAnalytics';
import logger from '../utility/logger';
import { store } from '../redux/store';
import { setBadgeProgress } from '../redux/slices/badgeProgress/badgeProgressSlice';

const SCORECARD_AUDIO_URL = '/assets/audios/scorecard/victory.mp3';
const EMPTY_PROGRESS_ROWS: ScoreCardProgressRowData[] = [];

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
  progressContext?: {
    completedCourseId?: string;
    completedLessonId?: string;
    completedHomeworkIndex?: number;
    animateDailyReward?: boolean;
    showDailyReward?: boolean;
    showStickerProgress?: boolean;
    countCompletedLessonTowardStickerProgress?: boolean;
    allowZeroStickerProgress?: boolean;
    stickerProgressCurrentOverride?: number;
  };
  showProgressRows?: boolean;
  variant?: 'default' | 'progress';
  handleClose: (event: object) => void;
  onContinueButtonClicked: MouseEventHandler<HTMLButtonElement>;
}) => {
  const [resolvedProgressRows, setResolvedProgressRows] = useState<
    ScoreCardProgressRowData[]
  >(progressRows ?? EMPTY_PROGRESS_ROWS);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const loadedProgressRowsKeyRef = useRef<string | null>(null);
  const hasProvidedProgressRows = Boolean(progressRows?.length);
  const displayedProgressRows = showProgressRows
    ? hasProvidedProgressRows
      ? (progressRows ?? EMPTY_PROGRESS_ROWS)
      : resolvedProgressRows
    : EMPTY_PROGRESS_ROWS;
  const hasProgressRows = displayedProgressRows.length > 0;
  const useProgressLayout = variant === 'progress' || hasProgressRows;
  const progressNoRowsClass = !showProgressRows ? '--progress-no-rows' : '';
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
  const shouldWaitForProgressRowsAnimation =
    useProgressLayout && displayedProgressRows.length > 0;
  const [
    areProgressRowsAnimationComplete,
    setAreProgressRowsAnimationComplete,
  ] = useState(true);
  const progressContinueStateClass = useProgressLayout
    ? areProgressRowsAnimationComplete
      ? 'score-card-continue--ready'
      : 'score-card-continue--pending'
    : '';
  const progressLookupKey = [
    progressContext?.completedCourseId ?? '',
    progressContext?.completedLessonId ?? '',
    progressContext?.completedHomeworkIndex ?? '',
    progressContext?.animateDailyReward ? '1' : '0',
    progressContext?.showDailyReward ? '1' : '0',
    progressContext?.showStickerProgress === false ? '0' : '1',
    progressContext?.countCompletedLessonTowardStickerProgress === false
      ? '0'
      : '1',
    progressContext?.allowZeroStickerProgress ? '1' : '0',
    progressContext?.stickerProgressCurrentOverride ?? '',
  ].join('|');
  const shouldLoadProgressRows =
    showDialogBox &&
    variant === 'progress' &&
    showProgressRows &&
    !hasProvidedProgressRows;
  const isProgressRowsPending =
    shouldLoadProgressRows &&
    loadedProgressRowsKeyRef.current !== progressLookupKey;
  const shouldRenderDialog = showDialogBox && !isProgressRowsPending;
  const hasLoggedGoalProgressRef = useRef(false);
  const badgeCompletionKeyRef = useRef<string | null>(null);

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
  }, [
    displayedProgressRows.length,
    courseId,
    lessonId,
    progressContext?.completedCourseId,
    progressContext?.completedLessonId,
    lessonName,
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
    lessonName,
    courseId,
    lessonId,
    progressContext?.completedCourseId,
    progressContext?.completedLessonId,
  ]);

  const handleContinueClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void logContinueClick();
    onContinueButtonClicked(event);
  };

  const handleProgressRowsAnimationComplete = useCallback(() => {
    setAreProgressRowsAnimationComplete(true);
  }, []);

  useEffect(() => {
    if (!shouldRenderDialog) {
      setAreProgressRowsAnimationComplete(true);
      return;
    }

    const needsProgressRowsAnimationWait = shouldWaitForProgressRowsAnimation;
    setAreProgressRowsAnimationComplete(!needsProgressRowsAnimationWait);

    if (!needsProgressRowsAnimationWait) return;

    const fallbackTimerId = window.setTimeout(() => {
      setAreProgressRowsAnimationComplete(true);
    }, 8000);

    return () => window.clearTimeout(fallbackTimerId);
  }, [
    progressRowsAnimationKey,
    shouldRenderDialog,
    shouldWaitForProgressRowsAnimation,
  ]);

  useEffect(() => {
    if (progressRows) setResolvedProgressRows(progressRows);
  }, [progressRows]);

  useEffect(() => {
    let isCancelled = false;

    const loadProgressRows = async () => {
      if (
        !shouldLoadProgressRows ||
        loadedProgressRowsKeyRef.current === progressLookupKey
      ) {
        return;
      }

      setIsLoadingRows(true);
      try {
        const { student, studentId } = await resolveScoreCardStudentContext();
        const apiHandler = ServiceConfig.getI()?.apiHandler;
        if (!apiHandler) return;

        const progressRowsForScoreCard = await buildScoreCardProgressRows({
          api: apiHandler,
          student,
          studentId,
          completedCourseId: progressContext?.completedCourseId,
          completedLessonId: progressContext?.completedLessonId,
          completedHomeworkIndex: progressContext?.completedHomeworkIndex,
          animateDailyReward: progressContext?.animateDailyReward,
          showDailyReward: progressContext?.showDailyReward,
          showStickerProgress: progressContext?.showStickerProgress,
          countCompletedLessonTowardStickerProgress:
            progressContext?.countCompletedLessonTowardStickerProgress,
          allowZeroStickerProgress: progressContext?.allowZeroStickerProgress,
          stickerProgressCurrentOverride:
            progressContext?.stickerProgressCurrentOverride,
        });

        if (!isCancelled) {
          setResolvedProgressRows(progressRowsForScoreCard);
        }
      } catch {
        // Keep the scorecard actionable even if progress lookup fails.
      } finally {
        if (!isCancelled) {
          loadedProgressRowsKeyRef.current = progressLookupKey;
          setIsLoadingRows(false);
        }
      }
    };

    void loadProgressRows();

    return () => {
      isCancelled = true;
    };
  }, [
    hasProvidedProgressRows,
    progressLookupKey,
    shouldLoadProgressRows,
    progressContext?.animateDailyReward,
    progressContext?.completedCourseId,
    progressContext?.completedLessonId,
    progressContext?.completedHomeworkIndex,
    progressContext?.showDailyReward,
    progressContext?.showStickerProgress,
    progressContext?.countCompletedLessonTowardStickerProgress,
    progressContext?.allowZeroStickerProgress,
    progressContext?.stickerProgressCurrentOverride,
    showDialogBox,
    variant,
  ]);

  useEffect(() => {
    if (!shouldRenderDialog) {
      hasLoggedGoalProgressRef.current = false;
      void AudioUtil.stopAudioUrlOrTtsPlayback();
      return;
    }

    void AudioUtil.playAudioOrTts({
      audioUrl,
      delayMs: 300,
      loop: false,
    });

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
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

  useEffect(() => {
    const completedLessonId = progressContext?.completedLessonId;
    const api = ServiceConfig.getI()?.apiHandler;
    if (
      !shouldRenderDialog ||
      !progressContext?.showStickerProgress ||
      !completedLessonId ||
      !api?.recordBadgeLessonCompletion
    ) {
      return;
    }

    const completionKey = `${completedLessonId}:${progressContext.completedHomeworkIndex ?? ''}`;
    if (badgeCompletionKeyRef.current === completionKey) return;

    void (async () => {
      const { studentId } = await resolveScoreCardStudentContext();
      if (!studentId) return;
      badgeCompletionKeyRef.current = completionKey;
      try {
        const result = await api.recordBadgeLessonCompletion(studentId);
        // Redux updates the menu indicator immediately after the badge is awarded.
        store.dispatch(
          setBadgeProgress({
            studentId,
            hasUnseenBadge: Boolean(result.progress.has_unseen_badge),
          }),
        );
        if (result.milestoneReached !== null) {
          // Carry the exact local progress snapshot to Home for popup analytics and display.
          const badgeProgress = result.progress as BadgeAnalyticsProgress;
          void logBadgeEvent(
            EVENTS.BADGE_MILESTONE_REACHED,
            studentId,
            badgeProgress,
            { milestone_awarded: result.milestoneReached },
          );
          sessionStorage.setItem(
            PENDING_BADGE_MILESTONE_KEY,
            JSON.stringify({
              milestone: result.milestoneReached,
              studentId,
              progress: badgeProgress,
            }),
          );
        }
      } catch (error) {
        logger.warn('Badge progress update skipped:', error);
      }
    })();
  }, [progressContext, shouldRenderDialog]);

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
    handleProgressRowsAnimationComplete,
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
