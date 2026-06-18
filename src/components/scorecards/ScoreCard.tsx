import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import './ScoreCard.css';
import { Dialog, DialogContentText } from '@mui/material';
import ScoreCardStarIcons from './ScoreCardStarIcons';
import ScoreCardTitle from './ScoreCardTitle';
import ScoreCardProgressRows, {
  type ScoreCardProgressRowData,
} from './ScoreCardProgressRows';
import i18n from '../../i18n';
import { t } from 'i18next';
import { AudioUtil } from '../../utility/AudioUtil';
import { EVENTS, TableTypes } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { buildScoreCardProgressRows } from './scoreCardLogic';

const SCORECARD_AUDIO_URL = '/assets/audios/scorecard/victory.mp3';
const EMPTY_PROGRESS_ROWS: ScoreCardProgressRowData[] = [];

type ScoreCardAnalyticsAction = 'shown' | 'continue_click';

const resolveScoreCardStudentContext = async (): Promise<{
  student: TableTypes<'user'> | undefined;
  studentId: string | undefined;
}> => {
  const authHandler = ServiceConfig.getI()?.authHandler;
  const currentUser = await authHandler?.getCurrentUser();
  const student = Util.getCurrentStudent() ?? currentUser;

  return {
    student,
    studentId: student?.id ?? currentUser?.id,
  };
};

const ScoreCard: React.FC<{
  showDialogBox: boolean;
  score: number;
  message: string;
  lessonName: string;
  noText: string;
  audioUrl?: string;
  progressRows?: ScoreCardProgressRowData[];
  progressContext?: {
    completedCourseId?: string;
    completedLessonId?: string;
    completedHomeworkIndex?: number;
    animateDailyReward?: boolean;
    showDailyReward?: boolean;
  };
  showProgressRows?: boolean;
  variant?: 'default' | 'progress';
  handleClose: (event: object) => void;
  onContinueButtonClicked: MouseEventHandler<HTMLButtonElement>;
}> = ({
  showDialogBox,
  message,
  lessonName,
  score,
  noText,
  audioUrl = SCORECARD_AUDIO_URL,
  progressRows,
  progressContext,
  variant = 'default',
  showProgressRows = true,
  handleClose,
  onContinueButtonClicked,
}) => {
  const [resolvedProgressRows, setResolvedProgressRows] = useState<
    ScoreCardProgressRowData[]
  >(progressRows ?? EMPTY_PROGRESS_ROWS);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
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
  const hasLoggedGoalProgressRef = useRef(false);

  const logScoreCardAnalytics = useCallback(
    async (eventName: EVENTS, action: ScoreCardAnalyticsAction) => {
      if (eventName === EVENTS.CLICKS_ANALYTICS) {
        await Util.logEvent(eventName, {
          action,
          click_value: noText,
          click_identifier: 'noButton',
          action_type: 'click',
        });
        return;
      }

      const { student, studentId } = await resolveScoreCardStudentContext();
      await Util.logEvent(eventName, {
        action,
        score,
        user_id: studentId ?? 'null',
        student_id: studentId ?? 'null',
        student_stars: student?.stars ?? 'null',
        progress_rows_count: displayedProgressRows.length,
        completed_course_id: progressContext?.completedCourseId ?? 'null',
        completed_lesson_id: progressContext?.completedLessonId ?? 'null',
      });
    },
    [
      displayedProgressRows.length,
      noText,
      progressContext?.completedCourseId,
      progressContext?.completedLessonId,
      score,
    ],
  );

  const handleContinueClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void logScoreCardAnalytics(EVENTS.CLICKS_ANALYTICS, 'continue_click');
    onContinueButtonClicked(event);
  };

  useEffect(() => {
    if (progressRows) setResolvedProgressRows(progressRows);
  }, [progressRows]);

  useEffect(() => {
    let isCancelled = false;

    const loadProgressRows = async () => {
      if (
        !showDialogBox ||
        variant !== 'progress' ||
        !showProgressRows ||
        hasProvidedProgressRows
      ) {
        return;
      }

      setIsLoadingRows(true);
      const { student, studentId } = await resolveScoreCardStudentContext();
      const apiHandler = ServiceConfig.getI()?.apiHandler;
      if (!apiHandler) {
        if (!isCancelled) setIsLoadingRows(false);
        return;
      }

      const progressRowsForScoreCard = await buildScoreCardProgressRows({
        api: apiHandler,
        student,
        studentId,
        completedCourseId: progressContext?.completedCourseId,
        completedLessonId: progressContext?.completedLessonId,
        completedHomeworkIndex: progressContext?.completedHomeworkIndex,
        animateDailyReward: progressContext?.animateDailyReward,
        showDailyReward: progressContext?.showDailyReward,
      });

      if (!isCancelled) {
        setResolvedProgressRows(progressRowsForScoreCard);
        setIsLoadingRows(false);
      }
    };

    void loadProgressRows();

    return () => {
      isCancelled = true;
    };
  }, [
    hasProvidedProgressRows,
    showProgressRows,
    progressContext?.animateDailyReward,
    progressContext?.completedCourseId,
    progressContext?.completedLessonId,
    progressContext?.completedHomeworkIndex,
    progressContext?.showDailyReward,
    showDialogBox,
    variant,
  ]);

  useEffect(() => {
    if (!showDialogBox) {
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
  }, [audioUrl, lessonName, message, showDialogBox]);

  useEffect(() => {
    if (!showDialogBox || isLoadingRows || hasLoggedGoalProgressRef.current) {
      return;
    }

    hasLoggedGoalProgressRef.current = true;
    void logScoreCardAnalytics(EVENTS.GOAL_PROGRESS, 'shown');
  }, [
    displayedProgressRows,
    isLoadingRows,
    logScoreCardAnalytics,
    lessonName,
    message,
    progressContext?.animateDailyReward,
    progressContext?.completedCourseId,
    progressContext?.completedHomeworkIndex,
    progressContext?.completedLessonId,
    progressContext?.showDailyReward,
    score,
    showDialogBox,
    showProgressRows,
    variant,
  ]);

  return (
    <div>
      <Dialog
        className={dialogClassName}
        open={showDialogBox}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') return;
          if (reason === 'escapeKeyDown') return;
          handleClose(event);
        }}
        slotProps={{
          backdrop: {
            className: useProgressLayout
              ? 'score-card-dialog__backdrop score-card-dialog__backdrop--progress'
              : 'score-card-dialog__backdrop',
          },
          paper: {
            className: paperClassName,
          },
        }}
      >
        <div id="ScoreCard-Content" className="ScoreCard-Content">
          <DialogContentText className="dialog-content-text">
            <div id="score-card-icons" className="score-card-icons">
              <img src="assets/loading.gif" className="image-icon" alt="" />
              <div id="star-images-component" className="star-images-component">
                <ScoreCardStarIcons score={score} />
              </div>
            </div>
            <ScoreCardTitle score={score} />
            <div id="score-card-content" className="score-card-content">
              <div
                id="score-card-content-message"
                className="score-card-content-message"
              >
                {t(message)}
              </div>
              <div
                id="score-card-content-lesson-name"
                className="score-card-content-lesson-name"
              >
                {t(lessonName)}
              </div>
            </div>
          </DialogContentText>
        </div>
        {isLoadingRows ? null : (
          <>
            <ScoreCardProgressRows rows={displayedProgressRows} />
            <div
              id="ScoreCard-Continue-Button-div"
              className="ScoreCard-Continue-Button-div"
            >
              <button
                id="noButton"
                className={`dialog-box-button-style-score-card ${progressRowCountClass} ${i18n.language === 'kn' ? 'scorecard-button-kn' : ''}`}
                onClick={handleContinueClick}
              >
                <span>{noText}</span>
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default ScoreCard;
