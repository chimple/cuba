import {
  IonCol,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
} from "@ionic/react";
import { FC } from "react";
import "./SchoolDetail.css";
import { t } from "i18next";
interface SchoolDetailProps {
  schoolName: string;
  cityName: string;
  stateName: string;
}
const SchoolDetail: FC<SchoolDetailProps> = ({
  schoolName,
  cityName,
  stateName,
}) => {
  return (
    <div className="alignItems">
      <IonItem lines="none" color={"#fff"}>
        <IonLabel>{t("School name ")}</IonLabel>
        <IonLabel>{schoolName}</IonLabel>
      </IonItem>
      <IonItem lines="none" color={"#fff"}>
        <IonLabel>{t("City ")}</IonLabel>
        <IonLabel>{cityName}</IonLabel>
      </IonItem>
      <IonItem lines="none" color={"#fff"}>
        <IonLabel>{t("State ")}</IonLabel>
        <IonLabel>{stateName}</IonLabel>
      </IonItem>
    </div>
  );
};
export default SchoolDetail;
