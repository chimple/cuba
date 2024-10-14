import React, { useState } from "react";
import { IonItem, IonSearchbar, IonIcon, IonButton } from "@ionic/react";
import { enterOutline } from "ionicons/icons";
import "./InputField.css";
import { t } from "i18next";

const InputField: React.FC<{
  useEmail: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  onEnter: () => void;
  toggleInputMethod: () => void;
}> = ({ useEmail, inputValue, setInputValue, onEnter, toggleInputMethod }) => {
  const [showError, setShowError] = useState(false);
  const handleInputChange = (event: CustomEvent) => {
    let value = (event.target as HTMLInputElement).value;
    console.log("Input value:", value);
    setInputValue(value || "");
    if (value) setShowError(false);
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
    setShowError(false);
    toggleInputMethod();
  };

  return (
    <>
      <IonItem className="custom-search-bar">
        <IonSearchbar
          value={inputValue}
          onIonInput={handleInputChange}
          onKeyDown={handleKeyDown}
          type={useEmail ? "email" : "number"}
          placeholder={useEmail ? t("Email") || "" : t("Phone") || ""}
          showCancelButton="never"
          showClearButton="never"
          inputmode={useEmail ? "email" : "tel"}
          className="custom-search-input"
        ></IonSearchbar>
        <IonIcon
          icon={enterOutline}
          className={`icon-inside-search ${!inputValue ? "disabled-icon" : ""}`}
          onClick={handleClick}
          style={{ cursor: inputValue ? "pointer" : "not-allowed" }}
        />
      </IonItem>

      {showError && (
        <div className="field-error-text">
          <IonButton fill="clear" color="danger" onClick={() => {}}>
            {t("Field cannot be empty")}
          </IonButton>
        </div>
      )}

      <div className="toggle-text">
        <IonButton fill="clear" onClick={handleToggleInputMethod}>
          {useEmail ? t("Use phone number instead") : t("Use email instead")}
        </IonButton>
      </div>
    </>
  );
};

export default InputField;
