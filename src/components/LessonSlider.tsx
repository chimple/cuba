import "./LessonSlider.css";
import "./LessonCard.css";
import LessonCard from "./LessonCard";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { useEffect, useState, useRef } from "react";
import { TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "../utility/util";

const LessonSlider: React.FC<{
  lessonData: TableTypes<"lesson">[];
  course: TableTypes<"course"> | undefined;
  isHome: boolean;
  lessonsScoreMap: { [lessonDocId: string]: TableTypes<"result"> };
  startIndex: number;
  showSubjectName: boolean;
  showChapterName: boolean;
  onEndReached?: () => void;
  onMoved?: (splide: any) => any;
  downloadButtonLoading?: boolean;
  showDate?: boolean;
  onDownloadOrDelete?: () => void;
  assignments?: TableTypes<"assignment">[];
  chapter?: TableTypes<"chapter">;
  lessonChapterMap?: { [lessonId: string]: TableTypes<"chapter"> };
}> = ({
  lessonData,
  course,
  isHome,
  lessonsScoreMap,
  startIndex,
  showSubjectName = false,
  showChapterName = false,
  onEndReached,
  onMoved,
  downloadButtonLoading,
  showDate,
  onDownloadOrDelete,
  assignments,
  lessonChapterMap,
  chapter,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loadedLessons, setLoadedLessons] = useState<TableTypes<"lesson">[]>(
    []
  );
  const [favLessonMap, setFavLessonMap] = useState<{
    [lessonId: string]: boolean;
  }>({});
  let width: string;
  let height: string;
  width = "45.5vh";
  height = "35vh";
  const lessonSwiperRef = useRef<any>(null);
  const checkSplideInstance = () => {
    console.log("startIndex value in lessonSlider", startIndex);
    if (startIndex) lessonSwiperRef?.current.go(startIndex);
  };

  const handleMoved = (splide) => {
    const newIndex = splide.index;
    setCurrentSlideIndex(newIndex);

    if (newIndex >= lessonData.length - 1) {
      const nextIndex = loadedLessons.length;
      const nextTenLessons = lessonData.slice(nextIndex, nextIndex + 10);
      setLoadedLessons(nextTenLessons);

      if (onEndReached) {
        onEndReached();
      }
    }
  };

  useEffect(() => {
    init();
  }, [lessonData]);

  const init = async () => {
    const api = ServiceConfig.getI().apiHandler;
    const student = Util.getCurrentStudent();
    if (!student || !student.id) return;
    api.getFavouriteLessons(student.id).then((val) => {
      const data = {};
      val.forEach((lesson) => {
        data[lesson.id] = true;
      });
      setFavLessonMap(data);
    });
  };

  const assignmentMap = {};
  return isHome ? (
    <div className="Lesson-slider-content">
      <Splide
        ref={lessonSwiperRef}
        hasTrack={true}
        onMoved={handleMoved}
        options={{
          arrows: false,
          wheel: true,
          lazyLoad: true,
          direction: "ltr",
          pagination: false,
        }}
      >
        {lessonData.map((m: TableTypes<"lesson">, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score! > 0;
          const assignmentFound = assignments?.find(
            (val) => val.lesson_id === m.id && assignmentMap[val.id] == null
          );
          if (assignmentFound) {
            assignmentMap[assignmentFound.id] = m.id;
          }
          width = "66.66vh";
          height = "50vh";
          return (
            <SplideSlide onLoad={checkSplideInstance} className="slide" key={i}>
              <LessonCard
                width={width}
                height={height}
                isPlayed={isPlayed}
                isUnlocked={true}
                // isLoved={lessonsScoreMap[m.id]?.isLoved ?? false}
                isLoved={favLessonMap[m.id] ?? false}
                lesson={m}
                course={course}
                showSubjectName={showSubjectName}
                showScoreCard={isPlayed}
                score={lessonsScoreMap[m.id]?.score}
                showChapterName={showChapterName}
                downloadButtonLoading={downloadButtonLoading}
                assignment={assignmentFound}
                showDate={showDate}
                onDownloadOrDelete={onDownloadOrDelete}
                chapter={lessonChapterMap?.[m.id] ?? chapter}
              />
            </SplideSlide>
          );
        })}
      </Splide>
    </div>
  ) : (
    <div className="Lesson-slider-content">
      <Splide
        ref={lessonSwiperRef}
        hasTrack={true}
        onMoved={handleMoved}
        options={{
          arrows: false,
          wheel: true,
          lazyLoad: true,
          direction: "ltr",
          pagination: false,
        }}
      >
        {lessonData.map((m: TableTypes<"lesson">, i: number) => {
          if (!m) return;
          const isPlayed =
            !!lessonsScoreMap[m.id] && lessonsScoreMap[m.id]?.score! > 0;
          return (
            <SplideSlide onLoad={checkSplideInstance} className="slide" key={i}>
              <LessonCard
                width={width}
                height={height}
                isPlayed={isPlayed}
                isUnlocked={true}
                isLoved={favLessonMap[m.id] ?? false}
                lesson={m}
                course={course}
                showSubjectName={showSubjectName}
                showScoreCard={isPlayed}
                score={lessonsScoreMap[m.id]?.score}
                showChapterName={showChapterName}
                assignment={assignments?.[m.id]}
                downloadButtonLoading={downloadButtonLoading}
                showDate={showDate}
                onDownloadOrDelete={onDownloadOrDelete}
                chapter={lessonChapterMap?.[m.id]}
              />
            </SplideSlide>
          );
        })}
      </Splide>
    </div>
  );
};
export default LessonSlider;
