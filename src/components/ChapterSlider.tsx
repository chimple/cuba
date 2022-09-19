import { Splide, SplideSlide } from "@splidejs/react-splide";
import { useEffect, useState } from "react";
import { Chapter } from "../interface/curriculumInterfaces";
import ChapterCard from "./ChapterCard";
import "./ChapterSlider.css";

const ChapterSlider: React.FC<{
  chapterData: Chapter[];
  onChapterClick: Function;
  currentChapterId: string;
  chaptersIndex: number;
}> = ({ chapterData, onChapterClick, currentChapterId, chaptersIndex }) => {
  const [chapterSwiperRef, setChaptertSwiperRef] = useState<any>();
  useEffect(() => {
    if (chaptersIndex) chapterSwiperRef?.go(chaptersIndex);
  });
  return (
    <div className="chapter-splide ">
      <Splide
        ref={setChaptertSwiperRef}
        onActive={(splider) => {
          setChaptertSwiperRef(splider);
        }}
        hasTrack={true}
        options={{
          arrows: false,
          gap: "0em",
          wheel: true,
          direction: "ltr",
          pagination: false,
        }}
      >
        {chapterData.map((chap: any, i: number) => (
          <SplideSlide className="slide" key={i}>
            <ChapterCard
              chapter={chap}
              isActive={chap.id === currentChapterId}
              onChapterClick={onChapterClick}
              isLastChapter={chapterData.length - 1 === i}
            />
          </SplideSlide>
        ))}
      </Splide>
    </div>
  );
};

export default ChapterSlider;
