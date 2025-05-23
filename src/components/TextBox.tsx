// import { IonInput, IonItem, IonLabel } from "@ionic/react";
import "./TextBox.css";
import { IoCallOutline } from "react-icons/io5";
// import { InputChangeEventDetail, IonInputCustomEvent } from "@ionic/core";
import { ChangeEvent } from "react";

const TextBox: React.FC<{
  inputText: string;
  ref?;
  inputType;
  onFocus?;
  maxLength: number;
  inputValue: string;
  icon?: JSX.Element; // Define icon prop as JSX.Element
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  // onChange: (event: IonInputCustomEvent<InputChangeEventDetail>) => void;
}> = ({
  inputText,
  inputType,
  inputValue,
  maxLength,
  icon,
  onChange,
  onFocus,
  ref,
}) => {
  return (
    <div id="text-box">
      <div id="text-box-elements">
        {icon}
        {/* <IoCallOutline id="text-box-icon" mode="ios" /> */}
        <div id="text-box-vertical-line"></div>

        <div id="text-box-input">
          <div id="text-box-container">
            <div id="text-box-label-content">
              <input
                ref={ref}
                onFocus={onFocus}
                id="text-box-floating-input"
                type={inputType}
                value={inputValue}
                onChange={onChange}
                maxLength={maxLength}
                placeholder=" "
              />
              <label id="text-box-floating-label">{inputText}</label>
            </div>
          </div>
          {/* <IonItem id="text-box-ion-item" lines="none" mode="ios">
            <IonLabel
              mode="ios"
              class="text-box-ion-label"
              position="floating"
              color="dark"
            >
              {inputText}
            </IonLabel>
            <IonInput
              mode="ios"
              class="ion-no-padding"
              className="text-box-ion-input"
              type={inputType}
              value={inputValue}
              onIonChange={onChange}
              maxlength={maxLength}
            ></IonInput>
        
          </IonItem> */}
        </div>
      </div>
    </div>
  );
};

export default TextBox;
