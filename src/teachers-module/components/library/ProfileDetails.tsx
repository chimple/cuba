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
  imgSrc,
  imgAlt = "",
  onImageChange,
  className,
  isEditMode,
}) => {
  return (
    <div className={`profile-details ${className || ""}`}>
      <label htmlFor="profilePic" className="profile-details-data">
        <img
          src={imgSrc}
          alt=''
          className="profile-details-img"
        />
        {isEditMode &&
          <div className="overlay">
            <IonIcon className="camera-icon" icon={camera} size="large" />
          </div>
        }
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
