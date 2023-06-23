import { IonToggle, ToggleChangeEventDetail } from "@ionic/react";
import "./ToggleButton.css";
import { t } from "i18next";
const ToggleButton: React.FC<{
  flag: boolean;
  title: string;
  onIonChangeClick: (event: CustomEvent<ToggleChangeEventDetail<any>>) => void;
}> = ({ flag, title, onIonChangeClick }) => {
  return (
    <div id="toggle-button">
      <p>
        {title}{flag ? t(" ON ") : t(" OFF ")}
      </p>
      <IonToggle
        checked={flag}
        onIonChange={onIonChangeClick}
        aria-label="Enable Notifications"
      ></IonToggle>
    </div>
  );
};
export default ToggleButton;
