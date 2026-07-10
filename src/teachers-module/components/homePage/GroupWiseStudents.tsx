import React from "react";
import "react-circular-progressbar/dist/styles.css";
import "./GroupWiseStudents.css"; // Import the CSS file
import { BANDWISECOLOR, TableTypes } from "../../../common/constants";
import { t } from "i18next";

interface GroupWiseStudentsProps {
  color: string;
  studentsProgress: Map<string, TableTypes<"user"> | TableTypes<"result">[]>[];
  studentLength: string;
  onClickCallBack: Function;
}
const GroupWiseStudents: React.FC<GroupWiseStudentsProps> = ({
  color,
  studentsProgress,
  studentLength,
  onClickCallBack,
}) => {
  return (
    <div
      className="group-wise-container"
      style={{ borderColor: color }}
      onClick={() => {
        onClickCallBack();
      }}
    >
      <div className="group-wise-header" style={{ backgroundColor: color }}>
        {color === BANDWISECOLOR.RED
          ? t("Need Help")
          : color === BANDWISECOLOR.YELLOW
            ? t("Still Learning")
            : color === BANDWISECOLOR.GREEN
              ? t("Doing Good")
              : t("Not Tracked")}
        <span style={{ marginLeft: "10px" }}>
          {studentsProgress.length} / {studentLength}
        </span>
      </div>
      <div className="group-wise-content">
        {studentsProgress.map((stdpr) => {
          const student = stdpr.get("student") as TableTypes<"user">;
          return (
            <div className="student-avatar-container" key={student.id}>
              <img
                src={student.image ?? ""}
                alt="Profile"
                className="avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `assets/avatars/${student.avatar}.png`;
                }}
              />
              <span className="avatar-name">
                {student.name!.length > 12
                  ? student.name?.substring(0, 12) + "..."
                  : student.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupWiseStudents;
