import React, { useState } from "react";
import { IonIcon, IonButton } from "@ionic/react";
import { searchOutline } from "ionicons/icons";
import "./InputField.css";
import { t } from "i18next";

interface Props {
  useEmail: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  onEnter: () => void;
  toggleInputMethod: () => void;
  resetUserNotFound: () => void;
}

const InputField: React.FC<Props> = ({
  useEmail,
  inputValue,
  setInputValue,
  onEnter,
  toggleInputMethod,
  resetUserNotFound,
}) => {
  const [showError, setShowError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    if (newVal) {
      resetUserNotFound();
      setShowError(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue.trim() === "") {
        setShowError(true);
      } else {
        setShowError(false);
        onEnter();
      }
    }
  };

  const handleIconClick = () => {
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
      <div className="custom-search-bar">
        <input
          className="plain-input"
          type={useEmail ? "email" : "number"}
          inputMode={useEmail ? "email" : "tel"}
          placeholder={useEmail ? t("Email") || "" : t("Phone") || ""}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <div
          className={`search-icon-container ${
            !inputValue.trim() ? "disabled-icon" : ""
          }`}
          onClick={handleIconClick}
        >
          <IonIcon icon={searchOutline} />
        </div>
      </div>

      {showError && (
        <div className="field-error-text">{t("Field cannot be empty")}</div>
      )}

      <div className="toggle-text">
        <IonButton
          fill="clear"
          onClick={handleToggleInputMethod}
          className="inputField-toggle-text"
        >
          {useEmail
            ? t("Use phone number instead")
            : t("Use email instead")}
        </IonButton>
      </div>
    </>
  );
};

export default InputField;
