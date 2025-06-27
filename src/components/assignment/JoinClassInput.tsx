import React, { FC, ReactNode } from "react";
import "./JoinClassInput.css";

type JoinClassInputProps = {
  label: string;
  placeholder: string;
  value: string | number | undefined;
  setValue: (val: any) => void;
  icon: string;
  type?: "text" | "number";
  maxLength?: number;
  readOnly?: boolean;
  statusIcon?: ReactNode;
};

const JoinClassInput: FC<JoinClassInputProps> = ({
  label,
  placeholder,
  value,
  setValue,
  icon,
  type = "text",
  maxLength,
  readOnly = false,
  statusIcon,
}) => {
  return (
    <div className="join-class-input-wrapper">
      <label className="join-class-input-label">
        {label}
        <span className="join-class-required">*</span>
      </label>
      <div className="join-class-input-box">
        <div className="join-class-icon-area">
          <img src={icon} alt="Input icon" />
        </div>
        <div className="join-class-divider" />
        <input
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
          className="join-class-text-input"
          placeholder={placeholder}
        />
        <div className="join-class-status">{statusIcon}</div>
      </div>
    </div>
  );
};

export default JoinClassInput;
