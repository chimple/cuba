import React from 'react';
import { TableTypes } from '../../common/constants';
import { useHistory } from 'react-router';
import { PAGES } from '../../common/constants';
import { t } from 'i18next';
import SelectIconImage from '../../components/displaySubjects/SelectIconImage';
import SelectIcon from './SelectIcon';
import './ChapterWiseLessons.css';

type ChapterGroup = {
  chapterId: string;
  chapterName: string;
  lessons: TableTypes<'lesson'>[];
};

type CourseGroup = {
  courseId: string;
  courseName: string;
  gradeName: string;
  courseTitle: string;
  course?: TableTypes<'course'>;
  chapters: ChapterGroup[];
};

interface Props {
  courseGroups: CourseGroup[];
  isLessonSelected: (chapterId: string, lessonId: string) => boolean;
  toggleLessonSelection: (chapterId: string, lessonId: string) => void;
  selectedLesson: Map<string, string>;
  showAssignedBadge?: boolean;
  assignedLessonIds?: Set<string>;
  isChapterFullySelected: (
    chapterId: string,
    lessons: TableTypes<'lesson'>[],
  ) => boolean;
  toggleChapterSelection: (
    chapterId: string,
    lessons: TableTypes<'lesson'>[],
  ) => void;
}

const ChapterWiseLessons: React.FC<Props> = ({
  courseGroups,
  isLessonSelected,
  toggleLessonSelection,
  selectedLesson,
  showAssignedBadge = false,
  assignedLessonIds,
  isChapterFullySelected,
  toggleChapterSelection,
}) => {
  const history = useHistory();
  const isAssignedLesson = (lessonId?: string) =>
    !!showAssignedBadge && !!lessonId && !!assignedLessonIds?.has(lessonId);
  const openLessonDetails = (
    lesson: TableTypes<'lesson'>,
    chapterId: string,
    chapterName: string,
    gradeName: string,
    course?: TableTypes<'course'>,
  ) => {
    history.replace(PAGES.LESSON_DETAILS, {
      course: course ?? null,
      lesson,
      chapterId,
      chapterName,
      gradeName,
      subjectName:
        course?.code?.toUpperCase() ||
        course?.name ||
        lesson.cocos_subject_code ||
        '',
      from: PAGES.SEARCH_LESSON,
      selectedLesson,
    });
  };

  return (
    <>
      {courseGroups.map((courseGroup) => (
        <div
          id="chapter-wise-group"
          key={courseGroup.courseId}
          className="chapter-wise-group"
        >
          <div id="chapter-wise-title" className="chapter-wise-title">
            {courseGroup.courseTitle}
          </div>

          {courseGroup.chapters.map((chapterGroup) => (
            <div
              id="chapter-wise-chapter"
              key={chapterGroup.chapterId}
              className="chapter-wise-chapter"
            >
              <div id="chapter-wise-row" className="chapter-wise-row">
                <div
                  id="chapter-wise-chapter-title"
                  className="chapter-wise-chapter-title"
                >
                  {chapterGroup.chapterName}
                </div>

                <div id="chapter-wise-select" className="chapter-wise-select">
                  <label className="chapter-wise-select-label">
                    <span className="chapter-wise-select-text">
                      {t('Select All')}
                    </span>

                    <input
                      type="checkbox"
                      className="chapter-wise-checkbox"
                      checked={isChapterFullySelected(
                        chapterGroup.chapterId,
                        chapterGroup.lessons,
                      )}
                      onChange={() =>
                        toggleChapterSelection(
                          chapterGroup.chapterId,
                          chapterGroup.lessons,
                        )
                      }
                    />

                    {isChapterFullySelected(
                      chapterGroup.chapterId,
                      chapterGroup.lessons,
                    ) ? (
                      <img
                        src="/assets/icons/checkbox.png"
                        alt="checked"
                        className="chapter-wise-checkbox-img"
                      />
                    ) : (
                      <div className="chapter-wise-checkbox-empty" />
                    )}
                  </label>
                </div>
              </div>

              <div id="chapter-wise-grid" className="chapter-wise-grid">
                {chapterGroup.lessons.map((lesson) => (
                  <div
                    id="chapter-wise-card"
                    key={lesson.id}
                    className="chapter-wise-card"
                    onClick={() => {
                      openLessonDetails(
                        lesson,
                        chapterGroup.chapterId,
                        chapterGroup.chapterName,
                        courseGroup.gradeName,
                        courseGroup.course,
                      );
                    }}
                  >
                    <div id="chapter-wise-img" className="chapter-wise-img">
                      <div
                        id="chapter-wise-media-frame"
                        className="chapter-wise-media-frame"
                      >
                        <SelectIconImage
                          localSrc=""
                          defaultSrc="assets/icons/DefaultIcon.png"
                          webSrc={lesson.image ?? ''}
                          imageHeight="100%"
                          webImageHeight="0px"
                        />
                      </div>
                      {isAssignedLesson(lesson.id) ? (
                        <span
                          id="chapter-wise-assigned-badge"
                          className="chapter-wise-assigned-badge"
                        >
                          <img
                            src="assets/hideassigned.png"
                            alt=""
                            onError={(event) => {
                              if (!event.currentTarget.dataset.retryAbsolute) {
                                event.currentTarget.dataset.retryAbsolute = '1';
                                event.currentTarget.src =
                                  '/assets/hideassigned.png';
                                return;
                              }
                              event.currentTarget.src =
                                'assets/icons/assignmentSelect.svg';
                            }}
                          />
                        </span>
                      ) : null}
                    </div>

                    <div id="chapter-wise-name" className="chapter-wise-name">
                      {lesson.name}
                    </div>

                    <div
                      className="chapter-wise-btn"
                      id="chapter-wise-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <SelectIcon
                        isSelected={isLessonSelected(
                          chapterGroup.chapterId,
                          lesson.id,
                        )}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.stopPropagation();
                          toggleLessonSelection(
                            chapterGroup.chapterId,
                            lesson.id,
                          );
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default ChapterWiseLessons;
