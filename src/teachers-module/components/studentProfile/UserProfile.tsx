import React, { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import "./UserProfile.css";
import { PAGES, TableTypes } from "../../../common/constants";
import { t } from "i18next";
import { useHistory } from "react-router-dom";
import ProfileDetails from "../library/ProfileDetails";
import CustomDropdown from "../CustomDropdown";

const UserProfile: React.FC<{
  student: TableTypes<"user">;
  classDoc: TableTypes<"class"> | undefined;
  isEditing: boolean;
  setStudent: React.Dispatch<
    React.SetStateAction<TableTypes<"user"> | undefined>
  >;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentClass: React.Dispatch<
    React.SetStateAction<TableTypes<"class"> | undefined>
  >;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  allClasses: TableTypes<"class">[];
}> = ({
  student,
  classDoc,
  isEditing,
  setStudent,
  setIsEditing,
  setCurrentClass,
  setSelectedFile,
  allClasses,
}) => {
  const history = useHistory();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudent((prevState) => {
      if (!prevState) return prevState;

      let updatedValue: any = value;

      if (name === "age") {
        const ageValue = parseInt(value);
        updatedValue =
          ageValue >= 0 && ageValue <= 99 ? ageValue : prevState.age;
      }

      return {
        ...prevState,
        [name]: updatedValue,
      };
    });
  };

  const handleGenderChange = (value: string) => {
    setStudent((prevState) => {
      if (!prevState) return prevState; // Ensure prevState is not undefined

      return {
        ...prevState,
        gender: value,
      };
    });
  };
  const handleProfilePicChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      setSelectedFile(file);
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleClassChange = (selectedClassId: string | number) => {
    const selectedClass = allClasses.find((cls) => cls.id === selectedClassId);
    setStudent((prevState) => {
      if (!prevState) return prevState;

      return {
        ...prevState,
        class: selectedClass?.id,
      };
    });
    setCurrentClass(selectedClass);
  };
  return (
    <>
      <div className="first-content">
        <div className="profile-details-container">
          {isEditing && <span className="add-student-text">{t("Edit Student")}</span>}
          <ProfileDetails
            imgSrc={
              profilePic ||
              student.image ||
              "assets/avatars/" + (student.avatar ?? "") + ".png"
            }
            imgAlt="Profile Pic"
            onImageChange={handleProfilePicChange}
            isEditMode={isEditing}
          />
        </div>
        <div className="profile-info">
          <div className="student-name1">{isEditing ? "" : student.name}</div>
          {!isEditing && (
            <img
              src="assets/icons/editIcon.svg"
              alt="Edit_Icon"
              className="edit-icon"
              onClick={handleEditClick}
            />
          )}
        </div>
      </div>
      <div className="userprofile-content">
        <div className="userprofile-card">
          {/* Name */}
          <div className="userprofile-row">
            <span className="userprofile-label">
              <span>{t("Name") + ":"}</span>
            </span>
            <span className="userprofile-value">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={student.name || ""}
                  onChange={handleInputChange}
                />
              ) : (
                student.name
              )}
            </span>
          </div>
          <hr className="horizontal-line" />
          {/* Age */}
          <div className="userprofile-row">
            <span className="userprofile-label">
              <span>{t("Age") + ":"}</span>
            </span>
            <span className="userprofile-value">
              {isEditing ? (
                <input
                  type="number"
                  name="age"
                  value={student.age !== null ? student.age.toString() : ""}
                  onChange={handleInputChange}
                />
              ) : (
                student.age
              )}
            </span>
          </div>
          <hr className="horizontal-line" />
          {/* Class */}
          <div className="userprofile-row">
            <span className="userprofile-label">
              <span>{t("Class") + ":"}</span>
            </span>
            <span className="userprofile-value">
              {isEditing ? (
                <div className="userprofile-dropdown">
                  <CustomDropdown
                    options={allClasses.map((cls) => ({
                      id: cls.id,
                      name: cls.name,
                    }))}
                    selectedValue={{
                      id: classDoc?.id ?? "",
                      name: classDoc?.name ?? t("Select Class"),
                    }}
                    onOptionSelect={(selected) =>
                      handleClassChange(selected?.id)
                    }
                    isDownBorder={false}
                  />
                </div>
              ) : (
                classDoc?.name
              )}
            </span>
          </div>
          <hr className="horizontal-line" />
          {/* Student ID */}
          <div className="userprofile-row">
            <span className="userprofile-label">
              <span>{t("Student Id") + ":"}</span>
            </span>
            <span className="userprofile-value">
              {isEditing ? (
                <input
                  type="text"
                  name="student_id"
                  value={student.student_id || ""}
                  onChange={handleInputChange}
                />
              ) : (
                student.student_id
              )}
            </span>
          </div>
          <hr className="horizontal-line" />
          {/* Gender */}
          <div className="userprofile-row">
            <span className="userprofile-label">
              <span>{t("Gender") + ":"}</span>
            </span>
            <span className="userprofile-value">
              {isEditing ? (
                <div className="usergender-options">
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={student.gender === "male"}
                      onChange={() => handleGenderChange("male")}
                    />{" "}
                    {t("male")}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={student.gender === "female"}
                      onChange={() => handleGenderChange("female")}
                    />{" "}
                    {t("female")}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={student.gender === "other"}
                      onChange={() => handleGenderChange("other")}
                    />{" "}
                    {t("Other")}
                  </label>
                </div>
              ) : (
                t(student.gender ?? "")
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
