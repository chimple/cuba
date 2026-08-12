import './HomeworkPathwayStructure.css';
import '../learningPathway/PathwayStructure.css';
import React from 'react';
import ReactDOM from 'react-dom';
import Confetti from 'react-confetti';
import { t } from 'i18next';

import {
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
  RewardBoxState,
} from '../../common/constants';
import DailyRewardModal from '../learningPathway/DailyRewardModal';
import PathwayModal from '../learningPathway/PathwayModal';
import RewardBox from '../learningPathway/RewardBox';
import RewardRive from '../learningPathway/RewardRive';
import ChimpleRiveMascot from '../learningPathway/ChimpleRiveMascot';
import StickerBookPreviewModal, {
  StickerBookModalData,
} from '../learningPathway/StickerBookPreviewModal';

import { HomeworkPathwayStructureProps } from './homeworkPathwayStructureTypes';
import { useHomeworkPathwayStructureController } from './useHomeworkPathwayStructureController';

const HomeworkPathwayStructure: React.FC<HomeworkPathwayStructureProps> = (
  props,
) => {
  const {
    chimpleRiveAnimationName,
    chimpleRiveInputName,
    chimpleRiveStateMachineName,
    chimpleRiveStateValue,
    closeStickerCompletion,
    closeStickerPreview,
    containerRef,
    handleClose,
    handleMascotReplayClick,
    handleOnPlay,
    handleOpen,
    hasTodayReward,
    inactiveText,
    isModalOpen,
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    mascotKey,
    modalText,
    rewardModalOpen,
    rewardRiveContainer,
    rewardRiveState,
    rewardText,
    riveContainer,
    setModalOpen,
    shouldAnimate,
    showRewardConfetti,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  } = useHomeworkPathwayStructureController(props);

  return (
    <>
      {isModalOpen && (
        <PathwayModal
          text={modalText}
          onClose={() => setModalOpen(false)}
          onConfirm={() => setModalOpen(false)}
          animate={shouldAnimate}
          audioFolder={
            modalText === inactiveText
              ? 'lessonLocked'
              : modalText === rewardText
                ? 'completeLesson'
                : undefined
          }
          audioClipName={
            modalText === inactiveText
              ? 'lesson_locked'
              : modalText === rewardText
                ? 'complete_lesson_to_get_reward'
                : undefined
          }
        />
      )}
      <div className="homeworkpathway-structure-div" ref={containerRef}></div>
      {riveContainer &&
        ReactDOM.createPortal(
          <div className="homeworkpathway-mascot-wrapper">
            <ChimpleRiveMascot
              key={mascotKey}
              stateMachine={chimpleRiveStateMachineName}
              inputName={chimpleRiveInputName}
              stateValue={chimpleRiveStateValue}
              animationName={chimpleRiveAnimationName}
              onClick={handleMascotReplayClick}
              overlayRules={[
                {
                  stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
                  inputName: CHIMPLE_MASCOT_INPUT_REWARD,
                },
              ]}
            />
          </div>,
          riveContainer,
        )}

      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer,
        )}

      {showRewardConfetti && (
        <Confetti
          className="HomeworkPathwayStructure-reward-confetti"
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={180}
          gravity={0.28}
        />
      )}

      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleOpen} />
      )}

      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={t('Play one lesson and collect your daily reward!')}
          onClose={handleClose}
          onPlay={handleOnPlay}
        />
      )}

      {isStickerPreviewOpen && stickerPreviewData && (
        <StickerBookPreviewModal
          data={stickerPreviewData}
          variant={stickerPreviewTrigger}
          launchMotion={stickerPreviewLaunchMotion}
          flyoutMotion={stickerPreviewFlyoutMotion}
          onClose={closeStickerPreview}
        />
      )}

      {isStickerCompletionOpen && stickerCompletionData && (
        <StickerBookPreviewModal
          data={stickerCompletionData}
          mode="completion"
          onClose={closeStickerCompletion}
        />
      )}
    </>
  );
};

export default HomeworkPathwayStructure;
