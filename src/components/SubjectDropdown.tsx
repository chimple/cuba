import { IonItem, IonList, IonSelect, IonSelectOption } from "@ionic/react";
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
          <IonSelectOption value="en">English</IonSelectOption>
          <IonSelectOption value="hi">Hindi</IonSelectOption>
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default SubjectDropdown;
