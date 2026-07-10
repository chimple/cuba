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
        <div>
          {assignments} {t("Assignments")}
        </div>
        <div className="assignment-count-next-button">
          {t("Next")}
          <NavigateNextOutlinedIcon />
        </div>
      </div>
    </div>
  );
};

export default AssigmentCount;
