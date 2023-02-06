import { IonCard } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { LESSON_CARD_COLORS, PAGES } from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import "./LessonCard.css";
import ScoreCard from "./ScoreCard";

const LessonCard: React.FC<{
  width: string;
  height: string;
  lesson: Lesson;
  isPlayed: boolean;
  isUnlocked: boolean;
  showText?: boolean;
  showScoreCard?: boolean;
  score: any;
}> = ({
  width,
  height,
  lesson,
  isPlayed,
  isUnlocked,
  showText = true,
  showScoreCard = true,
  score,
}) => {
  const history = useHistory();
  const [showImage, setShowImage] = useState(true);

  const hideImg = (event: any) => {
    setShowImage(false);
  };
  const subjectCode = lesson.chapter.course.id;
  const lessonCardColor = lesson?.color
    ? lesson.color
    : LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)];

  const lessonCard = LESSON_CARD_IMAGES[Math.floor(Math.random() * LESSON_CARD_IMAGES.length)];

  return (
    <IonCard
      id="lesson-card"
      style={{
        width: width,
        height: "auto",
      }}
      onClick={() => {
        if (isUnlocked) {
          if (
            lesson.chapter.course.isCourseMapped &&
            lesson.orig_course_id != undefined &&
            lesson.orig_chapter_id != undefined &&
            lesson.orig_lesson_id != undefined
          ) {
            const parmas = `?courseid=${lesson.orig_course_id}&chapterid=${lesson.orig_chapter_id}&lessonid=${lesson.orig_lesson_id}`;
            console.log("parmas", parmas);
            history.push(PAGES.GAME + parmas, {
              url: "chimple-lib/index.html" + parmas,
              lessonId: lesson.orig_lesson_id,
              lesson: lesson,
              from: history.location.pathname,
            });
          } else {
            const parmas = `?courseid=${subjectCode}&chapterid=${lesson.chapter.id}&lessonid=${lesson.id}`;
            history.push(PAGES.GAME + parmas, {
              url: "chimple-lib/index.html" + parmas,
              lessonId: lesson.id,
              lesson: lesson,
              from: history.location.pathname,
            });
          }
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
        
          
        
        <div
        >
          <div >
            {showImage ? (
              <img
                loading="lazy"
                alt={"assets/icons/Card_A.svg"}
                src={lessonCard}
                onError={hideImg}
              />
            ) : (
              <div /> // we can show Default LessonCard text or image
            )}
            {!isUnlocked ? (
              <div id = "lesson-card-status-icon">
              <img
                id="lesson-card-status-icon1"
                loading="lazy"
                src="assets/icons/LockIcon.svg"
                alt="LockIcon"
              />
               </div>
              
            ) : isPlayed ? (
              showScoreCard ? (
                <div id="lesson-card-score">
                  <ScoreCard score={score}></ScoreCard> 
                </div>
              ) : (
                <></>
              )
            ) : (
              <div />
            )}
          </div>
          
        </div>
      </div>
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
    </IonCard>
  );
};

export default LessonCard;

const LESSON_CARD_IMAGES = [
  "assets/icons/Card_A_1.png",
  "assets/icons/Card_B_1.png",
  "assets/icons/Card_C_1.png"
]
//.svg
//_1.png