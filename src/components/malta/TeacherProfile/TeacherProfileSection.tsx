import { t } from "i18next";
import React from "react";

const TeacherProfileSection = ({ schoolName, className }) => {
  return (
    <>
      <h2 className="section-title-in-teacher-profile">{t("My Profile")}</h2>
      <div className="teacher-profile-section">
        <div className="profile-line">{t("School:")}{schoolName}</div>
        <div className="profile-line">{t("Class:")}{className}</div>
      </div>
    </>
  );
};

export default TeacherProfileSection;
