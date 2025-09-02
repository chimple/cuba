import { IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import { Chapter } from "../interface/curriculumInterfaces";

const ChapterDropDown: React.FC<{
  chapters: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
}> = ({ chapters, currentChapter: currentChapter, onChapterChange }) => {
  return (
    <IonList placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
      <IonItem lines="none" fill="outline" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonSelect
          onIonChange={onChapterChange}
          interface="popover"
          value={currentChapter.id} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}        >
          {chapters.map((chapter) => (
            <IonSelectOption value={chapter.id} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{chapter.name}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default ChapterDropDown;
