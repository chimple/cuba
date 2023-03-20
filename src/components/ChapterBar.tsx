import ChapterDropDown from "./ChapterDropDown";
import "./ChapterBar.css";
import { Chapter } from "../interface/curriculumInterfaces";
import GradeDropDown from "./GradeDropDown";

const ChapterBar: React.FC<{
  chapters: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
  onGradeChange;
  showGrade: boolean;
  grades:string[];
  currentGrade:string
}> = ({
  chapters,
  currentChapter: currentChapter,
  onChapterChange,
  onGradeChange,
  showGrade,
  currentGrade,
  grades
}) => {
  return (
    <div className="bar-header">
      <ChapterDropDown
        onChapterChange={onChapterChange}
        currentChapter={currentChapter}
        chapters={chapters}
      />
      <div className="right">
        {showGrade ? (
          <GradeDropDown
            grades={grades}
            currentGrade={currentGrade}
            onGradeChange={onGradeChange}
          />
        ) : null}
      </div>
    </div>
  );
};

export default ChapterBar;
