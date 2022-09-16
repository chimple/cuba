import "./CustomSlider.css";
import SlideCard from "./SlideCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Lesson } from "../interface/curriculumInterfaces";

const CustomSlider: React.FC<{
  lessonData: Lesson[];
  onSwiper: any;
  onSlideChange: Function;
  isPreQuizPlayed: boolean;
  subjectCode: string;
}> = ({
  lessonData,
  onSwiper,
  onSlideChange,
  isPreQuizPlayed,
  subjectCode,
}) => {
  return (
    <div className="content">
      <Splide
        ref={onSwiper}
        key="slpider1"
        hasTrack={true}
        options={{
          arrows: false,
          wheel: true,
          direction: "ltr",
          pagination: false,
        }}
        onMove={(slider: any) => {
          onSlideChange(slider.index);
        }}
      >
        {lessonData.map((m: any, i: number) => {
          const isUnlocked = !isPreQuizPlayed ? i === 0 : true;
          return (
            <SplideSlide className="slide" key={i}>
              <SlideCard
                subjectCode={subjectCode}
                isUnlocked={isUnlocked}
                lesson={m}
              />
            </SplideSlide>
          );
        })}
      </Splide>
    </div>
  );
};

export default CustomSlider;
