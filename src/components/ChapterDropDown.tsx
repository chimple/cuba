import { IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import { Chapter } from "../interface/curriculumInterfaces";
import "./ChapterDropDown.css";

const ChapterDropDown: React.FC<{
  chapters: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
}> = ({ chapters, currentChapter: currentChapter, onChapterChange }) => {
  return (
    <IonList>
      <IonItem lines="none" className="chapter-dropdown-custom-outline">
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
