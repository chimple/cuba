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
  showSubjectName: boolean;
  showText?: boolean;
  showScoreCard?: boolean;
  score: any;
}> = ({
  width,
  height,
  lesson,
  isPlayed,
  isUnlocked,
  showSubjectName = false,
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

  return (
    <IonCard
      id="lesson-card"
      style={{
        width: width,
        height: "auto",
      }}
      onClick={() => {
        if (isUnlocked) {
          // if (
          //   lesson.chapter.course.isCourseMapped &&
          //   lesson.orig_course_id != undefined &&
          //   lesson.orig_chapter_id != undefined &&
          //   lesson.orig_lesson_id != undefined
          // ) {
          //   const parmas = `?courseid=${lesson.orig_course_id}&chapterid=${lesson.orig_chapter_id}&lessonid=${lesson.orig_lesson_id}`;
          //   console.log("parmas", parmas);
          //   history.push(PAGES.GAME + parmas, {
          //     url: "chimple-lib/index.html" + parmas,
          //     lessonId: lesson.orig_lesson_id,
          //     lesson: lesson,
          //     from: history.location.pathname,
          //   });
          // } else {
            const parmas = `?courseid=${subjectCode}&chapterid=${lesson.chapter.id}&lessonid=${lesson.id}`;
            history.push(PAGES.GAME + parmas, {
              url: "chimple-lib/index.html" + parmas,
              lessonId: lesson.id,
              lesson: lesson,
              from: history.location.pathname,
            });
          // }
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
            background: lessonCardColor,
            borderRadius: "25px",
            width: width,
            height: height,
            display: "grid",
            justifyContent: "center",
            alignItems: "center",
            gridArea: "1/1",
          }}
          color={lesson?.color}
        >
          {showSubjectName ? (
            <div id="lesson-card-subject-name">
              <p>{lesson?.chapter.course.name}</p>
            </div>
          ) : null}
          <div id="lesson-card-image">
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
          {showScoreCard ? (
            <div id="lesson-card-score">
              <ScoreCard score={score}></ScoreCard>
            </div>
          ) : (
            <></>
          )}
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
