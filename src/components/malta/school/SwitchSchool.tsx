import { IonItem, IonList, IonRadio, IonRadioGroup } from "@ionic/react";
import { FC } from "react";
import "./SwitchSchool.css";

const SwitchSchool: FC = () => {
  return (
    <div className="alignContent">
      <IonRadioGroup value="school1">
        <IonRadio value="school1" labelPlacement="end">
          Bhartiya Vidya Mandir
        </IonRadio>
        <br />
        <IonRadio value="school2" labelPlacement="end">
          School2
        </IonRadio>
        <br />
      </IonRadioGroup>
    </div>
  );
};

export default SwitchSchool;
