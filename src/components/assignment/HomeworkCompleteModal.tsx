// HomeworkCompleteModal.tsx
import React, { useRef } from "react";
import "./HomeworkCompleteModal.css";
import { t } from "i18next";
import ChimpleRiveMascot from "../learningPathway/ChimpleRiveMascot";

interface HomeworkCompleteModalProps {
  text: string;
  onClose: () => void;
  onPlayMore: () => void;
  borderImageSrc: string;
}

const HomeworkCompleteModal: React.FC<HomeworkCompleteModalProps> = ({
  text,
  onClose,
  onPlayMore,
  borderImageSrc,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const cardStyle = {
    backgroundImage: `url(${borderImageSrc})`,
  };

  const chimpleRiveStateMachineName = "State Machine 3";
  const chimpleRiveInputName = "Number 2";
  const chimpleRiveStateValue = 1;
  const chimpleRiveAnimationName = "";

  return (
    <div
      className="homework-completed-overlay"
      // sonClick={onClose}
    >
      <div
        className="homework-completed-card"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        style={cardStyle}
      >
        <div className="homework-completed-inner">
          {/* LEFT MASCOT - Rive in a sized wrapper */}
          <div className="homework-completed-left">
            <div className="homework-completed-mascot-rive">
              <ChimpleRiveMascot
                key="mascot-idle"
                stateMachine={chimpleRiveStateMachineName}
                inputName={chimpleRiveInputName}
                stateValue={chimpleRiveStateValue}
                animationName={chimpleRiveAnimationName}
              />
            </div>
          </div>

          {/* MAIN CENTER BLOCK */}
          <div className="homework-completed-center">
            <p className="homework-completed-text">{text}</p>
            <button
              className="homework-completed-play-btn"
              onClick={onPlayMore}
            >
              <img
                src="/assets/icons/HomeIcon.svg"
                alt="play"
                className="homework-completed-play-icon"
              />
              {t("Play More")}
            </button>
          </div>

          <div className="homework-completed-right" />
        </div>
      </div>
    </div>
  );
};

export default HomeworkCompleteModal;
