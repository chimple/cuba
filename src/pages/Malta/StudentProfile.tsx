import React from "react";
import { useHistory } from "react-router-dom";
// import "./TeacherProfile.css";
import { PAGES } from "../../common/constants";
// import ProfileDetails from "../../teachers-module/components/homePage/library/ProfileDetails";
import StudentProfileSection from "../../components/malta/StudentProfile/StudentProfileSection";
import "./StudentProfile.css";
import { t } from "i18next";
import CloseIcon from "@mui/icons-material/Close";

const StudentProfile: React.FC<{
  name?: string;
}> = ({ name }) => {
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
        <div className="profile-name">{name}</div>
      </div>
      <StudentProfileSection
        school=""
        className=""
        gender=""
        age=""
        classCode=""
      />
      <hr className="horizontal-line-for-view-button-container" />
      <div className="view-button-container">
        <div className="view-button-info">
          {t("Click below to view student's progress")}
        </div>
        <button className="view-button-in-student-profile">
          {t("View Progress")}
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
