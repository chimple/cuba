import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { t } from "i18next";
import RecommendedAssignment from '../../components/malta/assignment/RecommendedAssignment';
import AssignButton from '../../components/malta/assignment/AssignButton';
import "./SelectedAssignment.css";

const SelectedAssignment: React.FC = () => {
  return (
    <IonPage style={{ backgroundColor: "white" }}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="#"></IonBackButton>
          </IonButtons>
          <IonTitle>{t("Selected Assignments")}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <RecommendedAssignment infoText="These are the assignments you have chosen to assign"></RecommendedAssignment>
      <AssignButton disabled={false} onClicked={() => {}}></AssignButton>
    </IonPage>
  );
};

export default SelectedAssignment;
