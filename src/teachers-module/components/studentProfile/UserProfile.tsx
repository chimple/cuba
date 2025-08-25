import React, { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import "./UserProfile.css";
import { PAGES, TableTypes } from "../../../common/constants";
import { t } from "i18next";
import { useHistory } from "react-router-dom";
import ProfileDetails from "../library/ProfileDetails";

const UserProfile: React.FC<{
  student: TableTypes<"user">;
  classDoc: TableTypes<"class"> | undefined;
  isEditing: boolean;
  setStudent: React.Dispatch<React.SetStateAction<TableTypes<"user"> | undefined>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentClass: React.Dispatch<React.SetStateAction<TableTypes<"class"> | undefined>>;
  allClasses: TableTypes<"class">[];
}> = ({ student, classDoc, isEditing, setStudent, setIsEditing, setCurrentClass, allClasses }) => {
  const history = useHistory();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);


  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log("Input Changed:", name, value);
    setStudent((prevState) => {
      if (!prevState) return prevState;

      let updatedValue: any = value;

      if (name === "age") {
        const ageValue = parseInt(value);
        updatedValue = (ageValue >= 0 && ageValue <= 99) ? ageValue : prevState.age;
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
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClassId = e.target.value;
    const selectedClass = allClasses.find(cls => cls.id === selectedClassId);
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
          <ProfileDetails
            imgSrc={profilePic || "assets/avatars/" + (student.avatar ?? "") + ".png"}
            imgAlt="Profile Pic"
            onImageChange={handleProfilePicChange}
            isEditMode={isEditing}
          />
        </div>
        <div className="profile-info">
          <div className="student-name1">
            {isEditing ? (
              ""
            ) : (
              student.name
            )}
          </div>
          {!isEditing && (
            <EditIcon className="edit-icon" onClick={handleEditClick} />
          )}
        </div>
      </div>
      <div className="profile-content">
        <div className="profile-card">
          {/* Name */}
          <div className="profile-row">
            <p className="profile-label">
              <strong>{t("Name") + ":"}</strong>
            </p>
            <p className="profile-value">
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
            </p>
          </div>
          <hr className="horizontal-line" />
          {/* Age */}
          <div className="profile-row">
            <p className="profile-label">
              <strong>{t("Age") + ":"}</strong>
            </p>
            <p className="profile-value">
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
            </p>
          </div>
          <hr className="horizontal-line" />
          {/* Class */}
          <div className="profile-row">
            <p className="profile-label">
              <strong>{t("Class") + ":"}</strong>
            </p>
            <p className="profile-value">
              {isEditing ? (
                <select
                  name="class"
                  value={classDoc?.id}
                  onChange={handleClassChange}
                >
                  {allClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              ) : (
                classDoc?.name
              )}
            </p>
          </div>
          <hr className="horizontal-line" />
          {/* Student ID */}
          <div className="profile-row">
            <p className="profile-label">
              <strong>{t("Student Id") + ":"}</strong>
            </p>
            <p className="profile-value">
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
            </p>
          </div>
          <hr className="horizontal-line" />
          {/* Gender */}
          <div className="profile-row">
            <p className="profile-label">
              <strong>{t("Gender") + ":"}</strong>
            </p>
            <p className="profile-value">
              {isEditing ? (
                <div className="gender-options">
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
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
