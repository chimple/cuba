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
    <IonPage style={{ backgroundColor: "white" }}>
      <IonHeader>
        <IonToolbar className="toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="#"></IonBackButton>
          </IonButtons>
          <IonTitle>{t("Selected Assignments")}</IonTitle>
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
