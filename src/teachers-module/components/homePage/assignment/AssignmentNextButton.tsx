import React, { MouseEventHandler } from "react";
import "react-circular-progressbar/dist/styles.css";
import "./AssignmentNextButton.css"; // Import the CSS file
import { Toast } from "@capacitor/toast";
import { t } from "i18next";
import { PAGES } from "../../../../common/constants";
import { recommendedAssignments } from "../../../../stories/Assignment/RecommendedAssignment.stories";
import { TeacherAssignmentPageType } from "./TeacherAssignment";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";

interface AssignmentNextButtonProps {
  assignmentCount: Number;
  onClickCallBack: MouseEventHandler<HTMLDivElement>;
}
const AssignmentNextButton: React.FC<AssignmentNextButtonProps> = ({
  assignmentCount,
  onClickCallBack,
}) => {
  return (
    <div className="assign-button" onClick={onClickCallBack}>
      <div className="assign-button-text">
        <LibraryBooksOutlinedIcon></LibraryBooksOutlinedIcon>
        <span>
          {assignmentCount.toString()} {t("Assignments")}
        </span>
      </div>
      <div className="assign-button-text">
        <span>{t("Next")}</span>
        <ArrowForwardIosOutlinedIcon></ArrowForwardIosOutlinedIcon>
      </div>
    </div>
  );
};

export default AssignmentNextButton;
