import { IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import "./DropDown.css";

const DropDown: React.FC<{
  optionList: {
    id: string;
    displayName: string;
  }[];
  currentValue: string | undefined;
  onValueChange;
  placeholder: string | undefined;
  width: string;
}> = ({ optionList, currentValue, onValueChange, width, placeholder }) => {
  return (
    <IonList mode="ios">
      <IonItem id="drop-down" lines="none" fill="outline" mode="ios">
        <IonSelect
          onIonChange={(evt) => {
            onValueChange(evt.detail.value);
          }}
          placeholder={placeholder ?? ""}
          interface="popover"
          value={currentValue}
          // aria-label="Fruit"
          // // interface="popover"
          // placeholder="Select fruit"
          style={{
            width: width,
            fontsize: "20vh",
            // --max-width:width,
          }}
        >
          {optionList.map((option, index) => (
            <IonSelectOption key={index} value={option.id}>{option.displayName}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default DropDown;
