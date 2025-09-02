import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { t } from "i18next";
import RecommendedAssignment from "../../components/malta/assignment/RecommendedAssignment";
import "./SelectedAssignment.css";
import CommonButton from "../../components/malta/common/CommonButton";

const SelectedAssignment: React.FC = () => {
  return (
    <IonPage placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} style={{ backgroundColor: "white" }}>
      <IonHeader placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonToolbar className="toolbar" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonButtons placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} slot="start">
            <IonBackButton defaultHref="#"></IonBackButton>
          </IonButtons>
          <IonTitle placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{t("Selected Assignments")}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <RecommendedAssignment infoText="These are the assignments you have chosen to assign"></RecommendedAssignment>
      <CommonButton
        title="Assign"
        disabled={false}
        onClicked={() => {}}
      ></CommonButton>
    </IonPage>
  );
};

export default SelectedAssignment;
