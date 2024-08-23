import React from "react";
import { useHistory } from "react-router-dom";
import "./TeacherProfile.css";
import { PAGES } from "../../common/constants";
// import ProfileDetails from "../../chimple-private/components/homePage/library/ProfileDetails";
import LogoutSection from "../../components/malta/TeacherProfile/LogoutSection";
import TeacherProfileSection from "../../components/malta/TeacherProfile/TeacherProfileSection";
import CloseIcon from "@mui/icons-material/Close";

const TeacherProfile: React.FC<{
  name?: string;
  email?: string;
}> = ({ name, email }) => {
  const history = useHistory();

  const handleBack = () => {
    history.replace(PAGES.HOME);
  };

  return (
    <div className="teacher-profile">
      <button className="close-button" onClick={handleBack}>
        <CloseIcon />
      </button>
      <div className="profile-container-section">
        {/* <ProfileDetails imgSrc="" width="" height="20vh" /> */}
      </div>
      <div className="profile-name-in-teacher-profile">{name}</div>
      <div className="profile-email-in-teacher-profile">{email}</div>
      <TeacherProfileSection schoolName="" className="" />
      <div className="logout-container">
        <LogoutSection />
      </div>
    </div>
  );
};

export default TeacherProfile;
