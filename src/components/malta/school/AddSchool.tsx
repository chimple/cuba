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
        placeholder={t("Enter text")!}
        value={schoolName} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}      ></IonInput>
      <br />
      <IonInput
        placeholder={t("Enter text")!}
        value={cityName} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}      ></IonInput>
      <br />
      <IonInput
        placeholder={t("Enter text")!}
        value={stateName} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}      ></IonInput>
      <div className="buttonRow">
        <CommonButton disabled={false} title="Cancel" onClicked={onCancel} />
        <CommonButton disabled={false} title="Add" onClicked={onCreate} />
      </div>
    </div>
  );
};

export default AddSchool;
