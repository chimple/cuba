import { IonCard, IonCardHeader, IonCardTitle } from "@ionic/react";
import { useState } from "react";
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
  const [showImage, setShowImage] = useState(true);

  const hideImg = (event: any) => {
    setShowImage(false);
  };

  const lessonCardColor = lesson?.color
    ? lesson.color
    : LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)];

  // console.log("isUnlocked ", !isUnlocked);

  const iconMargin = !isUnlocked ? "0px 0px 0px 40px" : "0px 0px 0px 0px";
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
        {showImage ? (
          <img
            loading="lazy"
            style={{
              height: "124px",
              width: "124px",
              margin: iconMargin,
            }}
            alt={"/courses/" + subjectCode + "/icons/" + lesson.image}
            src={"/courses/" + subjectCode + "/icons/" + lesson.image}
            onError={hideImg}
          />
        ) : (
          <div style={{ margin: "0px 0px 150px 165px" }} /> // we can show Default LessonCard text or image
        )}
        {!isUnlocked ? (
          <img
            loading="lazy"
            style={{ margin: "0px 0px 150px -5px" }}
            src="assets/icons/Lockicon.svg"
            alt=""
          />
        ) : (
          <div />
        )}
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
