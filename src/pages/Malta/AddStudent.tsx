import React from "react";
import { useHistory } from "react-router-dom";
import "./TeacherProfile.css";
import "./AddStudent.css";
import { PAGES } from "../../common/constants";
import ProfileDetails from "../../components/malta/ProfileDetails";
import AddStudentSection from "../../components/malta/AddStudentSection";

const AddStudent = () => {
  const history = useHistory();

  const handleBack = () => {
    history.replace(PAGES.HOME);
  };
  const handleSave = () => {};

  return (
    <div className="add-student-page">
      <button className="close-button" onClick={handleBack}>
        X
      </button>
      <div className="header-for-add-student">
        <h1 className="title">Add Student</h1>
      </div>
      <div className="profile-container-section">
        <ProfileDetails
          imgSrc="path_to_teacher_profile_image.jpg"
          width=""
          height="20vh"
        />
      </div>
      <AddStudentSection />
      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default AddStudent;
