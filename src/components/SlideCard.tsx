import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Lesson } from "../interface/curriculumInterfaces";

const SlideCard: React.FC<{
  lesson: Lesson;
  isUnlocked: boolean;
  subjectCode: string;
}> = ({ lesson, isUnlocked, subjectCode }) => {
  const history = useHistory();

  return (
    <IonCard
      onClick={() => {
        const url = `chimple-lib/index.html?courseid=${subjectCode}&chapterid=${lesson.chapter.id}&lessonid=${lesson.id}`;
        history.push("/game", { url: url, lessonId: lesson.id });
      }}
      style={{ cursor: "pointer" }}
      disabled={!isUnlocked}
    >
      <div
        style={{
          background: "#73AD21",
          width: "200px",
          height: "150px",
        }}
      />
      <IonCardHeader>
        {/* <IonCardSubtitle>Card Subtitle</IonCardSubtitle> */}
        <IonCardTitle> {lesson?.name}</IonCardTitle>
      </IonCardHeader>
      {/* <IonCardContent> Keep close to Nature's heart... </IonCardContent> */}
    </IonCard>
  );
};

export default SlideCard;
