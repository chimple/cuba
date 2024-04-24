import React from "react";
import { useHistory } from "react-router-dom";
import "./TeacherProfile.css";
import { PAGES } from "../../common/constants";
import ProfileDetails from "../../components/malta/ProfileDetails";
import StudentProfileSection from "../../components/malta/StudentProfile/StudentProfileSection";
import "./StudentProfile.css";

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
        <ProfileDetails
          imgSrc="path_to_teacher_profile_image.jpg"
          width=""
          height="20vh"
        />
        <div className="profile-name">John Doe </div>
      </div>
      <StudentProfileSection />
      <hr className="horizontal-line-for-view-button-container" />
      <div className="view-button-container">
        <div className="view-button-info">
          Click below to view Student's progress
        </div>
        <button className="view-button-in-student-profile">
          View Progress
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
