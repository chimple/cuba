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
      className="custom-dropdown-container"
      style={{ borderBottom: !isDownBorder ? "0px" : "none" }}
    >
      <IonSelect
        value={selectedValue.id}
        onIonChange={(e) => onOptionSelect(options.find((option) => option.id === e.detail.value)!)}
        interface="popover" // or "action-sheet", "alert"
        className="customdropdown-select"
        {...selectProps}      >
        {options.map((option) => (
          <IonSelectOption
            key={option.id}
            value={option.id}
            disabled={(option as any).disabled} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}          >
            {disableTranslation ? option.name : t(option.name)}
          </IonSelectOption>
        ))}
      </IonSelect>
      <div className="icon-container">
        <IonIcon icon={caretDownSharp} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
      </div>
    </div>
  );
};

export default CustomDropdown;