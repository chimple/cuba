import React from "react";
import { IonAvatar, IonLabel, IonToolbar } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./ProfileDetail.css";
import { PAGES } from "../../../common/constants";

interface ProfileDetailsProps {
  fullName: string;
  email: string;
}

const ProfileDetail: React.FC<ProfileDetailsProps> = ({ fullName, email }) => {
  const history = useHistory();

  const displayName = fullName.length > 12 ? `${fullName.slice(0, 12)}...` : fullName;
  return (
    <div className="side-menu-header">
      <IonToolbar
        onClick={() => history.replace(PAGES.USER_PROFILE)}
      >
        <IonAvatar slot="start">
          <img src={"assets/avatars/armydog.png"} alt="Profile Avatar" />
        </IonAvatar>
        <div className="profile-details">
          <IonLabel>
            <div
              className="profile-name"
            >
              {displayName}
            </div>
            <div className="profile-email">{email}</div>
          </IonLabel>
        </div>
      </IonToolbar>
    </div>
  );
};

export default ProfileDetail;
