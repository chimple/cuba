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
  isChapterFullySelected,
  toggleChapterSelection,
}) => {
  const history = useHistory();

  return (
    <>
      {courseGroups.map((courseGroup) => (
        <div id="chapter-wise-group" key={courseGroup.courseId} className="chapter-wise-group">
          <div id="chapter-wise-title" className="chapter-wise-title">
            {courseGroup.courseTitle}
          </div>

          {courseGroup.chapters.map((chapterGroup) => (
            <div id="chapter-wise-chapter" key={chapterGroup.chapterId} className="chapter-wise-chapter">
              <div id="chapter-wise-row" className="chapter-wise-row">
                <div id="chapter-wise-chapter-title" className="chapter-wise-chapter-title">
                  {chapterGroup.chapterName}
                </div>

                <div id="chapter-wise-select" className="chapter-wise-select">
                  <label>
                    <input
                      id="chapter-wise-checkbox"
                      type="checkbox"
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
                    {t("Select All")}
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
                      <SelectIconImage
                        localSrc=""
                        defaultSrc="assets/icons/DefaultIcon.png"
                        webSrc={lesson.image ?? ""}
                        imageHeight="100%"
                        webImageHeight="0px"
                      />
                    </div>

                    <div id="chapter-wise-name" className="chapter-wise-name">
                      {lesson.name}
                    </div>

                    <button
                      id="chapter-wise-btn"
                      type="button"
                      className={`chapter-wise-btn ${
                        isLessonSelected(chapterGroup.chapterId, lesson.id)
                          ? "remove"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLessonSelection(
                          chapterGroup.chapterId,
                          lesson.id,
                        );
                      }}
                    >
                      {isLessonSelected(chapterGroup.chapterId, lesson.id)
                        ? t("Remove")
                        : t("Add")}
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
              <div id="chapter-wise-other-card" key={lesson.id} className="chapter-wise-card">
                <div id="chapter-wise-other-img" className="chapter-wise-img">
                  <SelectIconImage
                    localSrc=""
                    defaultSrc="assets/icons/DefaultIcon.png"
                    webSrc={lesson.image ?? ""}
                    imageHeight="100%"
                    webImageHeight="0px"
                  />
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