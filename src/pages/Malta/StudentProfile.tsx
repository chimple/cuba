import React from "react";
import { useHistory } from "react-router-dom";
import "./TeacherProfile.css";
import { PAGES } from "../../common/constants";
import ProfileDetails from "../../components/malta/ProfileDetails";
import TeacherProfileSection from "../../components/malta/TeacherProfileSection";
import StudentProfileSection from "../../components/malta/StudentProfileSection";

const StudentProfile = () => {
  const history = useHistory();

  const handleBack = () => {
    history.replace(PAGES.HOME);
  };

  return (
    <div className="teacher-profile">
      <button className="close-button" onClick={handleBack}>
        X
      </button>
      <div className="profile-container-section">
        <ProfileDetails />
      </div>
      <StudentProfileSection />
    </div>
  );
};

export default StudentProfile;
