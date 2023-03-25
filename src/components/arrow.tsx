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
          borderRadius: "28px",
          width: width,
          display: "grid",
          justifyContent: "center",
          alignItems: "center",
          marginTop: '20%',
          marginBottom: '20%'
        }}>
        
        {isForward?<FaChevronCircleRight
        style={{ 
          fill: 'white',
          width: '100%',
          height: '100%',
         
        }}/>:<FaChevronCircleLeft
        style={{
          color:"white",
          width: '100%',
          height: '100%'
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