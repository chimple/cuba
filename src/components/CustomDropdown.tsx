import {
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { FC } from "react";
import "./CustomDropdown.css";

const CustomDropdown: FC<{
  placeholder: string;
  options: {
    id: string;
    displayName: string;
  }[];
  currentlySelected: string | undefined;
  onDropdownChange: (event: string) => void;
}> = ({ placeholder, options, currentlySelected, onDropdownChange }) => {
  return (
    <IonList>
      <IonItem lines="none" fill="outline">
        <IonSelect
          onIonChange={(evt) => {
            onDropdownChange(evt.detail.value);
          }}
          value={currentlySelected}
          interface="popover"
          placeholder={placeholder}
        >
          {options.map((option) => (
            <IonSelectOption key={option.id} value={option.id}>
              {option.displayName}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default CustomDropdown;
