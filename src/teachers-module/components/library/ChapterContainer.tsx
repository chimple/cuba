import React, { useEffect, useState } from 'react';
import './ChapterContainer.css';
import LessonComponent from './LessonComponent';
import { COURSES, TableTypes } from '../../../common/constants';
import { t } from 'i18next';
interface ChapterContainerProps {
  chapter: TableTypes<'chapter'>;
  lessons: TableTypes<'lesson'>[];
  chapterSelectedLessons: Function;
  syncSelectedLessons: string[];
  isOpened: boolean;
  lessonClickCallBack: (lesson: TableTypes<'lesson'>) => void;
  courseCode?: string;
  showAssignedBadge?: boolean;
  assignedLessonIds?: Set<string>;
}
const ChapterContainer: React.FC<ChapterContainerProps> = ({
  chapter,
  lessons,
  chapterSelectedLessons,
  syncSelectedLessons,
  isOpened,
  lessonClickCallBack,
  courseCode,
  showAssignedBadge,
  assignedLessonIds,
}) => {
  const [selectedLessons, setSelectedLessons] =
    useState<string[]>(syncSelectedLessons);
  const [isExpanded, setIsExpanded] = useState<boolean>(isOpened);

  useEffect(() => {
    setIsExpanded(isOpened);
  }, [isOpened]);

  const chapterLessonIds = lessons
    .map((lesson) => lesson.id)
    .filter((lessonId): lessonId is string => Boolean(lessonId));
  const isAllSelected =
    chapterLessonIds.length > 0 &&
    chapterLessonIds.every((lessonId) => selectedLessons.includes(lessonId));

  const handleLessonToggle = (lesson: string) => {
    setSelectedLessons((prevSelectedLessons) => {
      if (prevSelectedLessons.includes(lesson)) {
        chapterSelectedLessons(chapter.id, lesson, false); //remove lesson
        return prevSelectedLessons.filter((item) => item !== lesson);
      } else {
        chapterSelectedLessons(chapter.id, lesson, true); //add lesson
        return [...prevSelectedLessons, lesson];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedLessons((prevSelectedLessons) => {
      const prevSet = new Set(prevSelectedLessons);
      const shouldSelectAll = chapterLessonIds.some(
        (lessonId) => !prevSet.has(lessonId),
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
        (lessonId) => !chapterLessonIds.includes(lessonId),
      );
    });
  };

  const toggleChapter = () => {
    setIsExpanded((prev) => !prev);
  };
  return (
    <div
      id="chaptercontainer-collapsable-container"
      className="chaptercontainer-collapsable-container"
    >
      <div
        id="chaptercontainer-chapter-header-row"
        className="chaptercontainer-chapter-header-row"
      >
        <div
          id="chaptercontainer-colladable-header"
          className="chaptercontainer-colladable-header"
          role="button"
          tabIndex={0}
          onClick={toggleChapter}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleChapter();
            }
          }}
        >
          <div
            id="chaptercontainer-chapter-details"
            className="chaptercontainer-chapter-details"
          >
            <div
              id="chaptercontainer-chapter-name"
              className="chaptercontainer-chapter-name"
            >
              {courseCode === COURSES.ENGLISH
                ? chapter.name
                : t(chapter.name ?? '')}
            </div>

            <div
              id="chaptercontainer-selected-count"
              className="chaptercontainer-selected-count"
            >
              {selectedLessons.length} / {lessons.length}
            </div>
          </div>
          <div
            id="chaptercontainer-chapter-header-actions"
            className="chaptercontainer-chapter-header-actions"
          >
            <div
              id="chaptercontainer-chapter-select-all"
              className={`chaptercontainer-chapter-select-all${
                isAllSelected ? ' is-selected' : ''
              }`}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                handleSelectAll();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSelectAll();
                }
              }}
            >
              <span
                id="chaptercontainer-chapter-select-all-text"
                className="chaptercontainer-chapter-select-all-text"
              >
                {t('Select All')}
              </span>
              <span
                id="chaptercontainer-chapter-select-all-icon"
                className="chaptercontainer-chapter-select-all-icon"
                aria-hidden="true"
              >
                {isAllSelected ? (
                  <img
                    src="/assets/icons/checkbox.png"
                    alt=""
                    id="chaptercontainer-chapter-select-all-icon-image"
                    className="chaptercontainer-chapter-select-all-icon-image"
                  />
                ) : null}
              </span>
            </div>
            <span
              id="chaptercontainer-expand-arrow"
              className={`chaptercontainer-expand-arrow${
                isExpanded ? ' is-open' : ''
              }`}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      {isExpanded ? (
        <div
          id="chaptercontainer-grid-container"
          className="chaptercontainer-grid-container"
        >
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              id="chaptercontainer-grid-item"
              className="chaptercontainer-grid-item"
            >
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
          ))}
        </div>
      ) : null}
    </div>
  );
};
export default ChapterContainer;
