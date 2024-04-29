import React from "react";

const StudentProfileSection = ({ school, className, gender, age, classCode }) => {
  return (
    <>
      <h2 className="section-title">Student Profile</h2>
      <div className="student-profile-section">
        <div className="profile-lines-container">
          <div className="profile-line">School: {school}</div>
          <div className="profile-line">Class: {className}</div>
          <div className="profile-line">Gender: {gender}</div>
          <div className="profile-line">Age: {age}</div>
          <div className="profile-line">Class Code: {classCode}</div>
        </div>
      </div>
    </>
  );
};

export default StudentProfileSection;
