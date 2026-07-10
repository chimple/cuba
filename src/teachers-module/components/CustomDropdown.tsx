import React, { useState } from "react";
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import "./CustomDropdown.css";
import { arrowDown, caretDownSharp } from "ionicons/icons";
import { ArrowDownward } from "@mui/icons-material";
import { t } from "i18next";

// Extend the IonSelect properties to accept all its props
interface CustomDropdownProps extends React.ComponentProps<typeof IonSelect> {
  icon?: string;
  options: { id: string | number; name: string }[];
  onOptionSelect: (selected: { id: string | number; name: string }) => void;
  selectedValue: { id: string | number; name: string };
  isDownBorder?: boolean;
  disableTranslation?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  icon = arrowDown,
  options,
  isDownBorder = true,
  onOptionSelect,
  selectedValue,
  disableTranslation = false,
  ...selectProps // Spread any additional IonSelect props
}) => {
  return (
    <div
      className="sort-type-container"
      style={{ borderBottom: !isDownBorder ? "0px" : " 0.2vh solid #333" }}
    >
      <IonSelect
        value={selectedValue.id}
        placeholder={selectProps.placeholder}
        onIonChange={(e) =>
          onOptionSelect(options.find((option) => option.id === e.detail.value)!)
        }
        interface="popover" // or "action-sheet", "alert"
        className="custom-select"
        {...selectProps} // Pass down all other props
      >
        {options.map((option) => (
          <IonSelectOption key={option.id} value={option.id}>
            {disableTranslation ? option.name : t(option.name)}
          </IonSelectOption>
        ))}
      </IonSelect>
      <div className="icon-container">
        <IonIcon icon={caretDownSharp} />
      </div>
    </div>
  );
};

export default CustomDropdown;