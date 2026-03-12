import React, { MouseEventHandler } from "react";
import "./DialogBoxButtons.css";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";

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
