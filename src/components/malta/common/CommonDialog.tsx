import React, { FC } from "react";
import {
  IonAlert,
  IonIcon,
} from "@ionic/react";
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
        isOpen = {true}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {},
          },
          {
            text: "OK",
            role: "confirm",
            handler: () => {},
          },
        ]}
        onDidDismiss={({ detail }) =>
          {}
        }
      ></IonAlert>
    </>
  );
};
export default CommonDialog;
