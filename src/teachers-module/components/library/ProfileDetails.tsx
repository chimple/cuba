import React from "react";
import "./ProfileDetails.css";
import { IonIcon } from "@ionic/react";
import { camera } from "ionicons/icons";
import { t } from "i18next";
import { useLocation } from "react-router-dom";

interface ProfileDetailsProps {
  width?: string;
  height?: string;
  imgSrc: string;
  imgAlt?: string;
  onImageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  isEditMode?: boolean;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  imgSrc,
  imgAlt = "",
  onImageChange,
  className,
  isEditMode,
}) => {
  const location = useLocation();
  const isAddStudentRoute = location.pathname === "/add_student"

  const containerStyle = isAddStudentRoute ? {
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        marginRight: "26vw",
  } : undefined;

  return (
    <div className={`profile-details ${className || ""}`}>
      <div style={containerStyle}>
        {isAddStudentRoute && (
          <h2 style={{ color: '#707070', fontSize: '20px', fontWeight: "600" }}>
            {t("Add Student")}
          </h2>
        )}
      <label htmlFor="profilePic" className="profile-details-data">
        <img
          src={imgSrc}
          alt=''
          className="profile-details-img"
        />
        <div className="overlay">
          <IonIcon className="camera-icon" icon={camera} size="large" />
        </div>
      </label>
      {isEditMode && (
        <input
          type="file"
          id="profilePic"
          name="profilePic"
          accept="image/*"
          onChange={onImageChange}
          style={{ display: "none" }}
        />
      )}
      </div>
    </div>
  );
};

export default ProfileDetails;
