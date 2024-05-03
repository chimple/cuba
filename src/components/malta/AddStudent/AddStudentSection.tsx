import React, { useState } from "react";
import "./AddStudentSection.css";
import { t } from "i18next";
import InputField from "./InputField";
import GenderSelection from "./GenderSelection";
import SelectDropdown from "./SelectDropdown";

const classOptions = [
  { label: "1st Standard", value: "1st Standard" },
  { label: "2nd Standard", value: "2nd Standard" },
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
          <InputField
            label="Full Name"
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <SelectDropdown
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classOptions}
          />
          <InputField
            label="Age"
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <InputField
            label="Student ID"
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          <InputField
            label="Student Number"
            type="text"
            id="studentNumber"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
          />
          <GenderSelection
            gender={gender}
            onGenderChange={handleGenderChange}
          />
        </div>
      </div>
    </>
  );
};

export default AddStudentSection;
