import "./LessonSlider.css";
import "./LessonCard.css";
import LessonCard from "./LessonCard";
import { Lesson } from "../interface/curriculumInterfaces";
import Arrow from "./arrow";
import { Chapter } from "../interface/curriculumInterfaces";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import { EffectCoverflow, Mousewheel, Pagination } from "swiper";

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
  
  let width: string;
  let height: string; 
  width="47.5vh"
  height="37vh"
  return(
    isHome?(
    <div className="content">
      <Swiper
        className="mySwiper"
      >
        {lessonData.map((m: Lesson, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;
            width="47.5vh"
            height="37vh"
          return (
            <SwiperSlide className="slide" key={i}>
              <LessonCard
                width= {width}
                height={height}
                isPlayed={isPlayed}
                isUnlocked={true}
                lesson={m}
                showSubjectName={showSubjectName}
                showScoreCard={isPlayed}
                score={lessonsScoreMap[m.id]?.score}             />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  ):(
    <div className="content">
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        initialSlide={startIndex}
        centeredSlides={false}
        slidesPerView={"auto"}
        mousewheel={true}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 300,
          modifier: 1,
          slideShadows: false
        }}
        modules={[Mousewheel, EffectCoverflow, Pagination]}
        className="mySwiper"
      >
      
        <SwiperSlide className="slide" >
        <Arrow
              width={width}
              height={height}
              isForward={false}
              currentChapter={currentChapter!}
              chaptersData = {chaptersData}
              onChapterChange={onChapterChange}
            ></Arrow>
          </SwiperSlide>
        {lessonData.map((m: Lesson, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;
            return (  
              <SwiperSlide className="slide" key={i}>
                <LessonCard
                  width= {width}
                  height={height}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score}
                />
              </SwiperSlide>
            )
          })}
          <SwiperSlide className="slide" >
      <Arrow
            width={width}
            height={height}
            isForward={true}
            currentChapter={currentChapter!}
            chaptersData = {chaptersData}
            onChapterChange={onChapterChange}
          ></Arrow>
        </SwiperSlide>
          </Swiper>
        </div>
      ));
    };
    export default LessonSlider;
          
        
