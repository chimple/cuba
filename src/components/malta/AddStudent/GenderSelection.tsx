import React from "react";
import RadioButton from "./RadioButton";
import { t } from "i18next";
import { GENDER } from "../../../common/constants";

interface GenderSelectionProps {
  gender: string;
  onGenderChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const GenderSelection: React.FC<GenderSelectionProps> = ({
  gender,
  onGenderChange,
}) => {
  return (
    <div className="profile-row gender-line">
      <label>{t("Gender")}:</label>
      <div className="gender-options">
        {Object.values(GENDER).map((value) => (
          <RadioButton
            key={value}
            id={value}
            name="gender"
            checked={gender === value}
            onChange={onGenderChange}
            label={t(value.charAt(0).toUpperCase() + value.slice(1))}
          />
        ))}
      </div>
    </div>
  );
};

export default GenderSelection;
