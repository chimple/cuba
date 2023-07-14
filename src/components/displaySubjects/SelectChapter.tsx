import { FC, useState } from "react";
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
}> = ({
  chapters,
  onChapterChange,
  grades,
  currentGrade,
  onGradeChange,
  course,
}) => {
  return (
    <div>
      <div className="grade-container">
        <DropDown
          currentValue={currentGrade.docId}
          optionList={grades.map((grade) => ({
            displayName: grade.title,
            id: grade.docId,
          }))}
          placeholder=""
          onValueChange={(evt) => {
            const tempGrade = grades.find(
              (grade) => grade.docId === evt.detail.value
            );
            onGradeChange(tempGrade ?? currentGrade);
          }}
          width="15vw"
        />
      </div>
      <div className="chapter-container">
        {chapters.map((chapter) => {
          return (
            <div
              onClick={() => {
                onChapterChange(chapter);
              }}
              className="chapter-button"
              key={chapter.id}
            >
              <div className="chapter-icon">
                <SelectIconImage
                  localSrc={`courses/${course.courseCode}/icons/${chapter.id}.png`}
                  defaultSrc={"courses/" + "en" + "/icons/" + "en33.png"}
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
