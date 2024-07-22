import React from "react";
import { t } from "i18next";

interface InputFieldProps {
  label: string;
  type: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  id,
  value,
  onChange,
}) => {
  return (
    <div className="profile-row">
      <label htmlFor={id}>{t(label)}:</label>
      <input type={type} id={id} value={value} onChange={onChange} />
    </div>
  );
};

export default InputField;
