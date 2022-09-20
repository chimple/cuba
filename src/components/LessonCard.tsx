import { IonCard, IonCardHeader, IonCardTitle } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { LESSON_CARD_COLORS } from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import "./LessonCard.css";

const LessonCard: React.FC<{
  lesson: Lesson;
  isUnlocked: boolean;
  subjectCode: string;
}> = ({ lesson, isUnlocked, subjectCode }) => {
  const history = useHistory();

  const lessonCardColor = lesson?.color
    ? lesson.color
    : LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)];
  return (
    <IonCard
      id="lesson-card"
      onClick={() => {
        const url = `chimple-lib/index.html?courseid=${subjectCode}&chapterid=${lesson.chapter.id}&lessonid=${lesson.id}`;
        history.push("/game", { url: url, lessonId: lesson.id });
      }}
      disabled={!isUnlocked}
    >
      <div
        style={{
          background: lessonCardColor,
          borderRadius: "25px",
          height: "200px",
          width: "200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        color={lesson?.color}
      >
        <img
          style={{ height: "124px", width: "124px" }}
          alt={"/courses/" + subjectCode + "/icons/" + lesson.image}
          src={"/courses/" + subjectCode + "/icons/" + lesson.image}
        />
      </div>

      <IonCardHeader id="lesson-header">
        {/* <IonCardSubtitle>Card Subtitle</IonCardSubtitle> */}
        {/* <IonCardTitle> {lesson?.name}</IonCardTitle> */}
        <p>{lesson?.name}</p>
      </IonCardHeader>
      {/* <IonCardContent> Keep close to Nature's heart... </IonCardContent> */}
    </IonCard>
  );
};

export default LessonCard;
