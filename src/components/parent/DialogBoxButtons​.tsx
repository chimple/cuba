import React, { useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonAlert,
} from "@ionic/react";
import "./DialogBoxButtons.css";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

const DialogBoxButtons: React.FC<{
  width: string;
  height: string;
  showDialogBox: boolean;
  message: string;
  yesText: string;
  noText: string;
  onButtonClicked: (event: CustomEvent<OverlayEventDetail<any>>) => void;
}> = ({
  width,
  height,
  showDialogBox,
  message,
  yesText,
  noText,
  onButtonClicked,
}) => {
  return (
    <>
      <IonAlert
        header={message}
        isOpen={showDialogBox}
        onDidDismiss={onButtonClicked}
        buttons={[
          {
            text: yesText,
            role: "delete",
          },
          {
            text: noText,
            role: noText,
          },
        ]}
      ></IonAlert>
    </>
  );
};

export default DialogBoxButtons;
