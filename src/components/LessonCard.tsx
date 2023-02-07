import { IonCard } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { LESSON_CARD_COLORS, PAGES } from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import "./LessonCard.css";
import ScoreCard from "./ScoreCard";
import styled from 'styled-components';

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
        style={{
          background: lessonCardColor,
          borderRadius: "30px",
          width: width,
          height: height,
          display: "grid",
          justifyContent: "center",
          alignItems: "center",
          gridArea: "1/1",
          filter: isUnlocked ? 'none' :'grayscale(90%)',
        }}
        color={lesson?.color}>
          {showSubjectName ? (
            <div id="lesson-card-subject-name">
              <p>{lesson?.chapter.course.name}</p>
            </div>
          ) : null}
            <Container><StyledSVG color={lessonCardColor} width={width} height={height}>
              <PatternSVGImg></PatternSVGImg>
              </StyledSVG></Container>
              
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
              <div id = "lesson-card-status-icon">
              <img
              id="lesson-card-status-icon1"
                loading="lazy"
                src="assets/icons/Lock_icon.svg"
                alt="assets/icons/Lock_icon.svg"
              /></div>
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
const PatternSVGImg =() => {
  return(
    <svg id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 508.9 566.7">
        <g id="Graphic_Elements">
          <rect  width="508.9" height="566.7" rx="64.84" ry="64.84"/>
          <g opacity ='.15'>
            <path d="m444.93,0H64.08C28.69,0,0,28.69,0,64.08v21.89c38.27,2.99,66-9.52,96.92-39.45,50.95-49.33,90.18-10.19,163.44,51.97,77.45,65.72,192.68-64.96,248.54-34.51h0C508.9,28.64,480.26,0,444.93,0Z"/>
            <circle  cx="217.38" cy="26.62" r="13.87"/>
            <circle  cx="325.28" cy="37.47" r="10.85"/>
            <circle  cx="268.1" cy="83.88" r="7.19"/>
            <circle  cx="396.6" cy="71.8" r="7.19"/>
            <circle  cx="485.31" cy="44.93" r="4.25"/>
            <circle  cx="13.36" cy="71.8" r="4.25"/>
            <circle  cx="66.55" cy="57.81" r="3"/>
            <circle  cx="42.64" cy="17.44" r="3"/>
            <circle  cx="92.83" cy="14.43" r="3"/>
            <circle  cx="429.95" cy="15.78" r="4.25"/></g></g></svg>
  );
};
const Container = styled.div`
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 30px;
  display: grid;
  justify-content: center;
  align-items: center;
  grid-area: 1/1;
  opacity: "0.3",
`;


const StyledSVG = styled.svg`
& rect {
  fill: ${props => props.color};
}
& circle {
  fill: ${props => props.color};
}
`;


