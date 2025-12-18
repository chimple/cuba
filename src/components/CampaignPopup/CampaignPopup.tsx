import React from "react";
import "./CampaignPopup.css";

interface CampaignPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  title: string;
  subtitle: string;
  rowText: string;
  dateText: string;
  ctaText: string;
}

const CampaignPopup: React.FC<CampaignPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  rowText,
  dateText,
  ctaText,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="campaign-popup-overlay"
      className="CampaignPopup-overlay"
    >
      <div
        id="campaign-popup-card"
        className="CampaignPopup-card"
      >
        {/* Close button */}
        <button
          id="campaign-popup-close-btn"
          className="CampaignPopup-close"
          onClick={onClose}
        >
          <img
            id="campaign-popup-close-icon"
            src="pathwayAssets/menuCross.svg"
            alt="close"
          />
        </button>

        {/* Main content row */}
        <div
          id="campaign-popup-body"
          className="CampaignPopup-campaign-body"
        >
          {/* LEFT: Kid */}
          <img
            id="campaign-popup-kid-image"
            src="assets/campaignPopup/campaignPopupKid.svg"
            alt="kid with trophy"
            className="CampaignPopup-campaign-kid"
          />

          {/* RIGHT: Text content */}
          <div
            id="campaign-popup-text"
            className="CampaignPopup-campaign-text"
          >
            <h2
              id="campaign-popup-title"
              className="CampaignPopup-campaign-title"
            >
              {title}
            </h2>

            <p
              id="campaign-popup-subtitle"
              className="CampaignPopup-campaign-sub"
            >
              {subtitle}
            </p>

            <div
              id="campaign-popup-row"
              className="CampaignPopup-campaign-row"
            >
              <img
                id="campaign-popup-row-icon-left"
                src="assets/campaignPopup/campaignPopupPen.svg"
                alt="pen"
                className="CampaignPopup-campaign-icon"
              />

              <span
                id="campaign-popup-row-text"
                className="CampaignPopup-campaign-row-text"
              >
                {rowText}
              </span>

              <img
                id="campaign-popup-row-icon-right"
                src="assets/campaignPopup/campaignPopupPencil.svg"
                alt="pencil"
                className="CampaignPopup-campaign-icon"
              />
            </div>

            <p
              id="campaign-popup-dates"
              className="CampaignPopup-campaign-dates"
            >
              {dateText}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          id="campaign-popup-cta-btn"
          className="CampaignPopup-campaign-cta"
          onClick={onConfirm}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
};

export default CampaignPopup;
