import * as React from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonIcon,
  IonLabel,
  IonToolbar,
} from "@ionic/react";
import { t } from "i18next";
import ProfileAvatar from "./ProfileAvatar";
import './CommonAppBar.css';
interface CommonAppBarProps {
  title: string;
  loc: string;
  showAvatar: boolean;
  imgScr: string;
}
const CommonAppBar: React.FC<CommonAppBarProps> = ({ title, loc, showAvatar, imgScr }) => {
  return (
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref={loc}></IonBackButton>
      </IonButtons>
      {showAvatar?<ProfileAvatar
        label={t(title)}
        imgSrc={imgScr}
      ></ProfileAvatar>:<IonLabel>{title}</IonLabel>}
    </IonToolbar>
  );
};

export default CommonAppBar;
