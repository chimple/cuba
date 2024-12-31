import { FC } from "react";
import { IonAlert, AlertButton } from "@ionic/react";
import { t } from "i18next";
import "./CommonDialogBox.css";

const CommonDialogBox: FC<{
  message: string;
  showConfirmFlag: boolean;
  header?: string;
  leftButtonText?: string;
  leftButtonHandler?: () => void;
  onDidDismiss: () => void;
  rightButtonText?: string;
  rightButtonHandler?: () => void;
}> = ({
  message,
  showConfirmFlag,
  header,
  leftButtonText,
  leftButtonHandler,
  onDidDismiss,
  rightButtonText,
  rightButtonHandler,
}) => {
  const buttons: AlertButton[] = [];

  if (leftButtonText) {
    buttons.push({
      text: t(leftButtonText),
      cssClass: "custom-dailog-alert-delete-button",
      handler: leftButtonHandler,
    });
  }

  if (rightButtonText) {
    buttons.push({
      text: t(rightButtonText),
      cssClass: "custom-dailog-alert-cancel-button",
      handler: rightButtonHandler,
    });
  }

  return (
    <div>
      <IonAlert
        isOpen={showConfirmFlag}
        header={header}
        onDidDismiss={onDidDismiss}
        cssClass="custom-dailog-alert"
        message={t(message) || ""}
        buttons={buttons}
      />
    </div>
  );
};

export default CommonDialogBox;
