import { IonInput, IonList } from "@ionic/react";
import { FC } from "react";
import "./AddSchool.css";
import CommonButton from "../common/CommonButton";
import { t } from "i18next";

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
        label={t("School name")!}
        labelPlacement="floating"
        fill="outline"
        placeholder={t("Enter text")!}
        value={schoolName}
      ></IonInput>
      <br />
      <IonInput
        label={t("City")!}
        labelPlacement="floating"
        fill="outline"
        placeholder={t("Enter text")!}
        value={cityName}
      ></IonInput>
      <br />
      <IonInput
        label={t("State")!}
        labelPlacement="floating"
        fill="outline"
        placeholder={t("Enter text")!}
        value={stateName}
      ></IonInput>
      <div className="buttonRow">
        <CommonButton disabled={false} title="Cancel" onClicked={onCancel} />
        <CommonButton disabled={false} title="Add" onClicked={onCreate} />
      </div>
    </div>
  );
};

export default AddSchool;
