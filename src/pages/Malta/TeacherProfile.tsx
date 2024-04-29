import React from "react";
import { useHistory } from "react-router-dom";
import "./TeacherProfile.css";
import { PAGES } from "../../common/constants";
import ProfileDetails from "../../components/malta/ProfileDetails";
import LogoutSection from "../../components/malta/TeacherProfile/LogoutSection";
import TeacherProfileSection from "../../components/malta/TeacherProfile/TeacherProfileSection";

const TeacherProfile = () => {
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
      </div>
      <div className="profile-name-in-teacher-profile">John Doe </div>
      <div className="profile-email-in-teacher-profile">
        john.doe@example.com
      </div>
      <TeacherProfileSection schoolName="ABC School" className="10th Grade" />
      <div className="logout-container">
        <LogoutSection />
      </div>
    </div>
  );
};

export default TeacherProfile;
