import React, { FC } from "react";
import { IonAlert, IonButton, IonFabButton, IonIcon } from "@ionic/react";
import { trash } from "ionicons/icons";

const DeleteSchoolDialog: FC = () => {
  return (
    <>
      <IonFabButton>
        <IonIcon icon={trash} id="delete-alert"></IonIcon>
      </IonFabButton>
      <IonAlert
        header="Are you sure to delete the school"
        trigger="delete-alert"
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              console.log("Alert canceled");
            },
          },
          {
            text: "OK",
            role: "confirm",
            handler: () => {
              console.log("Alert confirmed");
            },
          },
        ]}
        onDidDismiss={({ detail }) =>
          console.log(`Dismissed with role: ${detail.role}`)
        }
      ></IonAlert>
    </>
  );
};
export default DeleteSchoolDialog;
