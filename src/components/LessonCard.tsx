import { IonCard, IonCardHeader, IonCardTitle } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { LESSON_CARD_COLORS } from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import "./LessonCard.css";

const LessonCard: React.FC<{
  width: string;
  height: string;
  lesson: Lesson;
  isPlayed: boolean;
  isUnlocked: boolean;
  subjectCode: string;
  showText?: boolean;
}> = ({
  width,
  height,
  lesson,
  isPlayed,
  isUnlocked,
  subjectCode,
  showText = true,
}) => {
  const history = useHistory();
  const [showImage, setShowImage] = useState(true);

  const hideImg = (event: any) => {
    setShowImage(false);
  };

  const lessonCardColor = lesson?.color
    ? lesson.color
    : LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)];

  // console.log("isUnlocked ", !isUnlocked, "isPlayed ", isPlayed);
  return (
    <IonCard
      id="lesson-card"
      style={{
        width: width,
        height: "auto",
      }}
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
          width: width,
          height: height,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        color={lesson?.color}
      >
        {showImage ? (
          <img
            id="lesson-card-image"
            loading="lazy"
            alt={"courses/" + subjectCode + "/icons/" + lesson.image}
            src={"courses/" + subjectCode + "/icons/" + lesson.image}
            onError={hideImg}
          />
        ) : (
          <div /> // we can show Default LessonCard text or image
        )}
        {!isUnlocked ? (
          <img
            id="lesson-card-status-icon"
            loading="lazy"
            src="assets/icons/LockIcon.svg"
            alt="LockIcon"
          />
        ) : isPlayed ? (
          <img
            id="lesson-card-status-icon"
            loading="lazy"
            src="assets/icons/DoneIcon.svg"
            alt="DoneIcon"
          />
        ) : (
          <div />
        )}
      </div>

      {/* <IonCardHeader id="lesson-header"> */}
      {/* <IonCardSubtitle>Card Subtitle</IonCardSubtitle> */}
      {/* <IonCardTitle> {lesson?.name}</IonCardTitle> */}
      {showText ? <p id="lesson-card-name">{lesson?.name}</p> : null}
      {/* </IonCardHeader> */}
      {/* <IonCardContent> Keep close to Nature's heart... </IonCardContent> */}
    </IonCard>
  );
};

export default LessonCard;
