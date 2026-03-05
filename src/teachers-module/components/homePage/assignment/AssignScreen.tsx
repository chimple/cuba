import { FC } from "react";
import { t } from "i18next";
import { ReactComponent as AssignScreenArrowIcon } from "../../../assets/icons/assign-screen-arrow.svg";
import "./AssignScreen.css";

interface AssignScreenProps {
  onLibraryClick: () => void;
  onScanQrClick: () => void;
  onRecommendedClick: () => void;
}

const AssignScreen: FC<AssignScreenProps> = ({
  onLibraryClick,
  onScanQrClick,
  onRecommendedClick,
}) => {
  return (
    <section className="assign-screen">
      <div id="assign-screen-content" className="assign-screen-content">
        <h2 id="assign-screen-heading" className="assign-screen-heading">
          {t("Choose from the three options for assignments")}
        </h2>

        <div id="assign-screen-card-list" className="assign-screen-card-list">
          <button
            type="button"
            id="assign-screen-card assign-screen-card-library"
            className="assign-screen-card assign-screen-card-library"
            onClick={onLibraryClick}
          >
            <img
              src="assets/books.png"
              alt={t("Library") || "Library"}
              id="assign-screen-card-image assign-screen-icon-library-bg"
              className="assign-screen-card-image assign-screen-icon-library-bg"
            />
            <div id="assign-screen-card-text" className="assign-screen-text">
              <p id="assign-screen-card-caption" className="assign-screen-card-caption">
                {t(
                  "Choose from 300+ assignments across multiple subjects to assign homework"
                )}
              </p>
              <div id="assign-screen-card-bottom" className="assign-screen-card-bottom">
                <h3 id="assign-screen-card-title" className="assign-screen-card-title">{t("Library")}</h3>
                <span id="assign-screen-arrow-wrap" className="assign-screen-arrow-wrap">
                  <AssignScreenArrowIcon
                    id="assign-screen-arrow"
                    className="assign-screen-arrow"
                    aria-hidden="true"
                    focusable="false"
                  />
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            id="assign-screen-card assign-screen-card-scan"
            className="assign-screen-card assign-screen-card-scan"
            onClick={onScanQrClick}
          >
            <img
              src="assets/qr.png"
              alt={t("Scan QR") || "Scan QR"}
              id="assign-screen-card-image assign-screen-icon-scan-bg"
              className="assign-screen-card-image assign-screen-icon-scan-bg"
            />
            <div id="assign-screen-card-text" className="assign-screen-text">
              <p id="assign-screen-card-caption" className="assign-screen-card-caption">
                {t("Scan chapters from your textbook to instantly assign homework")}
              </p>
              <div id="assign-screen-card-bottom" className="assign-screen-card-bottom">
                <h3 id="assign-screen-card-title" className="assign-screen-card-title">{t("Scan QR")}</h3>
                <span id="assign-screen-arrow-wrap" className="assign-screen-arrow-wrap">
                  <AssignScreenArrowIcon
                    id="assign-screen-arrow"
                    className="assign-screen-arrow"
                    aria-hidden="true"
                    focusable="false"
                  />
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            id="assign-screen-card assign-screen-card-recommend"
            className="assign-screen-card assign-screen-card-recommend"
            onClick={onRecommendedClick}
          >
            <img
              src="assets/thumb.png"
              alt={t("Recommended") || "Recommended"}
              id="assign-screen-card-image assign-screen-icon-recommend-bg"
              className="assign-screen-card-image assign-screen-icon-recommend-bg"
            />
            <div id="assign-screen-card-text" className="assign-screen-text">
              <p id="assign-screen-card-caption" className="assign-screen-card-caption">
                {t("Pre-selected assignments aligned for academic growth")}
              </p>
              <div id="assign-screen-card-bottom" className="assign-screen-card-bottom">
                <h3 id="assign-screen-card-title" className="assign-screen-card-title">{t("Recommended")}</h3>
                <span id="assign-screen-arrow-wrap" className="assign-screen-arrow-wrap">
                  <AssignScreenArrowIcon
                    id="assign-screen-arrow"
                    className="assign-screen-arrow"
                    aria-hidden="true"
                    focusable="false"
                  />
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

