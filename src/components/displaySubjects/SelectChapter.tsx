import { FC, useEffect, useRef, useState } from "react";
import { Chapter } from "../../common/courseConstants";
import "./SelectChapter.css";
import Grade from "../../models/grade";
import DropDown from "../DropDown";
import Course from "../../models/course";
import SelectIconImage from "./SelectIconImage";

const SelectChapter: FC<{
  chapters: Chapter[];
  onChapterChange: (chapter: Chapter) => void;
  grades: Grade[];
  course: Course;
  currentGrade: Grade;
  onGradeChange: (grade: Grade) => void;
  currentChapterId : string | undefined;
}> = ({
  chapters,
  onChapterChange,
  grades,
  currentGrade,
  onGradeChange,
  course,
  currentChapterId,
}) => {
  let currentChapterRef = useRef<any>();

  useEffect(() => {
    currentChapterRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);
  return (
    <div>
      <div className="grade-container" />
      <div className="chapter-container">
        {chapters.map((chapter) => {
          return (
            <div
              ref = {currentChapterId === chapter.id ? currentChapterRef : undefined}
              onClick={() => {
                onChapterChange(chapter);
              }}
              className="chapter-button"
              key={chapter.id}
            >
              <div className="chapter-icon">
                <SelectIconImage
                  localSrc={`courses/${course.courseCode}/icons/${chapter.id}.webp`}
                  defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
                  webSrc={chapter.thumbnail}
                />
              </div>
              {chapter.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SelectChapter;
