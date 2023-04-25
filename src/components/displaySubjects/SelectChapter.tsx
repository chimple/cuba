import { FC } from "react";
import { Chapter } from "../../common/courseConstants";
import "./SelectChapter.css";
import GradeDropDown from "../GradeDropDown";
import Grade from "../../models/grade";

const SelectChapter: FC<{
  chapters: Chapter[];
  onChapterChange: (course: Chapter) => void;
  grades: Grade[];
  currentGrade: Grade;
  onGradeChange: (grade: Grade) => void;
}> = ({ chapters, onChapterChange, grades, currentGrade, onGradeChange }) => {
  return (
    <div>
      <div className="grade-container">
        <GradeDropDown
          currentGrade={currentGrade.title}
          grades={grades.map((grade) => grade.title)}
          onGradeChange={(evt) => {
            const tempGrade = grades.find(
              (grade) => grade.title === evt.detail.value
            );
            onGradeChange(tempGrade ?? currentGrade);
          }}
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
                <img
                  className="chapter-img"
                  src={chapter.thumbnail ?? "assets/icons/EnglishIcon.svg"}
                  alt={chapter.thumbnail ?? "assets/icons/EnglishIcon.svg"}
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
