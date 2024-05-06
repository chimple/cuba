import React from "react";
import RadioButton from "./RadioButton";

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
      <label>Gender:</label>
      <div className="gender-options">
        <RadioButton
          id="male"
          name="gender"
          checked={gender === "male"}
          onChange={onGenderChange}
          label="Male"
        />
        <RadioButton
          id="female"
          name="gender"
          checked={gender === "female"}
          onChange={onGenderChange}
          label="Female"
        />
        <RadioButton
          id="other"
          name="gender"
          checked={gender === "other"}
          onChange={onGenderChange}
          label="Other"
        />
      </div>
    </div>
  );
};

export default GenderSelection;
