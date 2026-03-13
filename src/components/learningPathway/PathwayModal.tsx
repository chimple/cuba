import React, { useRef } from "react";
import "./PathwayModal.css";
import { t } from "i18next";

interface PathwayModalProps {
  text: string;
  onClose: () => void;
  animate?: boolean;
  onConfirm: () => void;
}

const PathwayModal: React.FC<PathwayModalProps> = ({
  text,
  onClose,
  animate = false,
  onConfirm,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="PathwayModal-overlay">
      <div className='PathwayModal-content' ref={ref}>
          <button className="PathwayModal-close" onClick={onClose}>
            <img src='pathwayAssets/menuCross.svg' alt="close-icon" />
          </button>
          
          <div>
            <p className="PathwayModal-text">{text}</p>
            <button
              className="learning-pathway-OK-button"
              onClick={onConfirm}
            >
              <span className="learning-pathway-ok-text">{t("OK")}</span>
            </button>
          </div>
      </div>
       
    </div>
  );
};

export default PathwayModal;
