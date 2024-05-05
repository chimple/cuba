import { IonInput, IonItem, IonLabel, IonList } from "@ionic/react";
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
      <IonItem color={"white"}>
        <IonLabel>{t("School name : ")}</IonLabel>
        <IonLabel>{schoolName}</IonLabel>
      </IonItem>
      <IonItem color={"white"}>
        <IonLabel>{t("City : ")}</IonLabel>
        <IonLabel>{cityName}</IonLabel>
      </IonItem>
      <IonItem color={"white"}>
        <IonLabel>{t("State : ")}</IonLabel>
        <IonLabel>{stateName}</IonLabel>
      </IonItem>
    </div>
  );
};
export default SchoolDetail;
