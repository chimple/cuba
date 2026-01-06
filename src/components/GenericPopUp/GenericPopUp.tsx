import React from "react";
import "./GenericPopup.css";

interface Props {
  imageUrl: string;
  bodyText: string;
  buttonText: string;
  onClose: () => void;
  onAction: () => void;
}

const GenericPopup: React.FC<Props> = ({
  imageUrl,
  bodyText,
  buttonText,
  onClose,
  onAction,
}) => {
  return (
    <div className="generic-popup-overlay">
      <div className="generic-popup-card">
        <button className="generic-popup-close" onClick={onClose}>✕</button>

        <img src={imageUrl} className="generic-popup-image" alt="" />

        <p className="generic-popup-text">{bodyText}</p>

        <button className="generic-popup-cta" onClick={onAction}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default GenericPopup;
