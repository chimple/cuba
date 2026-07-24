import './PathwayStructure.css';
import React from 'react';
import ReactDOM from 'react-dom';
import Confetti from 'react-confetti';
import { t } from 'i18next';
import PathwayModal from './PathwayModal';
import ChimpleRiveMascot from './ChimpleRiveMascot';
import RewardBox from './RewardBox';
import DailyRewardModal from './DailyRewardModal';
import RewardRive from './RewardRive';
import StickerBookPreviewModal from './StickerBookPreviewModal';
import SkeltonLoading, {
  PATHWAY_STRUCTURE_SKELETON_HEADER,
} from '../SkeltonLoading';
import {
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
} from '../../common/constants';

import { usePathwayStructureController } from './usePathwayStructureController';

const PathwayStructure: React.FC = () => {
  const {
    closePathwayModal,
    closeStickerCompletion,
    closeStickerPreview,
    confirmPathwayModal,
    containerRef,
    handleMascotReplayClick,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,
    hasTodayReward,
    inactiveText,
    isPathwaySvgLoading,
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    mascotKey,
    mascotProps,
    modalOpen,
    modalText,
    rewardModalOpen,
    rewardRiveContainer,
    rewardRiveState,
    rewardText,
    riveContainer,
    shouldAnimate,
    showRewardConfetti,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  } = usePathwayStructureController();

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <PathwayModal
          text={modalText}
          onClose={closePathwayModal}
          onConfirm={confirmPathwayModal}
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
      {/* SVG Root Container */}
      <div
        className="PathwayStructure-div"
        ref={containerRef}
        style={{
          opacity: isPathwaySvgLoading ? 0 : 1,
        }}
      />
      <SkeltonLoading
        isLoading={isPathwaySvgLoading}
        header={PATHWAY_STRUCTURE_SKELETON_HEADER}
      />

      {/* Chimple Mascot */}
      {riveContainer &&
        ReactDOM.createPortal(
          <ChimpleRiveMascot
            key={mascotKey}
            stateMachine={mascotProps.stateMachine}
            inputName={mascotProps.inputName}
            stateValue={mascotProps.stateValue}
            animationName={mascotProps.animationName}
            onClick={handleMascotReplayClick}
            overlayRules={[
              {
                stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
                inputName: CHIMPLE_MASCOT_INPUT_REWARD,
              },
            ]}
          />,
          riveContainer,
        )}

      {/* Reward Box Rive */}
      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer,
        )}

      {showRewardConfetti && (
        <Confetti
          className="PathwayStructure-reward-confetti"
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={180}
          gravity={0.28}
        />
      )}

      {/* Daily reward icon */}
      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleRewardBoxOpen} />
      )}

      {/* Daily Reward modal */}
      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={t('Play one lesson and collect your daily reward!')}
          onClose={handleRewardModalClose}
          onPlay={handleRewardModalPlay}
        />
      )}

      {isStickerPreviewOpen && stickerPreviewData && (
        <StickerBookPreviewModal
          data={stickerPreviewData}
          variant={
            stickerPreviewTrigger === 'pathway_completion_auto'
              ? 'drag_collect'
              : 'preview'
          }
          launchMotion={stickerPreviewLaunchMotion}
          flyoutMotion={stickerPreviewFlyoutMotion}
          onClose={closeStickerPreview}
        />
      )}

      {isStickerCompletionOpen && stickerCompletionData && (
        <StickerBookPreviewModal
          data={stickerCompletionData}
          mode="completion"
          onClose={
            closeStickerCompletion as (
              reason: 'close_button' | 'backdrop' | 'acknowledge_button',
            ) => void
          }
        />
      )}
    </>
  );
};

export default PathwayStructure;
