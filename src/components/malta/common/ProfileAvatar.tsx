import { FC } from "react";
import { IonAvatar, IonItem, IonLabel } from "@ionic/react";
import "./CommonAppBar.css";
interface ProfileAvatarProps {
  label: string;
  imgSrc: string;
}
const ProfileAvatar: FC<ProfileAvatarProps> = ({ label, imgSrc }) => {
  return (
    <>
      <IonItem className="item" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonAvatar slot="start" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <img alt="Silhouette of a person's head" src={imgSrc} />
        </IonAvatar>
        <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{label}</IonLabel>
      </IonItem>
    </>
  );
};
export default ProfileAvatar;
