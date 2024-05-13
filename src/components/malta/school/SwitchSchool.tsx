import { IonItem, IonList, IonRadio, IonRadioGroup } from "@ionic/react";
import { FC } from "react";
import "./SwitchSchool.css";
interface SwitchSchoolProps {
  schools: string[];
}

const SwitchSchool: FC<SwitchSchoolProps> = ({ schools }) => {
  return (
    <div className="alignContent">
      <IonRadioGroup value={schools[0]}>
        {schools.map((school) => (
          <>
            <IonRadio value={school} labelPlacement="end">
              {school}
            </IonRadio>
            <br />
          </>
        ))}
      </IonRadioGroup>
    </div>
  );
};

export default SwitchSchool;
