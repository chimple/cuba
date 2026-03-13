import React, { FC, ReactNode } from "react";
import "./InputWithIcons.css";

type InputProps = {
  label: string;
  placeholder: string;
  value: string | number | undefined;
  setValue: (val: any) => void;
  icon: string;
  type?: "text" | "number";
  maxLength?: number;
  readOnly?: boolean;
  statusIcon?: ReactNode;
  required?: boolean;
  id?: string;
  labelOffsetClass?: string;
};

const InputWithIcons: FC<InputProps> = ({
  label,
  placeholder,
  value,
  setValue,
  icon,
  type = "text",
  maxLength,
  readOnly = false,
  statusIcon,
  required,
  id,
  labelOffsetClass = "",
}) => {
  return (
    <div className="with-icon-input-wrapper">
      <div className={`with-icon-input-label ${labelOffsetClass ?? ""}`}>
        {label}
        {required && <span className="with-icon-required">*</span>}
      </div>
      <div className="with-icon-input-box">
        <div className="with-icon-icon-area">
          <img src={icon} alt="Input icon" />
        </div>
        <div className="with-icon-divider" />
        <input
          id={id}
          type={type}
          value={value ?? ""}
          onChange={(e) => {
            const inputValue = e.target.value;
            if (readOnly) return;
            if (type === "number") {
              if (!maxLength || inputValue.length <= maxLength) {
                setValue(inputValue === "" ? undefined : parseInt(inputValue));
              }
            } else {
              if (!maxLength || inputValue.length <= maxLength) {
                setValue(inputValue);
              }
            }
          }}
          readOnly={readOnly}
          className="with-icon-text-input"
          placeholder={placeholder}
        />
        <div className="with-icon-status">{statusIcon}</div>
      </div>
    </div>
  );
};

export default InputWithIcons;
