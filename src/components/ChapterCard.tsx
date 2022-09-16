import { IonButton } from "@ionic/react";
import { Chapter } from "../interface/curriculumInterfaces";

const ChapterCard: React.FC<{
  chapter: Chapter;
  isActive: boolean;
  onChapterClick: Function;
}> = ({ chapter, isActive, onChapterClick }) => {
  return (
    <IonButton
      fill="outline"
      shape="round"
      onClick={() => {
        onChapterClick(chapter);
      }}
      color={isActive ? "success" : "primary"}
    >
      <p>{chapter.name}</p>
    </IonButton>
  );
};

export default ChapterCard;
