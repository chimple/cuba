import React, { useRef } from "react";
import "./HomeworkCompleteModal.css";
import { t } from "i18next";

interface HomeworkCompleteModalProps {
  text: string;
  onClose: () => void;
  onPlayMore: () => void;
  celebrationSrc: string;
  mascotSrc: string;
}

const HomeworkCompleteModal: React.FC<HomeworkCompleteModalProps> = ({
  text,
  onClose,
  onPlayMore,
  celebrationSrc,
  mascotSrc,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="homework-completed-overlay" onClick={onClose}>
      <div
        className="homework-completed-card"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="homework-completed-inner">
          {/* LEFT MASCOT */}
          <div className="homework-completed-left">
            <img src={mascotSrc} alt="mascot" className="hc-mascot" />
          </div>

          {/* MAIN CENTER BLOCK */}
          <div className="homework-completed-center">
            <img
              src={celebrationSrc}
              alt="celebration"
              className="homework-completed-celebration-top"
            />

            <p className="homework-completed-text">{text}</p>

            {/* <button className="hc-play-btn" onClick={onPlayMore}>
              <img
                src="/pathwayAssets/homeworkPlayMoreIcon.svg"
                alt="play"
                className="hc-play-icon"
              />
              <span>{t("Play More")}</span>
            </button> */}
          </div>

          {/* EMPTY RIGHT GAP (MATCH MOCKUP) */}
          <div className="homework-completed-right"></div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkCompleteModal;
// background-image: url("../../../public/pathwayAssets/homeworkCelebration.svg");
