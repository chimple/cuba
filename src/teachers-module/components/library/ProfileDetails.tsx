import React from "react";
import "./ProfileDetails.css";
import { IonIcon } from "@ionic/react";
import { camera } from "ionicons/icons";

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
  width = "120px",
  height = "120px",
  imgSrc,
  imgAlt = "",
  onImageChange,
  className,
  isEditMode,
}) => {
  return (
    <div className={`profile-details ${className || ""}`}>
      <label htmlFor="profilePic" className="label">
        <img
          src={imgSrc}
          alt={imgAlt}
          className="profile-container"
          style={{ width, height }}
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
  );
};

export default ProfileDetails;
