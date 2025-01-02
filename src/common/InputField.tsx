import React, { useState } from "react";
import { IonItem, IonInput, IonIcon, IonButton } from "@ionic/react";
import { searchOutline } from "ionicons/icons";
import "./InputField.css";
import { t } from "i18next";
import { textTransform } from "html2canvas/dist/types/css/property-descriptors/text-transform";
import { PaddingOutlined } from "@mui/icons-material";

const InputField: React.FC<{
  useEmail: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  onEnter: () => void;
  toggleInputMethod: () => void;
  resetUserNotFound: () => void;
}> = ({
  useEmail,
  inputValue,
  setInputValue,
  onEnter,
  toggleInputMethod,
  resetUserNotFound,
}) => {
  const [showError, setShowError] = useState(false);
  const handleInputChange = (event: CustomEvent) => {
    let value = (event.target as HTMLInputElement).value;
    console.log("Input value:", value);
    setInputValue(value || "");
    if (value) {
      resetUserNotFound();
      setShowError(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      if (inputValue.trim() === "") {
        setShowError(true);
      } else {
        setShowError(false);
        onEnter();
      }
    }
  };

  const handleClick = () => {
    if (inputValue.trim() === "") {
      setShowError(true);
    } else {
      setShowError(false);
      onEnter();
    }
  };

  const handleToggleInputMethod = () => {
    resetUserNotFound();
    setShowError(false);
    toggleInputMethod();
  };

  return (
    <>
      <IonItem className="custom-search-bar">
        <IonInput
          value={inputValue}
          onIonInput={handleInputChange}
          onKeyDown={handleKeyDown}
          type={useEmail ? "email" : "number"}
          placeholder={useEmail ? t("Email") || "" : t("Phone") || ""}
          inputmode={useEmail ? "email" : "tel"}
          className="custom-ion-input"
        />
        <div
          className={`search-icon-container ${!inputValue ? "disabled-icon" : ""}`}
          onClick={() => handleClick()}
        >
          <IonIcon icon={searchOutline} />
        </div>
      </IonItem>

      {showError && (
        <div className="field-error-text">
          <IonButton fill="clear" color="danger" onClick={() => {}}>
            {t("Field cannot be empty")}
          </IonButton>
        </div>
      )}

      <div className="toggle-text">
        <IonButton
          fill="clear"
          onClick={handleToggleInputMethod}
          className="inputField-toggle-text"
        >
          {useEmail ? t("Use phone number instead") : t("Use email instead")}
        </IonButton>
      </div>
    </>
  );
};

export default InputField;
