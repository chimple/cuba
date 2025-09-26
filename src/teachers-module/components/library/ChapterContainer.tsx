import React, { useEffect, useState } from "react";
import "./ChapterContainer.css";
import LessonComponent from "./LessonComponent";
import KeyboardArrowDownTwoToneIcon from "@mui/icons-material/KeyboardArrowDownTwoTone";
import KeyboardArrowUpTwoToneIcon from "@mui/icons-material/KeyboardArrowUpTwoTone";
import { COURSES, PAGES, TableTypes } from "../../../common/constants";
import { string } from "prop-types";
import { useHistory } from "react-router";
import { t } from "i18next";
interface ChapterContainerProps {
  chapter: TableTypes<"chapter">;
  lessons: TableTypes<"lesson">[];
  chapterSelectedLessons: Function;
  syncSelectedLessons: string[];
  isOpened: boolean;
  lessonClickCallBack;
  courseCode?: string;
}
const ChapterContainer: React.FC<ChapterContainerProps> = ({
  chapter,
  lessons,
  chapterSelectedLessons,
  syncSelectedLessons,
  lessonClickCallBack,
  isOpened,
  courseCode,
}) => {
  const [isOpen, setIsOpen] = useState(isOpened);
  const [selectedLessons, setSelectedLessons] =
    useState<string[]>(syncSelectedLessons);
  const history = useHistory();
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  // useEffect(() => {
  //   chapterSelectedLessons(chapter.id, selectedLessons);
  // }, [selectedLessons]);
  const handleLessonToggle = (lesson) => {
    setSelectedLessons((prevSelectedLessons) => {
      if (prevSelectedLessons.includes(lesson)) {
        chapterSelectedLessons(chapter.id, lesson, false);   //remove lesson
        return prevSelectedLessons.filter((item) => item !== lesson);
      } else {
        chapterSelectedLessons(chapter.id, lesson, true);   //add lesson
        return [...prevSelectedLessons, lesson];
      }
    });
  };
  return (
    <div className="collapsable-container">
      <button onClick={toggleDropdown} className="toggle-button">
        <div className="colladable-header">
          <div className="chapter-details">
            <div className="chapter-name">
              {courseCode ===COURSES.ENGLISH ? chapter.name : t(chapter.name ?? "")}
            </div>

            <div className="selected-count">{selectedLessons.length}</div>
          </div>
          <div>
            {isOpen ? (
              <img
                src="assets/icons/iconUp.png"
                alt="drop_down"
                className="icon-style"
              />
            ) : (
              <img
                src="assets/icons/iconDown.png"
                alt="drop_down"
                className="icon-style"
              />
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
                  courseCode={courseCode}
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