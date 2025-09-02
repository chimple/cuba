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

  const displayName = fullName.length > 12 ? `${fullName.slice(0, 12)}...` : fullName;
  return (
    <div className="side-menu-header">
      <IonToolbar placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonAvatar slot="start" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <img src={"assets/avatars/armydog.png"} alt="Profile Avatar" />
        </IonAvatar>
        <div className="profile-details">
          <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            <div
              onClick={() => history.replace("/user-profile")}
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
