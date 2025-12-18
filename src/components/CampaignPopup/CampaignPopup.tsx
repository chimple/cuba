import React from "react";
import "./CampaignPopup.css";

interface CampaignPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CampaignPopup: React.FC<CampaignPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="CampaignPopup-overlay">
      <div className="CampaignPopup-card">
        {/* Close button */}
        <button className="CampaignPopup-close" onClick={onClose}>
          <img src="pathwayAssets/menuCross.svg" alt="close" />
        </button>

        {/* Main content row */}
        <div className="CampaignPopup-campaign-body">
          {/* LEFT: Kid */}
          <img
            src="assets/campaignPopup/campaignPopupKid.svg"
            alt="kid with trophy"
            className="CampaignPopup-campaign-kid"
          />

          {/* RIGHT: Text content */}
          <div className="CampaignPopup-campaign-text">
            <h2 className="CampaignPopup-campaign-title">
              सर्दी विजेता प्रतियोगिता
            </h2>

            <p className="CampaignPopup-campaign-sub">
              ठंड में पढ़ाई, जीत की बधाई!
            </p>

            <div className="CampaignPopup-campaign-row">
              <img
                src="assets/campaignPopup/campaignPopupPen.svg"
                alt="pen"
                className="CampaignPopup-campaign-icon"
              />

              <span className="CampaignPopup-campaign-row-text">
                खेलो और जीतो इनाम!
              </span>

              <img
                src="assets/campaignPopup/campaignPopupPencil.svg"
                alt="pencil"
                className="CampaignPopup-campaign-icon"
              />
            </div>

            <p className="CampaignPopup-campaign-dates">
              (25 दिसंबर 2025 – 11 जनवरी 2026)
            </p>
          </div>
        </div>

        {/* CTA */}
        <button className="CampaignPopup-campaign-cta" onClick={onConfirm}>
          आओ खेलें
        </button>
      </div>
    </div>
  );
};

export default CampaignPopup;
