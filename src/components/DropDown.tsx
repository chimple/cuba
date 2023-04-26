import { IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import "./DropDown.css";

const DropDown: React.FC<{
  optionList: string[];
  currentValue: string;
  onValueChange;
  width: string;
}> = ({ optionList, currentValue, onValueChange, width }) => {
  return (
    <IonList>
      <IonItem id="drop-down" lines="none" fill="outline">
        <IonSelect
          onIonChange={onValueChange}
          interface="popover"
          value={currentValue}
          // aria-label="Fruit"
          // // interface="popover"
          // placeholder="Select fruit"
          style={{
            width: width,
            // --max-width:width,
          }}
        >
          {optionList.map((option,index) => (
            <IonSelectOption key={index} value={option}>{option}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default DropDown;
