import { IonItem, IonList, IonSelect, IonSelectOption } from "@ionic/react";
import { ALL_COURSES } from "../common/constants";
const SubjectDropdown: React.FC<{ onChange: Function; value: string }> = ({
  onChange,
  value,
}) => {
  return (
    <IonList className="item" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
      <IonItem placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonSelect
          onIonChange={(e) => {
            onChange(e.detail.value);
          } }
          interface="popover"
          value={value}
          placeholder="Select fruit" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}        >
          {ALL_COURSES.map((m: any, i: number) => (
            <IonSelectOption key={i} value={m} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
              {m}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default SubjectDropdown;
