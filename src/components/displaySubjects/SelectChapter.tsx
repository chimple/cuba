import { FC, useState } from "react";
import { Chapter } from "../../common/courseConstants";
import "./SelectChapter.css";
import Grade from "../../models/grade";
import DropDown from "../DropDown";
import Course from "../../models/course";
import ChapterImage from "./ChapterImage";

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
        {chapters.map((Chapter) => {
          return (
            <div
              onClick={() => {
                onChapterChange(Chapter);
              }}
              className="chapter-button"
              key={Chapter.id}
            >
              <div className="chapter-icon">
                <ChapterImage course={course} chapter={Chapter} />
              </div>
              {Chapter.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SelectChapter;
