import React from "react";
import "./ProfileDetails.css";

interface ProfileDetailsProps {
  width?: string;
  height?: string;
  imgSrc: string;
  imgAlt?: string;
  className?: string;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  width = '100px', 
  height = '100px', 
  imgSrc,
  imgAlt = '',
  className
}) => {
  return (
    <div className={`profile-details ${className || ''}`}>
      <div className="">
        <img src={imgSrc} alt={imgAlt} className="profile-container" style={{ width, height }} />
      </div>
    </div>
  );
};

export default ProfileDetails;

