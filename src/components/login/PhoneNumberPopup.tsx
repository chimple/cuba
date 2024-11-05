import React, { FC, useState } from "react";
import { t } from "i18next";
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
import { fontWeight } from "html2canvas/dist/types/css/property-descriptors/font-weight";
interface PhoneNumberPopupProps {
  showPopUp: boolean;
  onPopUpClose;
  phoneNumbers: Array<string>;
  onNumberSelect;
  onNoneSelect;
}

const PhoneNumberPopup: FC<PhoneNumberPopupProps> = ({
  showPopUp,
  onPopUpClose,
  phoneNumbers,
  onNumberSelect,
  onNoneSelect,
}) => {
  return (
    <>
      <IonModal
        isOpen={showPopUp}
        onDidDismiss={onPopUpClose}
        style={{
          "--border-radius": "15px",
          "--width": "auto",
          "--height": "auto",
        }}
      >
        <div
          style={{ paddingLeft: "20px", paddingRight: "20px", color: "black" }}
        >
          <h5>{t("Continue with")}</h5>

          <IonList
            lines="none"
            style={{
              paddingLeft: "0px",
              minWidth: "200px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            {phoneNumbers.map((phoneNumber, index) => (
              <IonItem
                button
                key={index}
                style={{ marginLeft: "0" }}
                onClick={() => onNumberSelect(phoneNumber)}
              >
                <IonIcon
                  icon={callSharp}
                  slot="start"
                  style={{ marginRight: "4px" }}
                />

                <IonLabel style={{ marginLeft: "0", fontWeight: "bold" }}>
                  {phoneNumber}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>

          {/* None of the above option */}
          <IonText
            color="primary"
            style={{ marginTop: "50px", cursor: "pointer" }}
            onClick={onNoneSelect}
          >
            <h6>{t("None of above")}</h6>
          </IonText>
        </div>
      </IonModal>
    </>
  );
};

export default PhoneNumberPopup;
