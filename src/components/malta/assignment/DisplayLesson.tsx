import { FC, useEffect, useRef, useState } from "react";
import "./DisplayLesson.css";
import SelectIconImage from "../../displaySubjects/SelectIconImage";
import { t } from "i18next";
import Lesson from "../../../models/lesson";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { BsFillCheckCircleFill } from "react-icons/bs";

const DisplayLesson: FC<{
  lessons: Lesson[];
  onLessonSelect;
  currentChapterId: string | undefined;
}> = ({ lessons, onLessonSelect, currentChapterId }) => {
  let currentChapterRef = useRef<any>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lesson, setLesson] = useState<Lesson[]>();
  const api = ServiceConfig.getI().apiHandler;
  const [allLessons, setAllLessons] = useState([
    ...lessons.map((lesson) => {
      return { lesson, selected: false };
    }),
  ]);

  useEffect(() => {
    init();
    currentChapterRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  const init = async () => {
    // getLessonsForChapter(chapter);
  };

  return (
    <div>
      <div className="lesson-container">
        {allLessons.map((lesson) => {
          return (
            <div
              ref={
                currentChapterId === lesson.lesson.id
                  ? currentChapterRef
                  : undefined
              }
              onClick={() => {
                const newLessons = allLessons.map((l, i) => {
                  if (l.lesson.docId === lesson.lesson.docId)
                    l.selected = !l.selected;
                  return l;
                });

                setAllLessons(newLessons);
                onLessonSelect(lesson);
              }}
              className="lesson-button"
              key={lesson.lesson.id}
            >
              <div className="lesson-icon-container">
                <div className="lesson-icon">
                  {lesson.selected ? (
                    <div className="lesson-select-icon">
                      <BsFillCheckCircleFill color={"grey"} size="2vh" />
                    </div>
                  ) : null}
                  <SelectIconImage
                    localSrc={
                      "courses/" +
                      lesson.lesson.cocosSubjectCode +
                      "/icons/" +
                      lesson.lesson.id +
                      ".webp"
                    }
                    defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
                    webSrc={lesson.lesson.thumbnail}
                  />
                </div>

                <div className="lesson-title">{t(lesson.lesson.title)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DisplayLesson;
