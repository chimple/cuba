import { IonButton, IonIcon } from "@ionic/react";
import { t } from "i18next";
import { chevronForward, warning } from "ionicons/icons";
import "./CommonButton.css";
import React from "react";

interface CommonButtonProps {
  onClicked: React.MouseEventHandler<HTMLIonButtonElement>;
  disabled: boolean;
  title: string;
}

const CommonButton: React.FC<CommonButtonProps> = ({
  onClicked,
  disabled,
  title,
}) => {
  return (
    <div className="buttoncontainerr">
      <IonButton className="common-button"
        disabled={disabled}
        onClick={onClicked}
        size="default"
        expand="block"
      >
        {t(title)}
      </IonButton>
    </div>
  );
};

export default CommonButton;
