import {
  IonCard,
  IonCardContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
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
      <IonCard color={'#fff'} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonCardContent placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonItem lines="none" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} >
            <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{t("School name")}</IonLabel>
            <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{schoolName}</IonLabel>
          </IonItem>
          <IonItem lines="none" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{t("City")}</IonLabel>
            <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{cityName}</IonLabel>
          </IonItem>
          <IonItem lines="none" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} >
            <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{t("State")}</IonLabel>
            <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{stateName}</IonLabel>
          </IonItem>
        </IonCardContent>
      </IonCard>
    </div>
  );
};
export default SchoolDetail;
