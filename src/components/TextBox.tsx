import {
  IonInput,
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
        <IoCallOutline id="text-box-icon" mode="ios"/>
        <div id="text-box-vertical-line"></div>

        <div id="text-box-input">
          <IonItem id="text-box-ion-item" lines="none" mode="ios">
            <IonLabel mode="ios"
              class="text-box-ion-label"
              position="floating"
              color="dark"
            >
              {inputText}
            </IonLabel>
            <IonInput mode="ios"
              class="ion-no-padding"
              className="text-box-ion-input"
              type={inputType}
            ></IonInput>
          </IonItem>
        </div>
      </div>
    </div>
  );
};

export default TextBox;
