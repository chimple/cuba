import { IonInput, IonList } from "@ionic/react";
import { FC } from "react";
import "./AddSchool.css";
import CommonButton from "../common/CommonButton";

interface AddSchoolProps {
  schoolName: string;
  cityName: string;
  stateName: string;
  onCancel: React.MouseEventHandler<HTMLIonButtonElement>;
  onCreate: React.MouseEventHandler<HTMLIonButtonElement>;
}

const AddSchool: FC<AddSchoolProps> = ({
  schoolName,
  cityName,
  stateName,
  onCancel,
  onCreate,
}) => {
  return (
    <div className="alignItems">
      <IonInput
        label="School name"
        labelPlacement="floating"
        fill="outline"
        placeholder="Enter text"
        value={schoolName}
      ></IonInput>
      <br />
      <IonInput
        label="City"
        labelPlacement="floating"
        fill="outline"
        placeholder="Enter text"
        value={cityName}
      ></IonInput>
      <br />
      <IonInput
        label="State"
        labelPlacement="floating"
        fill="outline"
        placeholder="Enter text"
        value={stateName}
      ></IonInput>
      <div className="buttonRow">
        <CommonButton disabled={false} title="Cancel" onClicked={onCancel}  />
        <CommonButton disabled={false} title="Add" onClicked={onCreate}  />
      </div>
    </div>
  );
};

export default AddSchool;
