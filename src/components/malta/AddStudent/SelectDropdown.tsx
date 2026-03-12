import React from "react";
import { t } from "i18next";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectDropdownProps {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  label,
  value,
  onChange,
  options,
}) => {
  return (
    <div className="profile-row">
      <label htmlFor="class-select">{t(label)}:</label>
      <select id="class-select" value={value} onChange={onChange}>
        <option value="">{t("Select Class")}</option>
        {options.map((option: SelectOption) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectDropdown;
