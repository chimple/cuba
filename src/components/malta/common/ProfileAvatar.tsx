import { FC } from "react";
import { IonAvatar, IonItem, IonLabel } from "@ionic/react";
interface ProfileAvatarProps {
  label: string;
  imgSrc: string;
}
const ProfileAvatar: FC<ProfileAvatarProps> = ({ label, imgSrc }) => {
  return (
    <>
      <IonItem>
        <IonAvatar slot="start">
          <img alt="Silhouette of a person's head" src={imgSrc} />
        </IonAvatar>
        <IonLabel>{label}</IonLabel>
      </IonItem>
    </>
  );
};
export default ProfileAvatar;
