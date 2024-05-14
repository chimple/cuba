import React, { FC } from "react";
import {
  IonAlert,
  IonButton,
  IonFabButton,
  IonIcon,
  useIonAlert,
} from "@ionic/react";
import { trash, add, create } from "ionicons/icons";
interface CommonDialogProps {
  children?: React.ReactNode | React.ReactNode[];
  alertMsg: string;
  ionIcon: string;
}

const CommonDialog: FC<CommonDialogProps> = ({ alertMsg, ionIcon }) => {
  return (
    <>
      <IonIcon icon={ionIcon} id="alert"></IonIcon>

      <IonAlert
        header={alertMsg}
        trigger="alert"
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
export default CommonDialog;
