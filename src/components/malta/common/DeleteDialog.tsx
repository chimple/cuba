import React, { FC } from "react";
import { IonAlert, IonButton, IonFabButton, IonIcon, useIonAlert } from "@ionic/react";
import { trash } from "ionicons/icons";
interface DeleteDialogProps {
  alertMsg: string;
}

const DeleteDialog: FC<DeleteDialogProps> = ({alertMsg}) => {
  return (
    <>
      <IonIcon icon={trash} id="delete-alert"></IonIcon>
      
      <IonAlert
        header={alertMsg}
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
export default DeleteDialog;
