import React, { MouseEventHandler } from "react";
import "./ScoreCard.css";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { Dialog, DialogContentText } from "@mui/material";
import ScoreCardStarIcons from "./ScoreCardStarIcons";
import ScoreCardTitle from "./ScoreCardTitle";
import i18n from "../../i18n";

const ScoreCard: React.FC<{
  showDialogBox: boolean;
  score: number;
  message: string;
  lessonName: string;
  noText: string;
  handleClose: (event: CustomEvent<OverlayEventDetail<any>>) => void;
  onContinueButtonClicked: MouseEventHandler<HTMLButtonElement>;
}> = ({
  showDialogBox,
  message,
  lessonName,
  score,
  noText,
  handleClose,
  onContinueButtonClicked,
}) => {
  return (
    <div>
      <Dialog
        open={showDialogBox}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#FFFDEE",
              width: "346px !important",
              height: "314px !important",
              borderRadius: "22px !important",
            },
          },
        }}
      >
        <div className="ScoreCard-Content">
          <DialogContentText className="dialog-content-text">
            <div className="score-card-icons">
              <img src="assets/loading.gif" className="image-icon" />
              <div className="star-images-component">
                <ScoreCardStarIcons score={score} />
              </div>
            </div>

            <ScoreCardTitle score={score} />

            <div className="score-card-content">
              <div className="score-card-content-message">{message}</div>
              <div className="score-card-content-lesson-name">{lessonName}</div>
            </div>
          </DialogContentText>
        </div>
        <div className="ScoreCard-Continue-Button-div">
          <button
            id={"noButton"}
            className={`dialog-box-button-style-score-card ${i18n.language === "kn" ? "scorecard-button-kn" : ""}`}
            onClick={onContinueButtonClicked}
          >
            <span>{noText}</span>
          </button>
        </div>
      </Dialog>
    </div>
  );
};

export default ScoreCard;
