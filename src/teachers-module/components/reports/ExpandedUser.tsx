import React from "react";
import "./ExpandedUser.css";
import { t } from "i18next";
interface ExpandedUserProps {
  name: string;
  onClickViewDetails: () => void;
}

const ExpandedUser: React.FC<ExpandedUserProps> = ({
  name,
  onClickViewDetails,
}) => {
  return (
    <div className="expanded-conatiner">
      <div className="text-container">{name}</div>
      <div onClick={onClickViewDetails} className="button-style">
        {t("View Progress")}
      </div >
    </div>
  );
};

export default ExpandedUser;
