import React, { useRef } from "react";
import "./HomeworkCompleteModal.css";
import { t } from "i18next";

interface HomeworkCompleteModalProps {
  text: string;
  onClose: () => void;
  onPlayMore: () => void;
  mascotSrc: string;
  borderImageSrc: string; 
}

const HomeworkCompleteModal: React.FC<HomeworkCompleteModalProps> = ({
  text,
  onClose,
  onPlayMore,
  mascotSrc,
  borderImageSrc,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const cardStyle = {
    backgroundImage: `url(${borderImageSrc})`,
  };

  return (
    <div className="homework-completed-overlay" onClick={onClose}>
      <div
        className="homework-completed-card"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        style={cardStyle}
      >
        <div className="homework-completed-inner">
          {/* LEFT MASCOT */}
          <div className="homework-completed-left">
            <img src={mascotSrc} alt="mascot" className="homework-completed-mascot" />
          </div>

          {/* MAIN CENTER BLOCK */}
          <div className="homework-completed-center">
            <img
              src={borderImageSrc}
              alt="celebration"
              className="homework-completed-celebration-top"
            />

            <p className="homework-completed-text">{text}</p>

          </div>

          {/* EMPTY RIGHT GAP (MATCH MOCKUP) */}
          <div className="homework-completed-right"></div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkCompleteModal;
