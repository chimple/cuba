import { FC } from "react";
import { t } from "i18next";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
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
            <div className="assign-screen-icon-wrapper assign-screen-icon-library-bg">
              <img
                src="assets/icons/bookSelected.png"
                alt={t("Library") || "Library"}
                className="assign-screen-card-image"
              />
            </div>
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
            <div className="assign-screen-icon-wrapper assign-screen-icon-scan-bg">
              <QrCode2RoundedIcon className="assign-screen-icon assign-screen-icon-scan" />
            </div>
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
            <div className="assign-screen-icon-wrapper assign-screen-icon-recommend-bg">
              <ThumbUpAltRoundedIcon className="assign-screen-icon assign-screen-icon-recommend" />
            </div>
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
