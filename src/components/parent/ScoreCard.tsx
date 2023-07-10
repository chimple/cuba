import React, { MouseEventHandler } from "react";
// import { IonAlert, IonButton, IonIcon } from "@ionic/react";
import "./ScoreCard.css";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { t } from "i18next";
import { chevronForward } from "ionicons/icons";
import { title } from "process";
import { IoCloseCircle } from "react-icons/io5";
import { PAGES } from "../../common/constants";
import { AiTwotoneHeart } from "react-icons/ai";
import { GrFormNext } from "react-icons/gr";
import ScoreCardStarIcons from "./ScoreCardStarIcons";

const ScoreCard: React.FC<{
  width: string;
  height: string;
  showDialogBox: boolean;
  title: string;
  score: number;
  message: string;
  lessonName: string;
  yesText: string;
  noText: string;
  handleClose: (event: CustomEvent<OverlayEventDetail<any>>) => void;
  onYesButtonClicked: MouseEventHandler<HTMLDivElement>;
  onContinueButtonClicked: MouseEventHandler<HTMLDivElement>;
}> = ({
  width,
  height,
  showDialogBox,
  message,
  lessonName,
  title,
  score,
  yesText,
  noText,
  handleClose,
  onYesButtonClicked,
  onContinueButtonClicked,
}) => {
  return (
    <div>
      <Dialog
        open={showDialogBox}
        onClose={handleClose}
        sx={{
          "& .MuiPaper-root": { borderRadius: "6vh !important" },
          "& .MuiTypography-root": { margin: "0% 0% 0% 0% !important" },
          "& .MuiDialogActions-root": { color: "white" },
          "& .MuiDialogContent-root" : { padding : "2vh 6vh !important" },
        }}
      >
        <DialogContent
          style={{
            // padding: "8% 5%",
            textAlign: "center",
            width: width,
            height: height,
          }}
        >
          <DialogContentText className="dialog-content-text">
            <div className="score-card-icons">
              <img src="assets/loading.gif" className="image-icon" />
              <div className="star-images-component">
                <ScoreCardStarIcons score={score} />
              </div>
            </div>

            <div className="title-scoreCard">{title}</div>

            <div className="score-card-content">
              <div className="score-card-content-message">{message}</div>
              <div className="score-card-content-lesson-name">{lessonName}</div>
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <div
            id={"yesButton"}
            className="dialog-box-button-style-score-card"
            onClick={onYesButtonClicked}
          >
            <div className="yes-text-field">
              {yesText}
              <div className="heart-icon-field">
                <AiTwotoneHeart className="heart-icon" />
              </div>
            </div>
          </div>
          <div
            id={"noButton"}
            className="dialog-box-button-style-score-card"
            onClick={onContinueButtonClicked}
          >
            <div className="no-text-field">
              {noText}
              <div className="next-icon-field">
                <GrFormNext className="next-icon" />
              </div>
            </div>
          </div>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ScoreCard;
