import { IonCard } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./LessonCard.css";
import { Chapter } from "../interface/curriculumInterfaces";
import { FaChevronCircleRight } from "react-icons/fa";
import { FaChevronCircleLeft } from "react-icons/fa";

const Arrow: React.FC<{
    width: string;
    height: string;
    isForward: boolean;
    imgUrl: string;
    currentChapter: Chapter;
    onChapterChange;
}> = ({  
    width,
    height,isForward,imgUrl, currentChapter,onChapterChange }) => {
  return (
    <IonCard
      id="lesson-card"
      style={{
        width:"47.5vh",
        height: "auto",
      }}
      onClick={() => {onChapterChange(currentChapter.id, isForward)}}>
        <div
        style={{
          borderRadius: "28px",
          width: "47.5vh",
          display: "grid",
          justifyContent: "center",
          alignItems: "center",
          marginTop: '20%',
          marginBottom: '20%'
        }}>
        
        {isForward?<FaChevronCircleRight
        style={{ 
          fill: 'var(--ion-color-medium-tint)',
          width: '70%',
          height: '70%',
         
        }}/>:<FaChevronCircleLeft
        style={{
          fill: 'var(--ion-color-medium-tint)',
          width: '60%',
          height: '60%'
        }}/>}
        {isForward?(<p
          id="lesson-card-name"
        >
          Next Chapter
        </p>):(<p
          id="lesson-card-name"
        >
          Previous Chapter
        </p>)}
        
        </div>
    </IonCard>
  );
};
export default Arrow;