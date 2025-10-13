import React, { useEffect, useState } from "react";
import "./StudentReportHeader.css";
import CustomDropdown from "../CustomDropdown";
import { TableTypes } from "../../../common/constants";
import { t } from "i18next";
import ImageDropdown from "../imageDropdown";

interface StudentReportHeaderProps {
  student: TableTypes<"user">;
  selectedSubject?: TableTypes<"course">;
  mappedSubjectOptions: { id: string; name: string, icon: string, subjectDetail: string }[];
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
          src={student.image ?? `assets/avatars/${student.avatar}.png`}
          alt="Profile"
          className="report-student-avatar"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `assets/avatars/${student.avatar}.png`;
          }}
        />
      </div>
      <div className="report-student-dropdown">
        <ImageDropdown
  options={mappedSubjectOptions}
  selectedValue={{
    id: selectedSubject?.id ?? "",
    name: selectedSubject?.name ?? "",
    icon:
      (selectedSubject as any)?.icon ??
      mappedSubjectOptions.find((option) => option.id === selectedSubject?.id)?.icon ??
      "",
    subjectDetail:
      (selectedSubject as any)?.subjectDetail ??
      mappedSubjectOptions.find((option) => option.id === selectedSubject?.id)?.subjectDetail ??
      "",
  }}
  onOptionSelect={onSubjectChange}
  placeholder={t("Select Language") as string}
  isDownBorder={false}
/>
      </div>
    </div>
  );
};

export default StudentReportHeader;
