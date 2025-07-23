import React, { useState } from "react";
import "./AddStudentSection.css";
import { t } from "i18next";
import { IonIcon, IonItem, IonRadio, IonRadioGroup, IonSelect, IonSelectOption } from "@ionic/react";
import DropDown from "../../components/DropDown";
import { caretDownSharp } from "ionicons/icons";
import { backgroundClip } from "html2canvas/dist/types/css/property-descriptors/background-clip";
import CustomDropdown from "./CustomDropdown";

interface LanguageOption {
  label: string;
  value: string;
}

interface AddStudentSectionProps {
  languageOptions: LanguageOption[];
  fullName: string;
  age: string;
  gender: string;
  studentId: string;
  language: string;
  onFullNameChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onStudentIdChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
}

const AddStudentSection: React.FC<AddStudentSectionProps> = ({
  languageOptions,
  fullName,
  age,
  gender,
  studentId,
  language,
  onFullNameChange,
  onAgeChange,
  onGenderChange,
  onStudentIdChange,
  onLanguageChange,
}) => {
  const handleAgeChange = (value: string) => {
    if (/^\d{0,2}$/.test(value)) {
      onAgeChange(value);
    }
  };
  // Map language options to fit CustomDropdown's expected format with `displayName`
  const mappedLanguageOptions = languageOptions.map((option) => ({
    id: option.value,
    name: option.label,
  }));
  return (
    <div className="add-studentsection__container">
      <form className="addstudentsection__form" >
        <div className="add-studentsection__group">
          <label htmlFor="name">{t("Name")}</label>
          <input
            type="text"
            id="name"
            name="name"
            className="add-studentsection__groupInput"
            placeholder={t("Enter Name") || ""}
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
          />
        </div>
        <hr className="horizontal-line" />
        <div className="add-studentsection__group">
          <label htmlFor="age">{t("Age")}</label>
          <input
            type="number"
            id="age"
            name="age"
            className="add-studentsection__groupInput"
            placeholder={t("Enter Age") || ""}
            value={age}
            onChange={(e) => handleAgeChange(e.target.value)}
            maxLength={2}
          />
        </div>
        <hr className="horizontal-line" />
        <div className="add-studentsection__group">
          <label htmlFor="studentId">{t("Student Id")}</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            className="add-studentsection__groupInput"
            placeholder={t("Enter student id") || ""}
            value={studentId}
            onChange={(e) => onStudentIdChange(e.target.value)}
          />
        </div>
        <hr className="horizontal-line" />
        <div className="add-studentsection__group">
          <label>{t("Gender")}</label>
          <IonRadioGroup
            value={gender}
            onIonChange={(e) => onGenderChange(e.detail.value)}
          >
            <div className="gender-options">
              <label className="radio-label">
                <IonRadio value="male" className="add-student-radio-btn" /> {t("male")}
              </label>
              <label className="radio-label">
                <IonRadio value="female" className="add-student-radio-btn" /> {t("female")}
              </label>
              <label className="radio-label">
                <IonRadio value="other" className="add-student-radio-btn" /> {t("Other")}
              </label>
            </div>
          </IonRadioGroup>
        </div>
        <hr className="horizontal-line" />
        <div className="add-studentsection__group">
          <label>{t("Preferred Language")}</label>
          <CustomDropdown
            options={mappedLanguageOptions}
            selectedValue={{
              id: language,
              name: mappedLanguageOptions.find(option => option.id === language)?.name || "",
            }}
            onOptionSelect={(selectedOption) => {
              if (selectedOption) {
                onLanguageChange(String(selectedOption.id));
              }
            }}
            placeholder={t("Select Language") as string}
          />
        </div>
      </form>
    </div>
  );
};

export default AddStudentSection;
