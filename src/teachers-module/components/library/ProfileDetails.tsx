import React from 'react';
import './ProfileDetails.css';
import { IonIcon } from '@ionic/react';
import { camera } from 'ionicons/icons';
import { getTrackableProps } from '../../../analytics/trackable';

interface ProfileDetailsProps {
  width?: string;
  height?: string;
  imgSrc: string;
  imgAlt?: string;
  onImageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  isEditMode?: boolean;
  trackableId?: string;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  imgSrc,
  imgAlt = '',
  onImageChange,
  className,
  isEditMode,
  trackableId,
}) => {
  return (
    <div className={`profile-details-main ${className || ''}`}>
      <label
        htmlFor="profilePic"
        id={trackableId}
        {...(trackableId ? getTrackableProps(trackableId) : {})}
        className={`profile-details-data ${trackableId ?? ''}`.trim()}
      >
        <img src={imgSrc} alt="" className="profile-details-img" />
        {isEditMode && (
          <div className="overlay">
            <IonIcon className="camera-icon" icon={camera} size="large" />
          </div>
        )}
      </label>
      {isEditMode && (
        <input
          type="file"
          id="profilePic"
          name="profilePic"
          accept="image/*"
          onChange={onImageChange}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default ProfileDetails;
