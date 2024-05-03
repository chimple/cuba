import React from "react";
import { t } from "i18next";
import RadioButton from "./RadioButton";


const GenderSelection = ({ gender, onGenderChange }) => {
    return (
    <div className="profile-row gender-line">
      <label>{t("Gender")}:</label>
      <div className="gender-options">
        <RadioButton
          id="male"
          name="gender"
          checked={gender === "male"}
          onChange={onGenderChange}
          label={t("Male")}
        />
        <RadioButton
          id="female"
          name="gender"
          checked={gender === "female"}
          onChange={onGenderChange}
          label={t("Female")}
        />
        <RadioButton
          id="other"
          name="gender"
          checked={gender === "other"}
          onChange={onGenderChange}
          label={t("Other")}
        />
      </div>
    </div>
  );
};

export default GenderSelection;
