import ChapterDropDown from "./ChapterDropDown";
import "./ChapterBar.css";
import { Chapter } from "../interface/curriculumInterfaces";
import DropDown from "./DropDown";

const ChapterBar: React.FC<{
  chapters: Chapter[];
  currentChapter: Chapter;
  onChapterChange;
  onGradeChange;
  showGrade: boolean;
  grades: string[];
  currentGrade: string;
}> = ({
  chapters,
  currentChapter: currentChapter,
  onChapterChange,
  onGradeChange,
  showGrade,
  currentGrade,
  grades,
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
          <DropDown
            width="5vw"
            optionList={grades}
            currentValue={currentGrade}
            onValueChange={onGradeChange}
          />
        ) : null}
      </div>
    </div>
  );
};

export default ChapterBar;
