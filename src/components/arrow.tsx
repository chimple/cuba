import { IonCard } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./LessonCard.css";
import { Chapter } from "../interface/curriculumInterfaces";

const Arrow: React.FC<{
    width: string;
    height: string;
    toBePlayed: boolean;
    isForward: boolean;
    imgUrl: string;
    currentChapter: Chapter;
    onChapterChange;
}> = ({  
    width,
    height,
    toBePlayed,isForward,imgUrl, currentChapter,onChapterChange }) => {
    let x = toBePlayed? "lesson-card1":"lesson-card";
    console.log('IMPORT', currentChapter)
  return (
    <IonCard
      id={x}
      style={{
        width: width,
        height: "auto",
      }}
      onClick={() => {onChapterChange(currentChapter.id, isForward)}}>
        <div
        style={{
          background: "#CDE7EF",
          borderRadius: "30px",
          width: width,
          height: height,
          display: "grid",
          justifyContent: "center",
          alignItems: "center",
          gridArea: "1/1",
        }}>
        
        {<img
            id="lesson-card-image"
             loading="lazy"
             alt={imgUrl}
             src={imgUrl} />}
        
        </div>
    </IonCard>
  );
};
export default Arrow;