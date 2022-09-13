import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
} from "@ionic/react";
import { useHistory } from "react-router-dom";

const SlideCard: React.FC<any> = ({ lesson }) => {
  const history = useHistory();

  return (
    <IonCard
      onClick={() => {
        const url = `chimple-lib/index.html?courseid=${lesson.courseid}&chapterid=${lesson.chapterid}&lessonid=${lesson.lessonid}`;
        history.push("/game", { url: url, lessonId: lesson.lessonid });
      }}
    >
      <img src="https://via.placeholder.com/200x150" />
      <IonCardHeader>
        <IonCardSubtitle>Card Subtitle</IonCardSubtitle>
        <IonCardTitle> {lesson?.name}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent> Keep close to Nature's heart... </IonCardContent>
    </IonCard>
  );
};

export default SlideCard;
