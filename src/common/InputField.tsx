import React from "react";
import { IonItem, IonSearchbar, IonIcon, IonButton } from "@ionic/react";
import { enterOutline } from "ionicons/icons";
import "./InputField.css";

const InputField: React.FC<{
  useEmail: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  onEnter: () => void;
  toggleInputMethod: () => void;
}> = ({ useEmail, inputValue, setInputValue, onEnter, toggleInputMethod }) => {
  const handleInputChange = (event: CustomEvent) => {
    let value = (event.target as HTMLInputElement).value;
    console.log("Input value:", value);
    setInputValue(value || "");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      onEnter();
    }
  };

  return (
    <>
      <IonItem className="custom-search-bar">
        <IonSearchbar
          value={inputValue}
          onIonInput={handleInputChange}
          onKeyDown={handleKeyDown}
          type={useEmail ? "email" : "number"}
          placeholder={useEmail ? "Email" : "Phone"}
          showCancelButton="never"
          showClearButton="never"
          inputmode={useEmail ? "email" : "tel"}
          className="custom-search-input"
        ></IonSearchbar>
        <IonIcon
          icon={enterOutline}
          className="icon-inside-search"
          onClick={onEnter}
        />
      </IonItem>

      <div className="toggle-text">
        <IonButton fill="clear" onClick={toggleInputMethod}>
          {useEmail ? "Use phone number instead" : "Use email instead"}
        </IonButton>
      </div>
    </>
  );
};

export default InputField;
