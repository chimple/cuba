import { IonToggle, ToggleChangeEventDetail } from "@ionic/react";
import "./ToggleButton.css";
const ToggleButton: React.FC<{
  flag: boolean;
  title: string;
  onIonChangeClick: (event: CustomEvent<ToggleChangeEventDetail<any>>) => void;
}> = ({ flag, title, onIonChangeClick }) => {
  return (
    <div id="toggle-button">
      <p>
        {title} {flag ? " ON " : " OFF "}
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
