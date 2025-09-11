import React from "react";
import "./AssigmentCount.css";
import { t } from "i18next";
import NavigateNextOutlinedIcon from "@mui/icons-material/NavigateNextOutlined";
interface AssigmentCountProps {
  assignments: number;
  onClick: () => void;
}

const AssigmentCount: React.FC<AssigmentCountProps> = ({
  assignments,
  onClick,
}) => {
  return (
    <div className="assignment-count-container" onClick={onClick}>
      <div className="assignment-count-body">
        <div className="assignment-count-text">
          <img src="assets/icons/assignmentSelect.svg" alt="" className="assignment-count-img" />
          {assignments} {t("Assignments")}
        </div>
        <div className="assignment-count-next-button">
          {t("Next")}
          <img src="assets/icons/arrowRightWhite.png" alt="Arrow_sign" />
        </div>
      </div>
    </div>
  );
};

export default AssigmentCount;
