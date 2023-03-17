import "./LessonSlider.css";
import LessonCard from "./LessonCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Lesson } from "../interface/curriculumInterfaces";

const LessonSlider: React.FC<{
  lessonData: Lesson[];
  onSwiper: any;
  onSlideChange: Function;
  lessonsScoreMap: any;
  startIndex: number;
  showSubjectName: boolean;
}> = ({
  lessonData,
  onSwiper,
  onSlideChange,
  lessonsScoreMap,
  startIndex,
  showSubjectName = false,
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
