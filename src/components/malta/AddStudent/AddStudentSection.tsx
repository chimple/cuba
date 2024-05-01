import React, { useState } from "react";
import ProfileDetails from "../ProfileDetails";
import "./AddStudentSection.css";
import { t } from "i18next";

const AddStudentSection = () => {
  const [fullName, setFullName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  const handleAgeChange = (event) => {
    setAge(event.target.value);
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  const handleStudentIdChange = (event) => {
    setStudentId(event.target.value);
  };

  const handleStudentNumberChange = (event) => {
    setStudentNumber(event.target.value);
  };

  return (
    <>
      <div className="student-profile-section-in-addstudent">
        <div className="profile-container2">
          <div className="profile-row">
            <label htmlFor="fullName">{t("Full Name")}:</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="profile-row">
            <label htmlFor="class">{t("Class")}:</label>
            <select
              id="class"
              value={selectedClass}
              onChange={handleClassChange}
            >
              <option value="">{t("Select Class")}</option>
              <option value="1st Standard">1st Standard</option>
              <option value="2nd Standard">2nd Standard</option>
              <option value="3rd Standard">3rd Standard</option>
              {/* Add more options as needed */}
            </select>
          </div>
          <div className="profile-row">
            <label htmlFor="age">{t("Age")}:</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={handleAgeChange}
            />
          </div>
          <div className="profile-row">
            <label htmlFor="studentId">{t("Student ID")}:</label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={handleStudentIdChange}
            />
          </div>
          <div className="profile-row">
            <label htmlFor="studentNumber">{t("Student Number")}:</label>
            <input
              type="text"
              id="studentNumber"
              value={studentNumber}
              onChange={handleStudentNumberChange}
            />
          </div>
          <div className="profile-row gender-line">
            <label>{t("Gender:")}</label>
            <div className="gender-options">
              <input
                type="radio"
                id="male"
                name="gender"
                value="male"
                checked={gender === "male"}
                onChange={handleGenderChange}
              />
              <label htmlFor="male">{t("Male")}</label>

              <input
                type="radio"
                id="female"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={handleGenderChange}
              />
              <label htmlFor="female">{t("Female")}</label>

              <input
                type="radio"
                id="other"
                name="gender"
                value="other"
                checked={gender === "other"}
                onChange={handleGenderChange}
              />
              <label htmlFor="other">{t("Other")}</label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddStudentSection;
