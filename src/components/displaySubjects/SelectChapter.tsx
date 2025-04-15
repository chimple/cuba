import { FC, useEffect, useRef, useState } from "react";
import "./SelectChapter.css";
import SelectIconImage from "./SelectIconImage";
import DownloadLesson from "../DownloadChapterAndLesson";
import { t } from "i18next";
import { TableTypes } from "../../common/constants";

const SelectChapter: FC<{
  chapters: TableTypes<"chapter">[];
  onChapterChange: (chapter: TableTypes<"chapter">) => void;
  grades: TableTypes<"grade">[];
  course: TableTypes<"course">;
  currentGrade: TableTypes<"grade">;
  onGradeChange: (grade: TableTypes<"grade">) => void;
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
                    localSrc={`assets/courses/${course.code}/icons/${chapter.id}.png`}
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={chapter.image || "assets/icons/DefaultIcon.png"}
                    imageWidth={"100%"}
                    imageHeight={"auto"}
                  />
                </div>
                <div>{t(chapter.name ?? "")}</div>
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
