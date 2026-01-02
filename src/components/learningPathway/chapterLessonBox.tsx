import React, { useEffect, useState } from "react";
import "./chpaterLessonBox.css";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { COURSE_CHANGED } from "../../common/constants";

interface ChapterLessonBoxProps {
  containerStyle?: React.CSSProperties;
  chapterName?: string;
  lessonName?: string;
}

const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  containerStyle,
  chapterName,
  lessonName,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [currentChapterName, setCurrentChapterName] = useState<string>("");

  useEffect(() => {
    // SCENARIO 1: Props are provided (Homework Page)
    if (chapterName && lessonName) {
      setCurrentChapterName(`${chapterName} : ${lessonName}`);
      return; // Stop here, don't do the API fetch
    }
    const updateChapter = async () => {
      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent || !currentStudent.learning_path) return;

      const learningPath = JSON.parse(currentStudent.learning_path);
      const currentCourseIndex = learningPath?.courses.currentCourseIndex;
      const course = learningPath?.courses.courseList[currentCourseIndex];
      const { currentIndex } = course;

      const pathItem =
        learningPath.courses.courseList[currentCourseIndex].path[currentIndex];

      // 1️⃣ Fetch lesson (always required)
      const lesson = pathItem.lesson_id
        ? await api.getLesson(pathItem.lesson_id)
        : null;

      // 2️⃣ Fetch chapter ONLY if chapter_id exists
      const chapter = pathItem.chapter_id
        ? await api.getChapterById(pathItem.chapter_id)
        : null;

      // 3️⃣ Build chapter name safely
      const chapterName = chapter?.name
        ? `${chapter.name} : ${lesson?.name ?? ""}`
        : lesson?.name ?? "Default Chapter";

      setCurrentChapterName(chapterName);
    };

    // Fetch the initial chapter on component mount
    (async () => {
      await updateChapter();
    })();

    // Listen for course changes
    const syncHandleCourseChange = (event: Event) => {
      updateChapter().catch((err) =>
        console.error("Error handling course change:", err)
      );
    };

    window.addEventListener(COURSE_CHANGED, syncHandleCourseChange);

    return () => {
      window.removeEventListener(COURSE_CHANGED, syncHandleCourseChange);
    };
  }, [chapterName, lessonName]);

  return (
    <div
      className="chapter-lesson-box"
      style={{
        ...containerStyle,
      }}
    >
      <div className="chapter-lesson-text">{currentChapterName}</div>
    </div>
  );
};

export default ChapterLessonBox;
