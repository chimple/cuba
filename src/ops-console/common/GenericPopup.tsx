import React from "react";
import { IonModal, IonContent, IonButton, IonIcon } from "@ionic/react";
import { close } from "ionicons/icons";
import "./GenericPopup.css";

export interface GenericPopupProps {
  isOpen: boolean;
  icon?: React.ReactNode;
  heading: string;
  text: string;
  primaryButtonText?: string;
  onPrimaryClick?: () => void;
  onClose: () => void;
}

const GenericPopup: React.FC<GenericPopupProps> = ({
  isOpen,
  icon,
  heading,
  text,
  primaryButtonText,
  onPrimaryClick,
  onClose,
}) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      id="generic-popup-overlay"
      className="generic-popup-overlay"
      backdropDismiss={false}
    >
      <IonContent
        id="generic-popup-container"
        className="generic-popup-container"
        scrollY={false}
      >
        <div
          id="generic-popup-close-wrapper"
          className="generic-popup-close-wrapper"
        >
          <IonIcon
            id="generic-popup-close-btn"
            className="generic-popup-close-btn"
            icon={close}
            onClick={onClose}
          />
        </div>

        {icon && (
          <div id="generic-popup-icon" className="generic-popup-icon">
            {icon}
          </div>
        )}

        <div
          id="generic-popup-heading-wrapper"
          className="generic-popup-heading-wrapper"
        >
          <h2 id="generic-popup-heading" className="generic-popup-heading">
            {heading}
          </h2>
        </div>

        <div
          id="generic-popup-text-wrapper"
          className="generic-popup-text-wrapper"
        >
          <p id="generic-popup-text" className="generic-popup-text">
            {text}
          </p>
        </div>

        {primaryButtonText && (
          <div
            id="generic-popup-button-wrapper"
            className="generic-popup-button-wrapper"
          >
            <IonButton
              id="generic-popup-primary-btn"
              className="generic-popup-primary-btn"
              expand="block"
              onClick={onPrimaryClick}
            >
              {primaryButtonText}
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default GenericPopup;
