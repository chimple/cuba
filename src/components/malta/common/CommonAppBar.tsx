import * as React from "react";
import { IonBackButton, IonButtons, IonLabel, IonToolbar } from "@ionic/react";
import { t } from "i18next";
import ProfileAvatar from "./ProfileAvatar";
import "./CommonAppBar.css";
interface CommonAppBarProps {
  title: string;
  loc: string;
  showAvatar: boolean;
  imgScr: string;
}
const CommonAppBar: React.FC<CommonAppBarProps> = ({
  title,
  loc,
  showAvatar,
  imgScr,
}) => {
  return (
    <IonToolbar className="common-appBar" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
      <IonButtons placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} slot="start">
        <IonBackButton defaultHref={loc}></IonBackButton>
      </IonButtons>
      {showAvatar ? (
        <ProfileAvatar label={t(title)} imgSrc={imgScr}></ProfileAvatar>
      ) : (
        <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{title}</IonLabel>
      )}
    </IonToolbar>
  );
};

export default CommonAppBar;
