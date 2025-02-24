import React, { MouseEventHandler } from "react";
import { IonAlert, IonButton, IonIcon } from "@ionic/react";
import "./DialogBoxButtons.css";
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

const DialogBoxButtons: React.FC<{
  width: string;
  height: string;
  showDialogBox: boolean;
  message: string;
  yesText: string;
  noText: string;
  handleClose: (event: CustomEvent<OverlayEventDetail<any>>) => void;
  onYesButtonClicked: MouseEventHandler<HTMLDivElement>;
  onNoButtonClicked: MouseEventHandler<HTMLDivElement>;
}> = ({
  width,
  height,
  showDialogBox,
  message,
  yesText,
  noText,
  handleClose,
  onYesButtonClicked,
  onNoButtonClicked,
}) => {
  return (
    <div>
      <Dialog
        open={showDialogBox}
        onClose={handleClose}
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "20px !important",
            maxWidth: "75vw !important",
            minWidth: "42vw !important",
          },
          "& .MuiTypography-root": { margin: "13% 0% 0% 0% !important" },
        }}
      >
        <DialogContent
          style={{
            // padding: "8% 5%",
            textAlign: "center",
            width: width,
            height: height,
            maxWidth: "70vw",
            maxHeight: "40vh",
          }}
          // sx={{
          //   "&.MuiDialogContent-root": { padding: " 20px 0 24px 33px " },
          // }}
        >
          <DialogContentText
            style={{
              textAlign: "center",
              color: "var(--text-color)",
              fontWeight: "normal",
            }}
          >
            {message}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            justifyContent: "space-around",
            margin: "3%",
          }}
        >
          <div
            id={"yes-button"}
            className="dialog-box-button-style"
            onClick={onYesButtonClicked}
          >
            {yesText}
          </div>
          <div
            id={"no-button"}
            className="dialog-box-button-style"
            onClick={onNoButtonClicked}
          >
            {noText}
          </div>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DialogBoxButtons;
