import { IonButton, IonRow } from "@ionic/react";
import { Chapter } from "../interface/curriculumInterfaces";
import "./ChapterCard.css";

const ChapterCard: React.FC<{
  chapter: Chapter;
  isActive: boolean;
  onChapterClick: Function;
  isLastChapter: boolean;
}> = ({ chapter, isActive, onChapterClick, isLastChapter }) => {
  return (
    <div>
      <IonRow>
        <IonButton
          className={"chapter-button " + (isActive ? "active-button" : "")}
          fill="outline"
          shape="round"
          onClick={() => {
            onChapterClick(chapter);
          }}
          color={isActive ? "success" : "success"}
        >
          <IonRow>
            <p className="chapter-name">{chapter.name}</p>
            {isActive ? (
              <img className="star" src="assets/icon/star.svg" />
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
