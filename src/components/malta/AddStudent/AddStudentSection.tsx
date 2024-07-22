import React, { useState } from "react";
import "./AddStudentSection.css";
import InputField from "./InputField";
import GenderSelection from "./GenderSelection";
import SelectDropdown from "./SelectDropdown";

interface ClassOption {
  label: string;
  value: string;
}

interface AddStudentSectionProps {
  classOptions: ClassOption[];
}

const AddStudentSection: React.FC<AddStudentSectionProps> = ({
  classOptions,
}) => {
  const [fullName, setFullName] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassOption | undefined>(
    classOptions[0] || undefined
  );
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  const handleGenderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
            value={selectedClass?.value || ""}
            onChange={(e) => {
              const selectedOption = classOptions.find(
                (option) => option.value === e.target.value
              );
              setSelectedClass(selectedOption);
            }}
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
