import React, { MouseEventHandler, useEffect } from "react";
import "./ParentalLock.css";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { IonButton, IonCol, IonIcon, IonRow } from "@ionic/react";
import { Util } from "../../utility/util";
import { t } from "i18next";
import { NUMBER_NAME, PAGES } from "../../common/constants";
import { IoCloseCircle } from "react-icons/io5";
import { chevronForward } from "ionicons/icons";
import { useHistory } from "react-router-dom";

const ParentalLock: React.FC<{
  width: string;
  height: string;
  showDialogBox: boolean;
  message: string;
  handleClose: (event: CustomEvent<OverlayEventDetail<any>>) => void;
  onHandleClose: MouseEventHandler<SVGElement>;
}> = ({
  width,
  height,
  showDialogBox,
  message,
  handleClose,
  onHandleClose,
}) => {
  useEffect(() => {
    init();
  }, []);

  const history = useHistory();
  // const [open, setOpen] = React.useState(showDialogBox);
  const [title, setTitle] = React.useState("");
  const [passCode, setPassCode] = React.useState("");
  const [userInput, setUserInput] = React.useState("");
  const [disableUnlockBtn, setDisableUnlockBtn] = React.useState(true);
  const [unlockColor, setUnlockColor] = React.useState("dark");

  function init() {
    console.log("showDialogBox", showDialogBox);
    let code = Util.randomBetween(1, 10);
    let count = Util.randomBetween(1, 5);
    let str = t(`Click x1 times on number x2`)
      .replace(`x1`, count.toString())
      .replace(`x2`, code.toString());
    setTitle(str);
    let tempPasscode = "";
    let i = 0;
    while (i++ < count) {
      tempPasscode += code.toString();
    }
    setPassCode(tempPasscode);
    console.log("passcode", tempPasscode, passCode);
  }

  const dataContent = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <div>
      <Dialog
        open={showDialogBox}
        onClose={handleClose}
        sx={{
          "& .MuiPaper-root": { borderRadius: "6vh" },
        }}
      >
        <DialogContent
          style={{
            padding: "1%",
            textAlign: "center",
            width: "28vw",
            // height: "auto",
          }}
        >
          <IoCloseCircle
            id="parental-lock-close-icon"
            size={"10vh"}
            onClick={onHandleClose}
          ></IoCloseCircle>
          <DialogContentText
            style={{
              textAlign: "center",
              color: "black",
              fontWeight: "normal",
              margin: "6% 0%",
              fontSize : "4vh"
            }}
          >
            {title}
          </DialogContentText>
          {dataContent.map((e) => {
            return (
              <IonRow style={{ textAlign: "center", paddingLeft: "8%" }}>
                {e.map((d) => {
                  return (
                    <IonCol size="12" size-sm="4" id={d}>
                      <p
                        id="parental-lock-number"
                        onClick={() => {
                          console.log(userInput + d);
                          if(userInput + d === passCode) {
                            setDisableUnlockBtn(false);
                            setUnlockColor("success");
                          }

                          if (userInput.length >= passCode.length) {
                            console.log("reset the userInput");
                            setDisableUnlockBtn(true);
                            setUnlockColor("dark");
                            setUserInput("");
                          } else {
                            setUserInput(userInput + d);
                          }
                        }}
                      >
                        {d}
                      </p>
                    </IonCol>
                  );
                })}
              </IonRow>
            );
          })}
          <IonButton
            id="parental-lock-unlock-button"
            disabled={disableUnlockBtn}
            color={unlockColor}
            fill="solid"
            shape="round"
            onClick={() => {
              console.log("On Next Button");
              if (userInput === passCode) {
                setUserInput("");
                history.replace(PAGES.PARENT);
              } else {
                setUserInput("");
              }
            }}
          >
            {t("Unlock")}
            <IonIcon
              className="arrow-icon"
              slot="end"
              icon={chevronForward}
            ></IonIcon>
          </IonButton>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentalLock;
