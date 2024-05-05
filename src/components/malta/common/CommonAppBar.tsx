import * as React from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonIcon,
  IonToolbar,
} from "@ionic/react";
import { t } from "i18next";
import ProfileAvatar from "./ProfileAvatar";
import { trash } from "ionicons/icons";
import DeleteSchoolDialog from "../school/DeleteSchoolDialog";
interface CommonAppBarProps {
  title: string;
  loc: string;
}
const CommonAppBar: React.FC<CommonAppBarProps> = ({ title, loc }) => {
  return (
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref={loc}></IonBackButton>
      </IonButtons>
      <ProfileAvatar
        label={t(title)}
        imgSrc="https://ionicframework.com/docs/img/demos/avatar.svg"
      ></ProfileAvatar>
    </IonToolbar>
  );
};

export default CommonAppBar;
