import { FC } from "react";
import { t } from "i18next";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
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
              <h3 className="assign-screen-card-title">{t("Library")}</h3>
            </div>
            <ArrowForwardRoundedIcon className="assign-screen-arrow" />
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
              <h3 className="assign-screen-card-title">{t("Scan QR")}</h3>
            </div>
            <ArrowForwardRoundedIcon className="assign-screen-arrow" />
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
              <h3 className="assign-screen-card-title">{t("Recommended")}</h3>
            </div>
            <ArrowForwardRoundedIcon className="assign-screen-arrow" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AssignScreen;

