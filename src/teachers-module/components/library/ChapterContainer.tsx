import React, { useEffect, useState } from "react";
import "./ChapterContainer.css";
import LessonComponent from "./LessonComponent";
import KeyboardArrowDownTwoToneIcon from "@mui/icons-material/KeyboardArrowDownTwoTone";
import KeyboardArrowUpTwoToneIcon from "@mui/icons-material/KeyboardArrowUpTwoTone";
import { PAGES, TableTypes } from "../../../common/constants";
import { string } from "prop-types";
import { useHistory } from "react-router";
interface ChapterContainerProps {
  chapter: TableTypes<"chapter">;
  lessons: TableTypes<"lesson">[];
  chapterSelectedLessons: Function;
  syncSelectedLessons: string[];
  isOpened:boolean
  lessonClickCallBack;
}
const ChapterContainer: React.FC<ChapterContainerProps> = ({
  chapter,
  lessons,
  chapterSelectedLessons,
  syncSelectedLessons,
  lessonClickCallBack,
  isOpened
}) => {
  const [isOpen, setIsOpen] = useState(isOpened);
  const [selectedLessons, setSelectedLessons] = useState<string[]>(
    syncSelectedLessons
  );
  const history = useHistory();
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  console.log()
  useEffect(() => {
    chapterSelectedLessons(chapter.id, selectedLessons);
  }, [selectedLessons]);
  const handleLessonToggle = (lesson) => {
    setSelectedLessons((prevSelectedLessons) => {
      if (prevSelectedLessons.includes(lesson)) {
        return prevSelectedLessons.filter((item) => item !== lesson);
      } else {
        return [...prevSelectedLessons, lesson];
      }
    });
  };
  return (
    <div className="collapsable-container">
      <button onClick={toggleDropdown} className="toggle-button">
        <div className="colladable-header">
          <div className="chapter-details">
            <div className="chapter-name">{chapter.name}</div>
            <div className="selected-count">{selectedLessons.length}</div>
          </div>
          <div>
            {isOpen ? (
              <KeyboardArrowUpTwoToneIcon className="icon-style" />
            ) : (
              <KeyboardArrowDownTwoToneIcon className="icon-style" />
            )}
          </div>
        </div>
      </button>
      {isOpen && (
        <div className="grid-container">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="grid-item">
              <div className="bottom-border">
                <LessonComponent
                  lesson={lesson}
                  isSelButton={true}
                  handleLessonCLick={() => {
                    lessonClickCallBack(lesson);
                  }}
                  handleSelect={() => {
                    handleLessonToggle(lesson.id);
                  }}
                  isSelcted={selectedLessons.includes(lesson.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ChapterContainer;