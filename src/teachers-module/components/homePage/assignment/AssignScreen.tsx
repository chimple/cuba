import { FC } from "react";
import { t } from "i18next";
import "./AssignScreen.css";

interface AssignScreenProps {
  onLibraryClick: () => void;
  onScanQrClick: () => void;
  onRecommendedClick: () => void;
}

const AssignScreenArrow: FC = () => (
  <svg
    className="assign-screen-arrow"
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="15"
    viewBox="0 0 40 15"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M39.7071 8.07112C40.0976 7.6806 40.0976 7.04743 39.7071 6.65691L33.3431 0.292946C32.9526 -0.0975785 32.3195 -0.0975785 31.9289 0.292946C31.5384 0.68347 31.5384 1.31664 31.9289 1.70716L37.5858 7.36401L31.9289 13.0209C31.5384 13.4114 31.5384 14.0446 31.9289 14.4351C32.3195 14.8256 32.9526 14.8256 33.3431 14.4351L39.7071 8.07112ZM0 7.36401L0 8.36401L39 8.36401V7.36401V6.36401L0 6.36401L0 7.36401Z"
      fill="currentColor"
    />
  </svg>
);

const AssignScreen: FC<AssignScreenProps> = ({
  onLibraryClick,
  onScanQrClick,
  onRecommendedClick,
}) => {
  return (
    <section className="assign-screen">
      <div className="assign-screen-content">
        <h2 className="assign-screen-heading">
          {t("Choose from the three options for assignments")}
        </h2>

        <div className="assign-screen-card-list">
          <button
            type="button"
            className="assign-screen-card assign-screen-card-library"
            onClick={onLibraryClick}
          >
            <img
              src="assets/books.png"
              alt={t("Library") || "Library"}
              className="assign-screen-card-image assign-screen-icon-library-bg"
            />
            <div className="assign-screen-text">
              <p className="assign-screen-card-caption">
                {t(
                  "Choose from 300+ assignments across multiple subjects to assign homework"
                )}
              </p>
              <div className="assign-screen-card-bottom">
                <h3 className="assign-screen-card-title">{t("Library")}</h3>
                <span className="assign-screen-arrow-wrap">
                  <AssignScreenArrow />
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="assign-screen-card assign-screen-card-scan"
            onClick={onScanQrClick}
          >
            <img
              src="assets/qr.png"
              alt={t("Scan QR") || "Scan QR"}
              className="assign-screen-card-image assign-screen-icon-scan-bg"
            />
            <div className="assign-screen-text">
              <p className="assign-screen-card-caption">
                {t("Scan chapters from your textbook to instantly assign homework")}
              </p>
              <div className="assign-screen-card-bottom">
                <h3 className="assign-screen-card-title">{t("Scan QR")}</h3>
                <span className="assign-screen-arrow-wrap">
                  <AssignScreenArrow />
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="assign-screen-card assign-screen-card-recommend"
            onClick={onRecommendedClick}
          >
            <img
              src="assets/thumb.png"
              alt={t("Recommended") || "Recommended"}
              className="assign-screen-card-image assign-screen-icon-recommend-bg"
            />
            <div className="assign-screen-text">
              <p className="assign-screen-card-caption">
                {t("Pre-selected assignments aligned for academic growth")}
              </p>
              <div className="assign-screen-card-bottom">
                <h3 className="assign-screen-card-title">{t("Recommended")}</h3>
                <span className="assign-screen-arrow-wrap">
                  <AssignScreenArrow />
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default AssignScreen;

