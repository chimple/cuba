import React from "react";
import "./SelectIcon.css";
import { useHistory } from "react-router";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import { t } from "i18next";
interface SelectIconProps {
  isSelected: boolean;
  onClick;
}
const SelectIcon: React.FC<SelectIconProps> = ({ onClick, isSelected }) => {
  return (
    <div className="select-icon-container" onClick={onClick}>
      <div
        className="select-icon"
        style={{ backgroundColor: isSelected ? "#7c5db0" : "#EFE8F8" }}
      >
        <AssignmentRoundedIcon />
        <span
          style={{ color: isSelected ? "white" : "black" }}
          className="select-text"
        >
          {isSelected ? t("Remove") : t("Add")}
        </span>
      </div>
    </div>
  );
};

export default SelectIcon;
