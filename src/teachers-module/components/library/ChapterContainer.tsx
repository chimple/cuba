import React, { useState } from "react";
import "./ChapterContainer.css";
import LessonComponent from "./LessonComponent";
import { COURSES, TableTypes } from "../../../common/constants";
import { t } from "i18next";
interface ChapterContainerProps {
  chapter: TableTypes<"chapter">;
  lessons: TableTypes<"lesson">[];
  chapterSelectedLessons: Function;
  syncSelectedLessons: string[];
  isOpened: boolean;
  lessonClickCallBack;
  courseCode?: string;
  showAssignedBadge?: boolean;
  assignedLessonIds?: Set<string>;
}
const ChapterContainer: React.FC<ChapterContainerProps> = ({
  chapter,
  lessons,
  chapterSelectedLessons,
  syncSelectedLessons,
  lessonClickCallBack,
  courseCode,
  showAssignedBadge,
  assignedLessonIds,
}) => {
  const [selectedLessons, setSelectedLessons] =
    useState<string[]>(syncSelectedLessons);
  const chapterLessonIds = lessons
    .map((lesson) => lesson.id)
    .filter((lessonId): lessonId is string => Boolean(lessonId));
  const isAllSelected =
    chapterLessonIds.length > 0 &&
    chapterLessonIds.every((lessonId) => selectedLessons.includes(lessonId));

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

  const handleSelectAll = () => {
    setSelectedLessons((prevSelectedLessons) => {
      const prevSet = new Set(prevSelectedLessons);
      const shouldSelectAll = chapterLessonIds.some(
        (lessonId) => !prevSet.has(lessonId)
      );

      if (shouldSelectAll) {
        chapterLessonIds.forEach((lessonId) => {
          if (!prevSet.has(lessonId)) {
            chapterSelectedLessons(chapter.id, lessonId, true);
          }
        });
        return chapterLessonIds;
      }

      chapterLessonIds.forEach((lessonId) => {
        if (prevSet.has(lessonId)) {
          chapterSelectedLessons(chapter.id, lessonId, false);
        }
      });
      return prevSelectedLessons.filter(
        (lessonId) => !chapterLessonIds.includes(lessonId)
      );
    });
  };
  return (
    <div className="collapsable-container">
      <div className="chapter-header-row">
        <div className="colladable-header">
          <div className="chapter-details">
            <div className="chapter-name">
              {courseCode ===COURSES.ENGLISH ? chapter.name : t(chapter.name ?? "")}
            </div>

            <div className="selected-count">
              {selectedLessons.length} / {lessons.length}
            </div>
          </div>
          <div
            className={`chapter-select-all${isAllSelected ? " is-selected" : ""}`}
            role="button"
            tabIndex={0}
            onClick={handleSelectAll}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSelectAll();
              }
            }}
          />
        </div>
      </div>
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
                isAssigned={
                  !!showAssignedBadge &&
                  !!lesson.id &&
                  !!assignedLessonIds?.has(lesson.id)
                }
                showAssignedBadge={!!showAssignedBadge}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ChapterContainer;
