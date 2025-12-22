import React from "react";
import ReactDOM from "react-dom";
import "./PathwayStructure.css";

import PathwayModal from "./PathwayModal";
import ChimpleRiveMascot from "./ChimpleRiveMascot";
import RewardBox from "./RewardBox";
import DailyRewardModal from "./DailyRewardModal";
import RewardRive from "./RewardRive";

import { useHistory } from "react-router";
import { usePathwayData } from "../../hooks/usePathwayData";
import { usePathwaySVG } from "../../hooks/usePathwaySVG";

const PathwayStructure: React.FC = () => {
  const history = useHistory();

  const {
    // refs
    containerRef,

    // modal
    modalOpen,
    modalText,
    setModalOpen,
    setModalText,
    shouldAnimate,

    // rive containers
    riveContainer,
    rewardRiveContainer,

    // mascot
    mascotProps,
    mascotKey,

    // reward rive box animation
    rewardRiveState,

    // reward logic
    hasTodayReward,
    isRewardFeatureOn,
    rewardModalOpen,
    isCampaignFinished,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,

    // NEW — functions for SVG to use instead of window globals
    getCachedLesson,
    updateMascotToNormalState,
    invokeMascotCelebration,
    setRewardRiveState,
    setRiveContainer,
    setRewardRiveContainer,
    setHasTodayReward,
    setCurrentCourse,
    setCurrentChapter,
    setIsRewardPathLoaded,
    isRewardPathLoaded,
    checkAndUpdateReward,
  } = usePathwayData();

  // Mounts SVG with everything needed
  usePathwaySVG({
    containerRef,
    setModalOpen,
    setModalText,

    history,
    getCachedLesson,
    updateMascotToNormalState,
    invokeMascotCelebration,
    setRewardRiveState,
    setRiveContainer,
    setRewardRiveContainer,
    setHasTodayReward,
    setCurrentCourse,
    setCurrentChapter,
    setIsRewardPathLoaded,
    isRewardPathLoaded,
    checkAndUpdateReward,
  });

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <PathwayModal
          text={modalText}
          onClose={() => setModalOpen(false)}
          onConfirm={() => setModalOpen(false)}
          animate={shouldAnimate}
        />
      )}

      {/* SVG Root Container */}
      <div className="pathway-structure-div" ref={containerRef} />

      {/* Chimple Mascot */}
      {riveContainer &&
        ReactDOM.createPortal(
          <ChimpleRiveMascot
            key={mascotKey}
            stateMachine={mascotProps.stateMachine}
            inputName={mascotProps.inputName}
            stateValue={mascotProps.stateValue}
            animationName={mascotProps.animationName}
          />,
          riveContainer
        )}

      {/* Reward Box Rive */}
      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer
        )}

      {/* Daily reward icon */}
      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleRewardBoxOpen} />
      )}

      {/* Daily Reward modal */}
      {rewardModalOpen && isRewardFeatureOn  && (
        <DailyRewardModal
          text={"Play one lesson and collect your daily reward!"}
          onClose={handleRewardModalClose}
          onPlay={handleRewardModalPlay}
        />
      )}
    </>
  );
};

export default PathwayStructure;
