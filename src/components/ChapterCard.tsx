import { IonButton, IonRow } from "@ionic/react";
import { Chapter } from "../interface/curriculumInterfaces";
import "./ChapterCard.css";

const ChapterCard: React.FC<{
  chapter: Chapter;
  isActive: boolean;
  onChapterClick: Function;
  isLastChapter: boolean;
  levelChapter: Chapter | undefined;
}> = ({ chapter, isActive, onChapterClick, isLastChapter, levelChapter }) => {
  const isLevelChapter = chapter.id === levelChapter?.id;
  if (chapter.id === levelChapter?.id)
    console.log("levelChapter", levelChapter?.id, levelChapter);
  return (
    <div>
      <IonRow>
        <IonButton
          className={"chapter-button " + (isLevelChapter ? "star-button " : "")}
          fill={isActive ? "solid" : "outline"}
          shape="round"
          onClick={() => {
            onChapterClick(chapter);
          }}
          color="success"
        >
          <IonRow>
            <p
              className={
                "chapter-name " + (isActive ? "active-chapter-name " : "")
              }
            >
              {chapter.name}
            </p>
            {isLevelChapter ? (
              <img className="star" src="assets/icons/star.svg" />
            ) : (
              <div className="stat" />
            )}
          </IonRow>
        </IonButton>
        {!isLastChapter ? (
          <div className={"hr " + (isActive ? "active-line" : "")} />
        ) : null}
      </IonRow>
    </div>
  );
};

export default ChapterCard;
