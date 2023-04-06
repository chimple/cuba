import { IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import { Chapter } from "../interface/curriculumInterfaces";

const ChapterDropDown: React.FC<{
  chapters: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
}> = ({ chapters, currentChapter: currentChapter, onChapterChange }) => {
  return (
    <IonList>
      <IonItem lines="none" fill="outline" color={'none'}>
        <IonSelect
          onIonChange={onChapterChange}
          interface="popover"
          value={currentChapter.id}
        >
          {chapters.map((chapter) => (
            <IonSelectOption value={chapter.id}>{chapter.name}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </IonList>
  );
};
export default ChapterDropDown;
