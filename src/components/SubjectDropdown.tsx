import { IonItem, IonList, IonSelect, IonSelectOption } from "@ionic/react";
import { ALL_COURSES } from "../common/constants";
const SubjectDropdown: React.FC<{ onChange: Function; value: string }> = ({
  onChange,
  value,
}) => {
  return (
    <IonList className="item">
      <IonItem>
        <IonSelect
          onIonChange={(e) => {
            console.log(`ionChange fired with value: ${e.detail.value}`, e);
            onChange(e.detail.value);
          }}
          interface="popover"
          value={value}
          placeholder="Select fruit"
        >
          {ALL_COURSES.map((m: any, i: number) => (
            <IonSelectOption key={i} value={m}>
              {m}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default SubjectDropdown;
