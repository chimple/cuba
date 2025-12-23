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

  return (
    <div className="homework-completed-banner" onClick={onClose}>
      <div
        className="homework-completed-card"
        ref={ref}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking card
      >
        <div className="homework-completed-inner">
          {/* LEFT MASCOT - RIVE */}
          <div className="homework-completed-left">
            <div className="homework-completed-mascot homework-completed-mascot-rive">
              <ChimpleRiveMascot
                // you can tweak these to use your “celebration” state
                stateMachine="State Machine 1"
                inputName="Number 1"
                stateValue={1}
                animationName={"win"}
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
