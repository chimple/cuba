import React from "react";

const TeacherProfileSection = ({ schoolName, className }) => {
  return (
    <>
      <h2 className="section-title-in-teacher-profile">My Profile</h2>
      <div className="teacher-profile-section">
        <div className="profile-line">School: {schoolName}</div>
        <div className="profile-line">Class: {className}</div>
      </div>
    </>
  );
};

export default TeacherProfileSection;
