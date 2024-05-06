import React from "react";
import { t } from "i18next";

interface StudentProfileSectionProps {
  school: string;
  className: string;
  gender: string;
  age: string;
  classCode: string;
}

const StudentProfileSection: React.FC<StudentProfileSectionProps> = ({
  school,
  className,
  gender,
  age,
  classCode,
}) => {
  return (
    <>
      <h2 className="section-title">{t("Student Profile")}</h2>
      <div className="student-profile-section">
        <div className="profile-lines-container">
          <div className="profile-line">
            {t("School")}:{school}
          </div>
          <div className="profile-line">
            {t("Class")}:{className}
          </div>
          <div className="profile-line">
            {t("Gender")}:{gender}
          </div>
          <div className="profile-line">
            {t("Age")}:{age}
          </div>
          <div className="profile-line">
            {t("Class Code")}:{classCode}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfileSection;
