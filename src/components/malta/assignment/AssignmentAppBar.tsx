import * as React from "react";
import { IonBackButton, IonButtons, IonTitle, IonToolbar } from "@ionic/react";
import { t } from "i18next";

const AssignmentAppBar: React.FC = () => {
  return (
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="#"></IonBackButton>
      </IonButtons>
      <IonTitle>{t("Assignment")}</IonTitle>
    </IonToolbar>
  );
};

export default AssignmentAppBar;
