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
    <div className="popup-overlay">
      <div className="popup-card">
        <button className="popup-close" onClick={onClose}>✕</button>

        <img src={imageUrl} className="popup-image" alt="" />

        <p className="popup-text">{bodyText}</p>

        <button className="popup-cta" onClick={onAction}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default GenericPopup;
