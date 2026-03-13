import { IonIcon } from '@ionic/react';
import { t } from 'i18next';
import { chevronForward } from 'ionicons/icons';
import "./NextButton.css";
import React from "react";

interface NextButtonProps {
  onClicked: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
  children?: React.ReactNode;
}

const NextButton: React.FC<NextButtonProps> = ({ onClicked, disabled, children }) => {
  return (
    <button id='common-next-button' disabled={disabled} onClick={onClicked}>
      {children} 
      {t("Next")}
      <IonIcon className="arrow-icon" slot="end" icon={chevronForward}></IonIcon>
    </button>
  );
}

export default NextButton;
