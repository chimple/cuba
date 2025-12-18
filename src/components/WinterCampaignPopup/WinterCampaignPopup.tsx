import React from "react";
import "./WinterCampaignPopup.css";

interface WinterCampaignPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  title: string;
  subtitle: string;
  rowText: string;
  dateText: string;
  ctaText: string;
}

const WinterCampaignPopup: React.FC<WinterCampaignPopupProps> = ({
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
      id="wintercampaign-popup-overlay"
      className="WinterCampaignPopup-overlay"
    >
      <div id="wintercampaign-popup-card" className="WinterCampaignPopup-card">
        {/* Close button */}
        <button
          id="wintercampaign-popup-close-btn"
          className="WinterCampaignPopup-close"
          onClick={onClose}
        >
          <img
            id="wintercampaign-popup-close-icon"
            src="pathwayAssets/menuCross.svg"
            alt="close"
          />
        </button>

        {/* Main content row */}
        <div
          id="wintercampaign-popup-body"
          className="WinterCampaignPopup-campaign-body"
        >
          {/* LEFT: Kid */}
          <img
            id="wintercampaign-popup-kid-image"
            src="assets/campaignPopup/campaignPopupKid.svg"
            alt="kid with trophy"
            className="WinterCampaignPopup-campaign-kid"
          />

          {/* RIGHT: Text content */}
          <div
            id="wintercampaign-popup-text"
            className="WinterCampaignPopup-campaign-text"
          >
            <h2
              id="wintercampaign-popup-title"
              className="WinterCampaignPopup-campaign-title"
            >
              {title}
            </h2>

            <p
              id="wintercampaign-popup-subtitle"
              className="WinterCampaignPopup-campaign-sub"
            >
              {subtitle}
            </p>

            <div
              id="wintercampaign-popup-row"
              className="WinterCampaignPopup-campaign-row"
            >
              <img
                id="wintercampaign-popup-row-icon-left"
                src="assets/campaignPopup/campaignPopupPen.svg"
                alt="pen"
                className="WinterCampaignPopup-campaign-icon"
              />

              <span
                id="wintercampaign-popup-row-text"
                className="WinterCampaignPopup-campaign-row-text"
              >
                {rowText}
              </span>

              <img
                id="wintercampaign-popup-row-icon-right"
                src="assets/campaignPopup/campaignPopupPencil.svg"
                alt="pencil"
                className="WinterCampaignPopup-campaign-icon"
              />
            </div>

            <p
              id="wintercampaign-popup-dates"
              className="WinterCampaignPopup-campaign-dates"
            >
              {dateText}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          id="wintercampaign-popup-cta-btn"
          className="WinterCampaignPopup-campaign-cta"
          onClick={onConfirm}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
};

export default WinterCampaignPopup;
