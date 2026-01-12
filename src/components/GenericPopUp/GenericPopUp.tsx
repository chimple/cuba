import React from "react";
import "./GenericPopup.css";

interface Props {
  thumbnailImageUrl: string;
  backgroundImageUrl?: string;
  heading: string;
  subHeading?: string;
  details?: string[];
  buttonText: string;
  onClose: () => void;
  onAction: () => void;
}

const GenericPopup: React.FC<Props> = ({
  thumbnailImageUrl,
  backgroundImageUrl,
  heading,
  subHeading,
  details = [],
  buttonText,
  onClose,
  onAction,
}) => {
  return (
    <div
      id="generic-popup-overlay"
      className="generic-popup-overlay"
    >
      <div
        id="generic-popup-card"
        className="generic-popup-card"
      >
        {/* Close */}
        <button
          id="generic-popup-close"
          className="generic-popup-close"
          onClick={onClose}
        >
          <img
            id="generic-popup-close-icon"
            className="generic-popup-close-icon"
            src="/assets/icons/Closebutton.svg"
            alt="close"
          />
        </button>

        {/* Background image */}
        <img
          id="generic-popup-bg-image"
          className="generic-popup-bg-image"
          src={backgroundImageUrl}
          alt=""
        />

        <div
          id="generic-popup-content"
          className="generic-popup-content"
        >
          {/* Left thumbnail */}
          <div
            id="generic-popup-thumb-wrapper"
            className="generic-popup-thumb-wrapper"
          >
            <img
              id="generic-popup-thumb"
              className="generic-popup-thumb"
              src={thumbnailImageUrl}
              alt=""
            />
          </div>

          {/* Text content */}
          <div
            id="generic-popup-text-wrapper"
            className="generic-popup-text-wrapper"
          >
            <h2
              id="generic-popup-heading"
              className="generic-popup-heading"
            >
              {heading}
            </h2>

            {subHeading && (
              <p
                id="generic-popup-subheading"
                className="generic-popup-subheading"
              >
                {subHeading}
              </p>
            )}

            {details.length > 0 && (
              <ul
                id="generic-popup-details"
                className="generic-popup-details"
              >
                {details.map((item, idx) => (
                  <li
                    id={`generic-popup-detail-${idx}`}
                    className="generic-popup-detail-item"
                    key={idx}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <button
              id="generic-popup-cta"
              className="generic-popup-cta"
              onClick={onAction}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericPopup;
