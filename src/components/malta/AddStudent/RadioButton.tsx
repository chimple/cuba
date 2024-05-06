import React from "react";
import { t } from "i18next";

interface RadioButtonProps {
  id: string;
  name: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
}) => {
  return (
    <>
      <input
        type="radio"
        id={id}
        name={name}
        value={id}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id}>{t(label)}</label>
    </>
  );
};

export default RadioButton;
