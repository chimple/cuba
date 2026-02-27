import React from "react";
import "./SelectIcon.css";
import { t } from "i18next";
interface SelectIconProps {
  isSelected: boolean;
  onClick;
}
const SelectIcon: React.FC<SelectIconProps> = ({ onClick, isSelected }) => {
  return (
    <div className="select-icon-container" onClick={onClick}>
      <div
        id="select-Assignmenticon"
        className="select-Assignmenticon"
      >
        <img
          id="select-Assignmenticon-image"
          className="select-Assignmenticon-image"
          src={
            isSelected
              ? "assets/icons/assignmentSelectGreen.svg"
              : "assets/icons/assignmentSelect.svg"
          }
          alt="Assignment_Icon"
        />
        <span
          id="select-text"
          className="select-text"
        >
          {isSelected ? t("Remove") : t("Add")}
        </span>
      </div>
    </div>
  );
};

export default SelectIcon;
