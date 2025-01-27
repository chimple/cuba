import { IonToggle, ToggleChangeEventDetail } from "@ionic/react";
import "./ToggleButton.css";
import { t } from "i18next";

const ToggleButton: React.FC<{
  flag?: number;
  title: string;
  titleAlignment?: "left" | "center" | "right";
  layout?: "horizontal" | "vertical";
  onIonChangeClick: (event: CustomEvent<ToggleChangeEventDetail<any>>) => void;
}> = ({
  flag,
  title,
  onIonChangeClick,
  titleAlignment = "left",
  layout = "horizontal",
}) => {
  return (
    <div
      id="toggle-button"
      className={`toggle-button ${layout}`}
      style={{ textAlign: titleAlignment }}
    >
      {layout === "horizontal" ? (
        <div className="horizontal-layout">
          <p className="toggle-text">
            {t(title)}
            {flag === 1 ? t(" ON ") : flag === 0 ? t(" OFF ") : ""}
          </p>
          <IonToggle
            checked={flag === 0 ? true : false}
            onIonChange={onIonChangeClick}
            aria-label="Enable Notifications"
            className="common-toggle"
          ></IonToggle>
        </div>
      ) : (
        <div className="vertical-layout">
          <IonToggle
            checked={flag === 0 ? true : false}
            onIonChange={onIonChangeClick}
            aria-label="Enable Notifications"
            className="common-toggle"
          ></IonToggle>
          <p className="toggle-text">
            {t(title)}
            {flag === 1 ? t(" ON ") : flag === 0 ? t(" OFF ") : ""}
          </p>
        </div>
      )}
    </div>
  );
};
export default ToggleButton;
