import React, { FC, useState } from "react";
import {
  IonAlert,
  IonModal,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
} from "@ionic/react";
import { callSharp } from "ionicons/icons";
interface PhoneNumberPopupProps {
  showPopUp: boolean;
  onPopUpClose;
  phoneNumbers: Array<string>;
  onNumberSelect;
  onNoneSelect
}

const PhoneNumberPopup: FC<PhoneNumberPopupProps> = ({
  showPopUp,
  onPopUpClose,
  phoneNumbers,
  onNumberSelect,
  onNoneSelect
}) => {
  return (
    <>
      {/* Modal for phone number selection */}
      <IonModal
        isOpen={showPopUp}
        onDidDismiss={onPopUpClose}
        style={{
          "--border-radius": "15px",
          "--width": "auto", // Set width as needed
          "--height": "auto", // Set height as needed
        }}
      >
        <div style={{ padding: "20px", color: "black" }}>
          <h1>Continue with</h1>

          {/* List of phone numbers */}
          <IonList lines="none">
            {phoneNumbers.map((phoneNumber, index) => (
              <IonItem button key={index} onClick={() => onNumberSelect(phoneNumber)}>
                <IonIcon icon={callSharp} slot="start" />
                <IonLabel>{phoneNumber}</IonLabel>
              </IonItem>
            ))}
          </IonList>

          {/* None of the above option */}
          <IonText
            color="primary"
            style={{ marginTop: "50px", cursor: "pointer" }}
            onClick={onPopUpClose}
          >
            <strong>NONE OF THE ABOVE</strong>
          </IonText>
        </div>
      </IonModal>
    </>
  );
};

export default PhoneNumberPopup;
