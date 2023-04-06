import { IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";

const GradeDropDown: React.FC<{
  grades: string[];
  currentGrade: string;
  onGradeChange;
}> = ({
  grades: chapters,
  currentGrade: currentChapter,
  onGradeChange: onChapterChange,
}) => {
  return (
    <IonList>
      <IonItem lines="none" fill="outline" color={'none'}>
        <IonSelect
          onIonChange={onChapterChange}
          interface="popover"
          value={currentChapter}
        >
          {chapters.map((chapter) => (
            <IonSelectOption value={chapter}>{chapter}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default GradeDropDown;
