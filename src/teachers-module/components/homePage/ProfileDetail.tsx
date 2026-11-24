import React from 'react';
import { IonAvatar, IonLabel, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './ProfileDetail.css';
import { PAGES } from '../../../common/constants';
import { getTrackableProps, TRACKABLE_IDS } from '../../../analytics/trackable';

interface ProfileDetailsProps {
  fullName: string;
  email: string;
}

const ProfileDetail: React.FC<ProfileDetailsProps> = ({ fullName, email }) => {
  const history = useHistory();

  const displayName =
    fullName.length > 12 ? `${fullName.slice(0, 12)}...` : fullName;
  return (
    <div className="side-menu-header">
      <IonToolbar
        id={TRACKABLE_IDS.TEACHER_MENU_PROFILE_BUTTON}
        {...getTrackableProps(TRACKABLE_IDS.TEACHER_MENU_PROFILE_BUTTON)}
        className="teacher-menu-profile-button teacher_menu_profile_button"
        onClick={() => history.push(PAGES.USER_PROFILE)}
      >
        <IonAvatar slot="start">
          <img src={'assets/avatars/armydog.png'} alt="Profile Avatar" />
        </IonAvatar>
        <div className="profile-details">
          <IonLabel>
            <div className="profile-name">{displayName}</div>
            <div className="profile-email">{email}</div>
          </IonLabel>
        </div>
      </IonToolbar>
    </div>
  );
};

export default ProfileDetail;
