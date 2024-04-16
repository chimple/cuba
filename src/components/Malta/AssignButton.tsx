import { IonIcon } from "@ionic/react";
import { t } from "i18next";
import { chevronForward } from "ionicons/icons";
import "./AssignButton.css";
import React from "react";

interface AssignButtonProps {
  onClicked: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
}

const AssignButton: React.FC<AssignButtonProps> = ({ onClicked, disabled }) => {
  return (
    <button id="assign-button" disabled={disabled} onClick={onClicked}>
      {t("Assign")}
    </button>
  );
};

export default AssignButton;
