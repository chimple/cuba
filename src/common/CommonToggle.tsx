import React from "react";
import { IonLabel, IonToggle } from "@ionic/react";
import "./CommonToggle.css";
import { t } from "i18next";

interface CommonToggleProps {
  checked?: boolean;
  onChange: (event: CustomEvent) => void;
  label?: string;
}

const CommonToggle: React.FC<CommonToggleProps> = ({
  checked,
  onChange,
  label,
}) => {
  return (
    <div className="rounded-toggle-container">
      {label && (
        <IonLabel className="common-toggle-toggle-label">{t(label)}</IonLabel>
      )}
      <IonToggle
        className="common-toggle-custom-rounded-toggle"
        checked={checked}
        onIonChange={onChange}
      />
    </div>
  );
};

export default CommonToggle;
