import { IonInput } from "@ionic/react";
import { FC } from "react";
import "./EditSchool.css";
import CommonButton from "../common/CommonButton";

interface EditSchoolProps {
  schoolName: string;
  cityName: string;
  stateName: string;
  onCancel: React.MouseEventHandler<HTMLIonButtonElement>;
  onSave: React.MouseEventHandler<HTMLIonButtonElement>;
}

const EditSchool: FC<EditSchoolProps> = ({
  schoolName,
  cityName,
  stateName,
  onCancel,
  onSave,
}) => {
  return (
    <div className="alignItems">
      <IonInput
        value={schoolName}
      ></IonInput>
      <br />
      <IonInput
        value={cityName}
      ></IonInput>
      <br />
      <IonInput
        value={stateName}
      ></IonInput>
      <div className="buttonRow">
        <CommonButton disabled={false} title="Cancel" onClicked={onCancel} />
        <CommonButton disabled={false} title="Save" onClicked={onSave} />
      </div>
    </div>
  );
};

export default EditSchool;
