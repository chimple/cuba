import React from "react";
import { IonSelect, IonSelectOption, IonIcon } from "@ionic/react";
import { chevronDownOutline } from "ionicons/icons";
import "./SelectField.css";

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
}) => {
  return (
    <div className="select-field-row">
      <span className="select-field-label">{label}</span>
      <div className="select-field-wrapper">
        <div
          className="select-field-display"
          style={{ color: value ? "#4A4949" : "transparent" }}
        >
          {value || placeholder || "Select..."}
        </div>

        <IonSelect
          value={value}
          onIonChange={(e) => onChange(e.detail.value)}
          interface="popover"
          disabled={disabled}
          className="select-field-overlay"
        >
          {options.map((opt) => (
            <IonSelectOption key={opt} value={opt}>
              {opt}
            </IonSelectOption>
          ))}
        </IonSelect>

        <IonIcon icon={chevronDownOutline} className="select-field-arrow" />
      </div>
    </div>
  );
};

export default SelectField;
