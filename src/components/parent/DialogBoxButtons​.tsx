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
        // style={{ borderRadius: "6vh" }}
      >
        <DialogContent
          style={{
            // padding: "8% 5%",
            textAlign: "center",
            width: width,
            height: height,
          }}
        >
          <DialogContentText
            style={{
              textAlign: "center",
              color: "black",
              fontWeight: "normal",
              margin: "6% 0% 0% 0%",
            }}
          >
            {message}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            justifyContent: "space-around",
            margin: "0% 0% 5% 0%",
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
