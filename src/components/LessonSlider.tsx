import "./LessonSlider.css";
import "./LessonCard.css";
import LessonCard from "./LessonCard";
import { Lesson } from "../interface/curriculumInterfaces";
import Arrow from "./arrow";
import { Chapter } from "../interface/curriculumInterfaces";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { useEffect, useState } from "react";

const LessonSlider: React.FC<{
  lessonData: Lesson[];
  chaptersData: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
  isHome: boolean;
  onSwiper: any;
  lessonsScoreMap: any;
  startIndex: number;
  showSubjectName: boolean;
}> = ({
  lessonData,
  chaptersData,
  currentChapter,
  isHome,
  onSwiper,
  onChapterChange,
  lessonsScoreMap,
  startIndex,
  showSubjectName = false,
}) => {
  const [lessonSwiperRef, setLessonSwiperRef] = useState<any>();
  let width: string;
  let height: string; 
  width="45.5vh"
  height="35vh"
  useEffect(() => {
    // console.log(
    //   "🚀 ~ file: LessonSlider.tsx:24 ~ useEffect ~ useEffect:startIndex",
    //   startIndex
    // );
    lessonSwiperRef?.go(0);
    setTimeout(() => {
      if (startIndex) lessonSwiperRef?.go(startIndex);
    }, 100); 
  });
  console.log("REFERENCE", startIndex)
  return(
    isHome?(
    <div className="content">
      <Splide
        ref={setLessonSwiperRef}
        hasTrack={true}
        options={{
          arrows: false,
          wheel: true,
          lazyLoad: true,
          direction: "ltr",
          pagination: false,
        }}
      >
        {lessonData.map((m: Lesson, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;
            width="47.5vh"
            height="37vh"
          return (
            <SplideSlide  className="slide" key={i}>
              <LessonCard
                width= {width}
                height={height}
                isPlayed={isPlayed}
                isUnlocked={true}
                isHome={isHome}
                lesson={m}
                showSubjectName={showSubjectName}
                showScoreCard={isPlayed}
                score={lessonsScoreMap[m.id]?.score}
                lessonData={lessonData}
                startIndex={startIndex === -1 ?startIndex+1 : startIndex}             />
            </SplideSlide>
          );
        })}
      </Splide>
    </div>
  ):(
    <div className="content">
      <Splide
        ref={setLessonSwiperRef}
        hasTrack={true}
        options={{
          arrows: false,
          wheel: true,
          lazyLoad: true,
          direction: "ltr",
          pagination: false,
        }}
      >
      
      {
      (currentChapter.id === chaptersData[0].id)?<></>:<SplideSlide className="slide" >
        <Arrow
              width={width}
              height={height}
              isForward={false}
              currentChapter={currentChapter!}
              onChapterChange={onChapterChange}
            ></Arrow>
          </SplideSlide>
          }
        {lessonData.map((m: Lesson, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;
            return (  
              <SplideSlide className="slide" key={i}>
                <LessonCard
                  width= {width}
                  height={height}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  isHome={isHome}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score}
                  lessonData={lessonData}
                  startIndex={startIndex === -1 ?startIndex+1 : startIndex}  
                />
              </SplideSlide>
            )
          })}
          {((currentChapter.id === chaptersData[0].id && currentChapter.name === 'Quiz') || 
      currentChapter.id === chaptersData[chaptersData.length-1].id)?<></>:<SplideSlide className="slide" >
      <Arrow
            width={width}
            height={height}
            isForward={true}
            currentChapter={currentChapter!}
            onChapterChange={onChapterChange}
          ></Arrow>
        </SplideSlide>}
          </Splide>
        </div>
      ));
    };
    export default LessonSlider;
          
        
