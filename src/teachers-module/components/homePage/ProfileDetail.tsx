import React from "react";
import { IonAvatar, IonLabel, IonToolbar } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./ProfileDetail.css";

interface ProfileDetailsProps {
  fullName: string;
  email: string;
}

const ProfileDetail: React.FC<ProfileDetailsProps> = ({ fullName, email }) => {
  const history = useHistory();
  return (
    <div className="side-menu-header">
      <IonToolbar>
        <IonAvatar slot="start">
          <img src={"assets/avatars/armydog.png"} alt="Profile Avatar" />
        </IonAvatar>
        <div className="profile-details">
          <IonLabel>
            <div
              onClick={() => history.replace("/user-profile")}
              className="profile-name"
            >
              {fullName}
            </div>
            <div className="profile-email">{email}</div>
          </IonLabel>
        </div>
      </IonToolbar>
    </div>
  );
};

export default ProfileDetail;
