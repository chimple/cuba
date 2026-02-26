import React from "react";
import { TableTypes } from "../../common/constants";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import { t } from "i18next";
import SelectIconImage from "../../components/displaySubjects/SelectIconImage";
import "./ChapterWiseLessons.css";

type ChapterGroup = {
  chapterId: string;
  chapterName: string;
  lessons: TableTypes<"lesson">[];
};

type CourseGroup = {
  courseId: string;
  courseName: string;
  gradeName: string;
  courseTitle: string;
  course?: TableTypes<"course">;
  chapters: ChapterGroup[];
};

interface Props {
  courseGroups: CourseGroup[];
  otherLessons: TableTypes<"lesson">[];
  isLessonSelected: (chapterId: string, lessonId: string) => boolean;
  toggleLessonSelection: (chapterId: string, lessonId: string) => void;
  selectedLesson: Map<string, string>;
  showAssignedBadge?: boolean;
  assignedLessonIds?: Set<string>;
  isChapterFullySelected: (
    chapterId: string,
    lessons: TableTypes<"lesson">[],
  ) => boolean;
  toggleChapterSelection: (
    chapterId: string,
    lessons: TableTypes<"lesson">[],
  ) => void;
}

const OTHER_KEY = "other";

const ChapterWiseLessons: React.FC<Props> = ({
  courseGroups,
  otherLessons,
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
                      {t("Select All")}
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
                      history.replace(PAGES.LESSON_DETAILS, {
                        course: courseGroup.course ?? null,
                        lesson,
                        chapterId: chapterGroup.chapterId,
                        chapterName: chapterGroup.chapterName,
                        gradeName: courseGroup.gradeName,
                        subjectName:
                          courseGroup.course?.code?.toUpperCase() ||
                          courseGroup.course?.name ||
                          lesson.cocos_subject_code ||
                          "",
                        from: PAGES.SEARCH_LESSON,
                        selectedLesson,
                      });
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
                          webSrc={lesson.image ?? ""}
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
                                event.currentTarget.dataset.retryAbsolute = "1";
                                event.currentTarget.src =
                                  "/assets/hideassigned.png";
                                return;
                              }
                              event.currentTarget.src =
                                "assets/icons/assignmentSelect.svg";
                            }}
                          />
                        </span>
                      ) : null}
                    </div>

                    <div id="chapter-wise-name" className="chapter-wise-name">
                      {lesson.name}
                    </div>

                    <button
                      type="button"
                      className={`chapter-wise-btn ${
                        isLessonSelected(chapterGroup.chapterId, lesson.id)
                          ? "remove"
                          : "add"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLessonSelection(
                          chapterGroup.chapterId,
                          lesson.id,
                        );
                      }}
                    >
                      <img
                        src={
                          isLessonSelected(chapterGroup.chapterId, lesson.id)
                            ? "/assets/icons/assignmentSelectGreen.svg"
                            : "/assets/icons/assignmentSelect.svg"
                        }
                        alt="icon"
                        className="chapter-wise-btn-icon"
                      />

                      <span className="chapter-wise-btn-text">
                        {isLessonSelected(chapterGroup.chapterId, lesson.id)
                          ? t("Remove")
                          : t("Add")}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {otherLessons.length > 0 && (
        <div id="chapter-wise-other" className="chapter-wise-group">
          <div id="chapter-wise-other-title" className="chapter-wise-title">
            {t("Other Lessons")}
          </div>

          <div id="chapter-wise-other-grid" className="chapter-wise-grid">
            {otherLessons.map((lesson) => (
              <div
                id="chapter-wise-other-card"
                key={lesson.id}
                className="chapter-wise-card"
              >
                <div id="chapter-wise-other-img" className="chapter-wise-img">
                  <div
                    id="chapter-wise-media-frame"
                    className="chapter-wise-media-frame"
                  >
                    <SelectIconImage
                      localSrc=""
                      defaultSrc="assets/icons/DefaultIcon.png"
                      webSrc={lesson.image ?? ""}
                      imageHeight="100%"
                      webImageHeight="0px"
                    />
                  </div>
                  {isAssignedLesson(lesson.id) ? (
                    <span
                      id="chapter-wise-other-assigned-badge"
                      className="chapter-wise-assigned-badge"
                    >
                      <img
                        src="assets/hideassigned.png"
                        alt=""
                        onError={(event) => {
                          if (!event.currentTarget.dataset.retryAbsolute) {
                            event.currentTarget.dataset.retryAbsolute = "1";
                            event.currentTarget.src =
                              "/assets/hideassigned.png";
                            return;
                          }
                          event.currentTarget.src =
                            "assets/icons/assignmentSelect.svg";
                        }}
                      />
                    </span>
                  ) : null}
                </div>

                <div id="chapter-wise-other-name" className="chapter-wise-name">
                  {lesson.name}
                </div>

                <button
                  id="chapter-wise-other-btn"
                  type="button"
                  className={`chapter-wise-btn ${
                    isLessonSelected(OTHER_KEY, lesson.id) ? "remove" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLessonSelection(OTHER_KEY, lesson.id);
                  }}
                >
                  {isLessonSelected(OTHER_KEY, lesson.id)
                    ? t("Remove")
                    : t("Add")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ChapterWiseLessons;
