import React, { useState } from "react";
import "./AddStudentSection.css";
import { t } from "i18next";
import InputField from "./InputField";
import RadioButton from "./RadioButton";

const classOptions = [
  { label: "1st Standard", value: "1st Standard" },
  { label: "2nd Standard", value: "2nd Standard" },
  { label: "3rd Standard", value: "3rd Standard" },
];

const AddStudentSection = () => {
  const [fullName, setFullName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  return (
    <>
      <div className="student-profile-section-in-addstudent">
        <div className="profile-container2">
          <InputField label="Full Name" type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="profile-row">
            <label htmlFor="class">{t("Class")}:</label>
            <select
              id="class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">{t("Select Class")}</option>
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>
          <InputField label="Age" type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} />
          <InputField label="Student ID" type="text" id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <InputField label="Student Number" type="text" id="studentNumber" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} />
          <div className="profile-row gender-line">
            <label>{t("Gender")}:</label>
            <div className="gender-options">
              <RadioButton id="male" name="gender" checked={gender} onChange={handleGenderChange} label="Male" />
              <RadioButton id="female" name="gender" checked={gender} onChange={handleGenderChange} label="Female" />
              <RadioButton id="other" name="gender" checked={gender} onChange={handleGenderChange} label="Other" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddStudentSection;
