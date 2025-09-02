import React from "react";
import { IonLabel, IonSelect, IonSelectOption } from "@ionic/react";
import "./DropDown.css";

interface DropDownProps {
  value: { [key: string]: string } | undefined;
  selectedItem: string | undefined;
  onSelect: (id: string) => void;
  placeHolder: string;
}

const DropDown: React.FC<DropDownProps> = ({
  value,
  selectedItem,
  onSelect,
  placeHolder,
}) => {
  const handleSelect = (event: CustomEvent) => {
    const id = event.detail.value;
    // Prevent calling onSelect if the selected value hasn't changed
    if (id !== selectedItem) {
      onSelect(id);
    }
  };

  return (
    <div className="dropDown">
      <div className="dropDown-container">
        <IonSelect
          value={selectedItem} // Bind the selected value
          placeholder={placeHolder}
          onIonChange={handleSelect} // Handle the selection change
          interface="popover"
          color="danger" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}          // Optional: choose "action-sheet", "popover", or "alert" interface styles
        >
          {value &&
            Object.entries(value).map(([id, name]) => (
              <IonSelectOption key={id} value={id} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{name}</IonLabel>
              </IonSelectOption>
            ))}
        </IonSelect>
        <div className="divider" />
      </div>
    </div>
  );
};

export default DropDown;
