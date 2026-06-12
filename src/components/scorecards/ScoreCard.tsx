import React, { MouseEventHandler, useEffect, useState } from 'react';
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
import { TableTypes } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { buildScoreCardProgressRows } from './scoreCardLogic';

const SCORECARD_AUDIO_URL = '/assets/audios/scorecard/victory.mp3';
const EMPTY_PROGRESS_ROWS: ScoreCardProgressRowData[] = [];

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
    animateDailyReward?: boolean;
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
  const handleContinueClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
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

      const { student, studentId } = await resolveScoreCardStudentContext();
      const progressRowsForScoreCard = await buildScoreCardProgressRows({
        api: ServiceConfig.getI().apiHandler,
        student,
        studentId,
        completedCourseId: progressContext?.completedCourseId,
        completedLessonId: progressContext?.completedLessonId,
        animateDailyReward: progressContext?.animateDailyReward,
      });

      if (!isCancelled) setResolvedProgressRows(progressRowsForScoreCard);
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
    showDialogBox,
    variant,
  ]);

  useEffect(() => {
    if (!showDialogBox) {
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
      </Dialog>
    </div>
  );
};

export default ScoreCard;
