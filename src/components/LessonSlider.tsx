import "./LessonSlider.css";
import "./LessonCard.css";
import LessonCard from "./LessonCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Lesson } from "../interface/curriculumInterfaces";
import { useEffect, useState } from "react";
import Arrow from "./arrow";
import { Chapter } from "../interface/curriculumInterfaces";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

// import required modules
import { EffectCoverflow, Mousewheel, Pagination } from "swiper";

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
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const updateIndex = (swiperInstance: SwiperType) => {
    if (swiperInstance === null) return;
    const currentSlide = swiperInstance?.activeIndex;
    setCurrentIndex(currentSlide)
  }
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
  console.log("REF",startIndex)
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
            width1="47.5vh"
            height1="37vh"
          return (
            <SwiperSlide className="slide" key={i}>
              <LessonCard
                width= {width1}
                height={height1}
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
        // initialSlide={currentIndex}
        // onActiveIndexChange={updateIndex}
        centeredSlides={true}
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
        {lessonData.map((m: Lesson, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;

          width1="47.5vh"
          height1="37vh"

          if(i === lessonData.length-1 && !(currentChapter.id === chaptersData[chaptersData.length-1].id) &&
          !(currentChapter.name === 'Quiz')){
            return(
              <><SwiperSlide className="slide" key={i}>
                <LessonCard
                  width={width1}
                  height={height1}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score} />

              </SwiperSlide>
              <SwiperSlide className="slide" key={i+0.5}>
                  <Arrow
                    width={width1}
                    height={height1}
                    isForward={true}
                    imgUrl="assets/icons/forward-arrow.png"
                    currentChapter={currentChapter!}
                    onChapterChange={onChapterChange}
                  ></Arrow>
                </SwiperSlide>
                </>
            )
          }
          else if(i === 0 && !(currentChapter.id === chaptersData[0].id)){
            return(
              <>
              <SwiperSlide className="slide" key={i}>
              <Arrow
                    width={width1}
                    height={height1}
                    isForward={false}
                    imgUrl="assets/icons/previous.png"
                    currentChapter={currentChapter!}
                    onChapterChange={onChapterChange}
                  ></Arrow>
                </SwiperSlide>
              <SwiperSlide className="slide" key={i+0.5}>
                <LessonCard
                  width={width1}
                  height={height1}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score} />

              </SwiperSlide>
              </>
            )
          }
          else{
            return (
              <SwiperSlide className="slide" key={i}>
                <LessonCard
                  width= {width1}
                  height={height1}
                  isPlayed={isPlayed}
                  isUnlocked={true}
                  lesson={m}
                  showSubjectName={showSubjectName}
                  showScoreCard={isPlayed}
                  score={lessonsScoreMap[m.id]?.score}
                />
              </SwiperSlide>
            )
          }
          })}
          
          </Swiper>
        </div>
      ));
    };
    
    export default LessonSlider;

          
        
