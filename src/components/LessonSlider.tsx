import "./LessonSlider.css";
import LessonCard from "./LessonCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Lesson } from "../interface/curriculumInterfaces";
import { useEffect, useState } from "react";

const LessonSlider: React.FC<{
  lessonData: Lesson[];
  onSwiper: any;
  // onSlideChange: Function;
  lessonsScoreMap: any;
  startIndex: number;
  showSubjectName: boolean;
}> = ({
  lessonData,
  onSwiper,
  // onSlideChange,
  lessonsScoreMap,
  startIndex,
  showSubjectName = false,
}) => {
  const [lessonSwiperRef, setLessonSwiperRef] = useState<any>();
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
  return (
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
          return (
            <SplideSlide className="slide" key={i}>
              <LessonCard
                width="40vh"
                height="45vh"
                isPlayed={isPlayed}
                isUnlocked={true}
                lesson={m}
                showSubjectName={showSubjectName}
                showScoreCard={isPlayed}
                score={lessonsScoreMap[m.id]?.score}
              />
            </SplideSlide>
          );
        })}
      </Splide>
    </div>
  );
};

export default LessonSlider;
