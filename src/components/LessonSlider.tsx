import "./LessonSlider.css";
import "./LessonCard.css";
import LessonCard from "./LessonCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Lesson } from "../interface/curriculumInterfaces";
import { useEffect, useState } from "react";
import Arrow from "./arrow";
import { Chapter } from "../interface/curriculumInterfaces";

const LessonSlider: React.FC<{
  lessonData: Lesson[];
  chaptersData: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
  isHome: boolean;
  onSwiper: any;
  // onSlideChange: Function;
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
  // onSlideChange,
  lessonsScoreMap,
  startIndex,
  showSubjectName = false,
}) => {
  const [lessonSwiperRef, setLessonSwiperRef] = useState<any>();
  let width1: string;
  let height1: string;
  let playCard: boolean;
  let checkSecond: boolean;
  useEffect(() => {
    // console.log(
    //   "🚀 ~ file: LessonSlider.tsx:24 ~ useEffect ~ useEffect:startIndex",
    //   startIndex
    // );
    lessonSwiperRef?.go(0);
    setTimeout(() => {
      if (startIndex) lessonSwiperRef?.go(startIndex);
      console.log('timeout',lessonSwiperRef)
    }, 100); 
  });
  return(isHome?(
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
            width1="50vh"
            height1="40vh"
            playCard = false
          return (
            <SplideSlide className="slide" key={i}>
              <LessonCard
                width= {width1}
                height={height1}
                isPlayed={isPlayed}
                isUnlocked={true}
                lesson={m}
                showSubjectName={showSubjectName}
                showScoreCard={isPlayed}
                score={lessonsScoreMap[m.id]?.score}
                toBePlayed={playCard}              />
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
        {lessonData.map((m: Lesson, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;
          width1="50vh"
          height1="40vh"
          playCard = false
          if(i == startIndex){
            if(isPlayed){
              width1="50vh"
              height1="40vh"
              playCard = false
              checkSecond = true
            }
            else if(!isPlayed){
              width1 = "60vh"
              height1 = "50vh"
              playCard = true
              checkSecond = false
            }
          }
          if(i === (startIndex + 1) && checkSecond){  
            width1 = "60vh"
            height1 = "50vh"
            playCard = true
          } 
          else if(i === (startIndex + 1) && !checkSecond){
            width1="50vh"
            height1="40vh"
            playCard = false
          }
          else if(checkSecond) {
            width1="50vh"
            height1="40vh"
            playCard = false
          }
          if(i == lessonData.length-1 && !(currentChapter.id == chaptersData[chaptersData.length-1].id)){
            return(
              <><SplideSlide className="slide" key={i}>
                <LessonCard
                  width={width1}
                  height={height1}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score}
                  toBePlayed={playCard} />

              </SplideSlide><SplideSlide className="slide" key={i}>
                  <Arrow
                    width={width1}
                    height={height1}
                    toBePlayed={playCard}
                    isForward={true}
                    imgUrl="assets/icons/forward-arrow.png"
                    currentChapter={currentChapter!}
                    onChapterChange={onChapterChange}
                  ></Arrow>
                </SplideSlide></>
            )
          }
          else if(i == 0 && !(currentChapter.id == chaptersData[0].id)){
            return(
              <>
              <SplideSlide className="slide" key={i}>
              <Arrow
                    width={width1}
                    height={height1}
                    toBePlayed={playCard}
                    isForward={false}
                    imgUrl="assets/icons/previous.png"
                    currentChapter={currentChapter!}
                    onChapterChange={onChapterChange}
                  ></Arrow>
                </SplideSlide>
              <SplideSlide className="slide" key={i}>
                <LessonCard
                  width={width1}
                  height={height1}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score}
                  toBePlayed={playCard} />

              </SplideSlide>
              </>
            )
          }
          else{
            return (
              <SplideSlide className="slide" key={i}>
                <LessonCard
                  width= {width1}
                  height={height1}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score}
                  toBePlayed={playCard}
                />
              </SplideSlide>
            )
          }
        })}
      </Splide>
    </div>
  ));
};

export default LessonSlider;
