import { FC, useEffect, useRef, useState } from "react";
import { Chapter } from "../../common/courseConstants";
import "./SelectChapter.css";
import Grade from "../../models/grade";
import DropDown from "../DropDown";
import Course from "../../models/course";
import SelectIconImage from "./SelectIconImage";
import DownloadLesson from "../DownloadChapterAndLesson";
import { t } from "i18next";

const SelectChapter: FC<{
  chapters: Chapter[];
  onChapterChange: (chapter: Chapter) => void;
  grades: Grade[];
  course: Course;
  currentGrade: Grade;
  onGradeChange: (grade: Grade) => void;
  currentChapterId: string | undefined;
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
    currentChapterRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <div>
      <div className="grade-container" />
      <div className="chapter-container">
        {chapters.map((chapter) => {
          return (
            <div
              ref={
                currentChapterId === chapter.id ? currentChapterRef : undefined
              }
              onClick={() => {
                onChapterChange(chapter);
              }}
              className="chapter-button"
              key={chapter.id}
            >
              <div className="chapter-icon-and-chapter-download-container">
                <div className="chapter-icon">
                  <SelectIconImage
                    localSrc={`courses/${course.courseCode}/icons/${chapter.id}.webp`}
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={chapter.thumbnail || "assets/icons/DefaultIcon.png"}
                    imageWidth={"100%"}
                    imageHeight={"80%"}
                  />
                </div>
                <div>{t(chapter.title)}</div>
                <div className="chapter-download">
                  <DownloadLesson chapter={chapter} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SelectChapter;
