import { IonButton, IonIcon } from "@ionic/react";
import { t } from "i18next";
import { chevronForward, warning } from "ionicons/icons";
import "./AssignButton.css";
import React from "react";

interface AssignButtonProps {
  onClicked: React.MouseEventHandler<HTMLIonButtonElement>;
  disabled: boolean;
}

const AssignButton: React.FC<AssignButtonProps> = ({ onClicked, disabled }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <IonButton
        disabled={disabled}
        onClick={onClicked}
        color={"warning"}
        size="default"
        expand="block"
      >
        {t("Assign")}
      </IonButton>
    </div>
  );
};

export default AssignButton;
