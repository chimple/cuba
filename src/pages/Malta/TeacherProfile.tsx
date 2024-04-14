import React from "react";
import { useHistory } from "react-router-dom";
import "./TeacherProfile.css";
import { ReactComponent as CloseIcon } from "./close-icon.svg"; // Ensure the SVG is correctly placed in your project
import { PAGES } from "../../common/constants";
import ProfileDetails from "../../components/malta/ProfileDetails";
import MyProfileSection from "../../components/malta/MyProfileSection";
import LogoutSection from "../../components/malta/LogoutSection";

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
        <ProfileDetails />
      </div>
      <MyProfileSection />
      <div className="logout-container">
        <LogoutSection />
      </div>
    </div>
  );
};

export default TeacherProfile;
