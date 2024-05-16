import { FC, useEffect, useRef, useState } from "react";
import "./DisplayLesson.css";
import SelectIconImage from "../../displaySubjects/SelectIconImage";
import { t } from "i18next";
import Lesson from "../../../models/lesson";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { BsFillCheckCircleFill } from "react-icons/bs";
import LessonIcon from "./LessonIcon";
import { TableTypes } from "../../../common/constants";

const DisplayLesson: FC<{
  lessons: TableTypes<"lesson">[];
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
                  if (l.lesson.id === lesson.lesson.id)
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
                <LessonIcon
                  id={lesson.lesson.id!}
                  cocosSubjectCode={lesson.lesson.cocos_subject_code!}
                  thumbnail={lesson.lesson.image!}
                  selected={lesson.selected}
                  title={lesson.lesson.name ?? ""}
                ></LessonIcon>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DisplayLesson;
