import React, { FC, useEffect, useRef, useState } from 'react';
import { IonPage } from '@ionic/react';
import { t } from 'i18next';
import type { TableTypes } from '../common/constants';
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
  isRespectLidoLaunch: boolean;
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
  shouldShowPathwayProgressRows: boolean;
  shouldShowScoreCardProgressRows: boolean;
  source: string;
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
    isRespectLidoLaunch,
    lessonDetail,
    lessonId,
    playerLanguage,
    push,
    scoreCardProgressState,
    setIsLoading,
    setShowDialogBox,
    shouldShowDailyRewardProgressRow,
    shouldShowPathwayProgressRows,
    shouldShowScoreCardProgressRows,
    source,
    showDialogBox,
    state,
    xmlPath,
    zipUrl,
  } = useLidoPlayerController() as LidoPlayerViewProps;
  const playerRef = useRef<HTMLElement | null>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);

  useEffect(() => {
    if (!isReady || showDialogBox) {
      setIsPlayerLoaded(false);
      return;
    }

    const player = playerRef.current as
      | (HTMLElement & {
          componentOnReady?: () => Promise<unknown>;
        })
      | null;

    if (!player) return;

    let cancelled = false;
    const waitForPlayer = async () => {
      try {
        if (player.componentOnReady) {
          await player.componentOnReady();
        }
      } finally {
        if (!cancelled) setIsPlayerLoaded(true);
      }
    };

    void waitForPlayer();
    return () => {
      cancelled = true;
    };
  }, [isReady, showDialogBox, xmlPath, basePath, zipUrl]);

  return (
    <IonPage>
      <Loading isLoading={isLoading || (isReady && !isPlayerLoaded)} />
      {showDialogBox && (
        <ScoreCard
          score={
            lessonDetail?.plugin_type === 'lido_assessment'
              ? 100
              : Math.round(gameResult?.finalScore ?? 0)
          }
          message={t('You Completed the Lesson :')}
          showDialogBox={showDialogBox}
          lessonName={lessonDetail?.name ?? ''}
          noText={t(isRespectLidoLaunch ? 'Exit' : 'Continue Playing')}
          handleClose={() => setShowDialogBox(false)}
          onContinueButtonClicked={() => {
            setIsLoading(true);
            push();
          }}
          progressContext={{
            completedCourseId: courseDetail?.id ?? courseDocId,
            completedLessonId: lessonDetail?.id ?? lessonId ?? undefined,
            completedAssignmentId:
              state?.homeworkAssignmentId ?? state?.assessmentId,
            completedHomeworkIndex:
              state?.isHomework && typeof state?.homeworkIndex === 'number'
                ? state.homeworkIndex
                : undefined,
            pathwayAssignments: state?.pathwayAssignments,
            animateDailyReward: Boolean(state?.reward),
            showDailyReward: shouldShowDailyRewardProgressRow,
            showStickerProgress:
              shouldShowPathwayProgressRows &&
              !isActivationLesson &&
              state?.isDefaultLesson !== true,
            countCompletedLessonTowardStickerProgress:
              !scoreCardProgressState.isFullPathwayTerminated,
            allowZeroStickerProgress:
              scoreCardProgressState.isFullPathwayTerminated,
            stickerProgressCurrentOverride:
              scoreCardProgressState.isFullPathwayTerminated ? 0 : undefined,
            source,
          }}
          courseId={courseDetail?.id ?? courseDocId}
          lessonId={lessonDetail?.id ?? lessonId ?? undefined}
          showProgressRows={shouldShowScoreCardProgressRows}
          variant="progress"
        />
      )}
      {isReady && (xmlPath || basePath || zipUrl) && !showDialogBox
        ? React.createElement('lido-standalone', {
            ref: playerRef,
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
