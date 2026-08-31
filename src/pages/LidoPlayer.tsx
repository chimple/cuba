import React, { FC } from 'react';
import { IonPage } from '@ionic/react';
import { t } from 'i18next';
import { TableTypes } from '../common/constants';
import Loading from '../components/Loading';
import ScoreCard from '../components/scorecards/ScoreCard';
import { useLidoPlayerController } from './useLidoPlayerController';

interface LidoPlayerViewProps {
  basePath?: string;
  courseDetail?: TableTypes<'course'>;
  courseDocId?: string;
  gameResult: any;
  isActivationLesson: boolean;
  isLoading: boolean;
  isReady: boolean;
  lessonDetail?: TableTypes<'lesson'>;
  lessonId?: string;
  playerLanguage: string;
  push: () => void;
  scoreCardProgressState: {
    isAborted: boolean;
    isFullPathwayTerminated: boolean;
  };
  setIsLoading: (isLoading: boolean) => void;
  setShowDialogBox: (show: boolean) => void;
  shouldShowDailyRewardProgressRow: boolean;
  shouldShowScoreCardProgressRows: boolean;
  showDialogBox: boolean;
  state: any;
  xmlPath?: string;
  zipUrl?: string;
  commonAudioPath?: string;
}

const LidoPlayer: FC = () => {
  const {
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
  } = useLidoPlayerController() as LidoPlayerViewProps;

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
