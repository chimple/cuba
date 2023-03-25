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
  toBePlayed: boolean;
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
  toBePlayed,
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
  let x = toBePlayed? "lesson-card1":"lesson-card";
  return (
    <IonCard
      id={toBePlayed? "lesson-card1":"lesson-card"}
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
        <div
        style={{
          background: lessonCardColor,
          borderRadius: "28px",
          width: width,
          height: height,
          display: "grid",
          justifyContent: "center",
          alignItems: "center",
          gridArea: "1/1",
        }}
        color={lesson?.color}>
          {showSubjectName ? (
            <div id="lesson-card-subject-name">
              <p>{lesson?.chapter.course.name}</p>
            </div>
          ) : null}
            <Container><StyledSVG color={lesson.color?lesson.color:lessonCardColor} width={width} height={height}>
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
    <svg id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 616.49 737.59">
<g id="Graphic_Elements">
<rect opacity="0" x="0" y="0" width="616.23" height="736.43"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="52.29 30.91 103.31 1.45 154.67 30.91 154.69 88.92 103.49 118.99 52.29 89.53 52.29 30.91"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="154.69 30.91 205.72 1.45 257.07 30.91 257.09 88.92 205.89 118.99 154.69 89.53 154.69 30.91"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="257.09 30.91 308.12 1.45 359.47 30.91 359.49 88.92 308.29 118.99 257.09 89.53 257.09 30.91"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="359.49 30.91 410.52 1.45 461.87 30.91 461.89 88.92 410.69 118.99 359.49 89.53 359.49 30.91"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="461.89 30.91 512.92 1.45 564.27 30.91 564.29 88.92 513.09 118.99 461.89 89.53 461.89 30.91"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="615.49 118.99 564.29 89.53 564.29 30.91 615.32 1.45"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 118.99 52.29 89.53 52.29 30.91 1.26 1.45"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 119.01 52.11 89.55 103.47 119.01 103.49 177.03 52.29 207.1 1.09 177.63 1.09 119.01"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="103.49 119.01 154.52 89.55 205.87 119.01 205.89 177.03 154.69 207.1 103.49 177.63 103.49 119.01"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="205.89 119.01 256.92 89.55 308.27 119.01 308.29 177.03 257.09 207.1 205.89 177.63 205.89 119.01"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="308.29 119.01 359.32 89.55 410.67 119.01 410.69 177.03 359.49 207.1 308.29 177.63 308.29 119.01"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="410.69 119.01 461.72 89.55 513.07 119.01 513.09 177.03 461.89 207.1 410.69 177.63 410.69 119.01"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="513.09 119.01 564.12 89.55 615.48 119.01 615.49 177.03 564.29 207.1 513.09 177.63 513.09 119.01"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="52.29 207.36 103.31 177.89 154.67 207.36 154.69 265.37 103.49 295.44 52.29 265.98 52.29 207.36"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="154.69 207.36 205.72 177.89 257.07 207.36 257.09 265.37 205.89 295.44 154.69 265.98 154.69 207.36"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="257.09 207.36 308.12 177.89 359.47 207.36 359.49 265.37 308.29 295.44 257.09 265.98 257.09 207.36"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="359.49 207.36 410.52 177.89 461.87 207.36 461.89 265.37 410.69 295.44 359.49 265.98 359.49 207.36"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="461.89 207.36 512.92 177.89 564.27 207.36 564.29 265.37 513.09 295.44 461.89 265.98 461.89 207.36"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="615.49 295.44 564.29 265.98 564.29 207.36 615.32 177.89"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 295.44 52.29 265.98 52.29 207.36 1.26 177.89"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 295.46 52.11 266 103.47 295.46 103.49 353.47 52.29 383.54 1.09 354.08 1.09 295.46"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="103.49 295.46 154.52 266 205.87 295.46 205.89 353.47 154.69 383.54 103.49 354.08 103.49 295.46"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="205.89 295.46 256.92 266 308.27 295.46 308.29 353.47 257.09 383.54 205.89 354.08 205.89 295.46"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="308.29 295.46 359.32 266 410.67 295.46 410.69 353.47 359.49 383.54 308.29 354.08 308.29 295.46"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="410.69 295.46 461.72 266 513.07 295.46 513.09 353.47 461.89 383.54 410.69 354.08 410.69 295.46"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="513.09 295.46 564.12 266 615.48 295.46 615.49 353.47 564.29 383.54 513.09 354.08 513.09 295.46"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="52.29 383.8 103.31 354.34 154.67 383.8 154.69 441.82 103.49 471.89 52.29 442.42 52.29 383.8"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="154.69 383.8 205.72 354.34 257.07 383.8 257.09 441.82 205.89 471.89 154.69 442.42 154.69 383.8"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="257.09 383.8 308.12 354.34 359.47 383.8 359.49 441.82 308.29 471.89 257.09 442.42 257.09 383.8"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="359.49 383.8 410.52 354.34 461.87 383.8 461.89 441.82 410.69 471.89 359.49 442.42 359.49 383.8"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="461.89 383.8 512.92 354.34 564.27 383.8 564.29 441.82 513.09 471.89 461.89 442.42 461.89 383.8"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="615.49 471.89 564.29 442.42 564.29 383.8 615.32 354.34"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 471.89 52.29 442.42 52.29 383.8 1.26 354.34"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 471.9 52.11 442.44 103.47 471.9 103.49 529.92 52.29 559.99 1.09 530.53 1.09 471.9"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="103.49 471.9 154.52 442.44 205.87 471.9 205.89 529.92 154.69 559.99 103.49 530.53 103.49 471.9"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="205.89 471.9 256.92 442.44 308.27 471.9 308.29 529.92 257.09 559.99 205.89 530.53 205.89 471.9"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="308.29 471.9 359.32 442.44 410.67 471.9 410.69 529.92 359.49 559.99 308.29 530.53 308.29 471.9"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="410.69 471.9 461.72 442.44 513.07 471.9 513.09 529.92 461.89 559.99 410.69 530.53 410.69 471.9"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="513.09 471.9 564.12 442.44 615.48 471.9 615.49 529.92 564.29 559.99 513.09 530.53 513.09 471.9"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="52.29 560.25 103.31 530.79 154.67 560.25 154.69 618.26 103.49 648.33 52.29 618.87 52.29 560.25"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="154.69 560.25 205.72 530.79 257.07 560.25 257.09 618.26 205.89 648.33 154.69 618.87 154.69 560.25"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="257.09 560.25 308.12 530.79 359.47 560.25 359.49 618.26 308.29 648.33 257.09 618.87 257.09 560.25"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="359.49 560.25 410.52 530.79 461.87 560.25 461.89 618.26 410.69 648.33 359.49 618.87 359.49 560.25"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="461.89 560.25 512.92 530.79 564.27 560.25 564.29 618.26 513.09 648.33 461.89 618.87 461.89 560.25"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="615.49 648.33 564.29 618.87 564.29 560.25 615.32 530.79"/>
<polyline fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 648.33 52.29 618.87 52.29 560.25 1.26 530.79"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="1.09 648.35 52.11 618.89 103.47 648.35 103.49 706.36 52.29 736.43 1.09 706.97 1.09 648.35"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="103.49 648.35 154.52 618.89 205.87 648.35 205.89 706.36 154.69 736.43 103.49 706.97 103.49 648.35"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="205.89 648.35 256.92 618.89 308.27 648.35 308.29 706.36 257.09 736.43 205.89 706.97 205.89 648.35"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="308.29 648.35 359.32 618.89 410.67 648.35 410.69 706.36 359.49 736.43 308.29 706.97 308.29 648.35"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="410.69 648.35 461.72 618.89 513.07 648.35 513.09 706.36 461.89 736.43 410.69 706.97 410.69 648.35"/>
<polygon fill="none" opacity=".2" stroke="#000" stroke-miterlimit="10" stroke-width="0.7px" points="513.09 648.35 564.12 618.89 615.48 648.35 615.49 706.36 564.29 736.43 513.09 706.97 513.09 648.35"/>
</g></svg>
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
`;