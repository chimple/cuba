import React, { FC, useState } from "react";
import { t } from "i18next";
import {
  IonModal,
  IonIcon,
  IonText,
} from "@ionic/react";
import { callSharp } from "ionicons/icons";
import "./PhoneNumberPopup.css"
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
         className="phone-number-pop-up-page"
        >
          <h5>{t("Continue with")}</h5>
          <div
           className="phone-number-pop-up"
          >
            {phoneNumbers.map((phoneNumber, index) => (
              <div
                key={index}
                onClick={() => onNumberSelect(phoneNumber)}
                className="phone-number-pop-up-number"
              >
                <IonIcon icon={callSharp} style={{ marginRight: "8px" }} />
                <span style={{ fontWeight: "bold" }}>{phoneNumber}</span>
              </div>
            ))}
          </div>

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
