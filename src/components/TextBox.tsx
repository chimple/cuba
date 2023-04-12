import { useState } from "react";
import {
  IonContent,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
} from "@ionic/react";
import "./TextBox.css";
import { IoCallOutline } from "react-icons/io5";

const TextBox: React.FC<{ inputText; inputType }> = ({
  inputText,
  inputType,
}) => {
  return (
    <div id="text-box">
      <div id="text-box-elements">
        <IoCallOutline id="text-box-icon" />
        <div id="text-box-vertical-line"></div>

        <div id="text-box-input">
          <IonItem lines="none">
            <IonLabel position="floating" color="dark">
              {inputText}
            </IonLabel>
            <IonInput type={inputType}></IonInput>
          </IonItem>
        </div>
      </div>
    </div>
  );
};

export default TextBox;
