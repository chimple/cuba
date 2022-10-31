import "./CustomSlider.css";
import LessonCard from "./LessonCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Lesson } from "../interface/curriculumInterfaces";

const CustomSlider: React.FC<{
  lessonData: Lesson[];
  onSwiper: any;
  onSlideChange: Function;
  isPreQuizPlayed: boolean;
  subjectCode: string;
  lessonsScoreMap: any;
  startIndex: number;
}> = ({
  lessonData,
  onSwiper,
  onSlideChange,
  isPreQuizPlayed,
  subjectCode,
  lessonsScoreMap,
  startIndex,
}) => {
  return (
    <div className="content">
      <Splide
        ref={onSwiper}
        key="slpider1"
        hasTrack={true}
        onReady={(slider: any) => {
          setTimeout(() => {
            slider.go(startIndex);
          }, 100);
        }}
        options={{
          arrows: false,
          wheel: true,
          lazyLoad: true,
          direction: "ltr",
          pagination: false,
        }}
        onMove={(slider: any) => {
          onSlideChange(slider.index);
        }}
      >
        {lessonData.map((m: Lesson, i: number) => {
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score > 0;
          return (
            <SplideSlide className="slide" key={i}>
              <LessonCard
                width="40vh"
                height="45vh"
                subjectCode={subjectCode}
                isPlayed={isPlayed}
                isUnlocked={m.isUnlock}
                lesson={m}
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

export default CustomSlider;
