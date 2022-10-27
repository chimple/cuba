import { IonCard } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { LESSON_CARD_COLORS, PAGES } from "../common/constants";
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

  return (
    <IonCard
      id="lesson-card"
      style={{
        width: width,
        height: "auto",
      }}
      onClick={() => {
        if (isUnlocked) {
          const url = `chimple-lib/index.html?courseid=${subjectCode}&chapterid=${lesson.chapter.id}&lessonid=${lesson.id}`;
          history.push(PAGES.GAME, {
            url: url,
            lessonId: lesson.id,
            lesson: lesson,
            from: history.location.pathname,
          });
        } else {
          console.log(lesson?.name, "lesson is locked");
        }
      }}
      // disabled={!isUnlocked}
    >
      <div
        style={{
          display: "grid",
        }}
      >
        {!isUnlocked ? (
          <div
            style={{
              background: "#000000",
              borderRadius: "25px",
              width: width,
              height: height,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: "0.3",
              gridArea: "1/1",
            }}
          ></div>
        ) : (
          <div></div>
        )}
        <div
          style={{
            background: isUnlocked ? lessonCardColor : lessonCardColor,
            borderRadius: "25px",
            width: width,
            height: height,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gridArea: "1/1",
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
      </div>

      {/* <IonCardHeader id="lesson-header"> */}
      {/* <IonCardSubtitle>Card Subtitle</IonCardSubtitle> */}
      {/* <IonCardTitle> {lesson?.name}</IonCardTitle> */}
      {showText ? (
        <p
          id="lesson-card-name"
          style={{
            opacity: isUnlocked ? "1" : "0.5",
          }}
        >
          {lesson?.name}
        </p>
      ) : null}
      {/* </IonCardHeader> */}
      {/* <IonCardContent> Keep close to Nature's heart... </IonCardContent> */}
    </IonCard>
  );
};

export default LessonCard;
