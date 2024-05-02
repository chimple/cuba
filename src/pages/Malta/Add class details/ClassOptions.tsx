import { t } from "i18next";
import React from "react";
import "./ClassOptions.css";

const ClassOptions: React.FC<{
  classes: string[];
  selectedClass: string | undefined;
  onClassChange: (selectedClass: string) => void;
  onSwitchClass: (selectedClass: string) => void;
}> = ({ classes, selectedClass, onClassChange, onSwitchClass }) => {
  const handleClassChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedClass = event.target.value;
    onClassChange(newSelectedClass);
  };

  return (
    <div className="switch-class-container">
      <div className="class-round-div">
        {classes?.map((className) => (
          <div key={className}>
            <img className={"class-option1"} src="assets/icons/user.png" />
            <p className="classes-name">{className}</p>
          </div>
        ))}
      </div>
      {classes?.map((className) => (
        <div key={className} className={`class-option`}>
          <input
            type="radio"
            name="class"
            value={className}
            defaultChecked={className === classes[0]}
            checked={className === selectedClass}
            onChange={handleClassChange}
          />
          <label>{className}</label>
        </div>
      ))}
      {selectedClass && (
        <div
          className="switch-button"
          onClick={() => onSwitchClass(selectedClass)}
        >
          {t("Switch Class")}
        </div>
      )}
    </div>
  );
};

export default ClassOptions;
