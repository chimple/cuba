import React, { useEffect, useState } from "react";
import "./StudentReportHeader.css";
import CustomDropdown from "../CustomDropdown";
import { TableTypes } from "../../../common/constants";
import { t } from "i18next";

interface StudentReportHeaderProps {
  student: TableTypes<"user">;
  selectedSubject?: TableTypes<"course">;
  mappedSubjectOptions: { id: string; name: string }[];
  currentClass?: TableTypes<"class">;
  onSubjectChange;
}
const StudentReportHeader: React.FC<StudentReportHeaderProps> = ({
  student,
  selectedSubject,
  mappedSubjectOptions,
  currentClass,
  onSubjectChange,
}) => {
  return (
    <div className="report-student-profile">
      <div className="report-student-details">
        <div className="report-student-info">
          <div className="report-student-name">{student.name}</div>
          <div className="report-student-class-name">{currentClass?.name}</div>
        </div>
        <img
          src={student.image ?? ""}
          alt="Profile"
          className="report-student-avatar"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `assets/avatars/${student.avatar}.png`;
          }}
        />
      </div>
      <div className="report-student-dropdown">
        <CustomDropdown
          options={mappedSubjectOptions ?? []}
          selectedValue={{
            id: selectedSubject?.id ?? "",
            name: selectedSubject?.name ?? "",
          }}
          onOptionSelect={onSubjectChange}
          placeholder={t("Select Language") as string}
          isDownBorder={false}
          disableTranslation={true}
        />
      </div>
    </div>
  );
};

export default StudentReportHeader;
