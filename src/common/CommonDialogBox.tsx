import { FC, useState } from "react";
import { IonAlert } from "@ionic/react";
import { t } from "i18next";
import "./CommonDialogBox.css";

const CommonDialogBox: FC<{
  message: string;
  showConfirmFlag: boolean;
  leftButtonText: string;
  leftButtonHandler: () => void;
  onDidDismiss: () => void;
  rightButtonText: string;
  rightButtonHandler: () => void;
}> = ({
  message,
  showConfirmFlag,
  leftButtonText,
  leftButtonHandler,
  onDidDismiss,
  rightButtonText,
  rightButtonHandler,
}) => {
  return (
    <div>
      <IonAlert
        isOpen={showConfirmFlag}
        onDidDismiss={onDidDismiss}
        cssClass="custom-alert"
        message={t(message) || ""}
        buttons={[
          {
            text: t(leftButtonText),
            cssClass: "alert-delete-button",
            handler: leftButtonHandler,
          },
          {
            text: t(rightButtonText),
            cssClass: "alert-cancel-button",
            handler: rightButtonHandler,
          },
        ]}
      />
    </div>
  );
};

export default CommonDialogBox;
