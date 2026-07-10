import React, { useEffect, useState } from "react";
import "./chpaterLessonBox.css";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";

interface ChapterLessonBoxProps {
  containerStyle?: React.CSSProperties;
}

const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  containerStyle,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [chapterName, setChapterName] = useState<string>("Default Chapter");
  const [lessonName, setLessonName] = useState<string>("Default Lesson");

  useEffect(() => {
    const updateChapter = async (currentStudent: any) => {
      if (!currentStudent || !currentStudent.learning_path) return;

      const learningPath = JSON.parse(currentStudent.learning_path);
      const currentCourseIndex = learningPath?.courses.currentCourseIndex;
      const course = learningPath?.courses.courseList[currentCourseIndex];
      const { currentIndex } = course;

      const chapter = await api.getChapterById(
        learningPath.courses.courseList[currentCourseIndex].path[currentIndex]
          .chapter_id
      );
      const lesson = await api.getLesson(
        learningPath.courses.courseList[currentCourseIndex].path[currentIndex]
          .lesson_id
      );

      setChapterName(chapter?.name || "Default Chapter");
      setLessonName(lesson?.name || "Default Lesson");
    };

    const handleCourseChange = async (event: CustomEvent) => {
      const currentStudent = event.detail.currentStudent;
      await updateChapter(currentStudent);
    };

    // Fetch initial chapter and lesson
    (async () => {
      const currentStudent = await Util.getCurrentStudent();
      await updateChapter(currentStudent);
    })();

    const syncHandleCourseChange = (event: Event) => {
      handleCourseChange(event as CustomEvent).catch((err) =>
        console.error("Error handling course change:", err)
      );
    };

    window.addEventListener("courseChanged", syncHandleCourseChange);

    return () => {
      window.removeEventListener("courseChanged", syncHandleCourseChange);
    };
  }, []);

  return (
    <div
      className="chapter-lesson-box"
      style={{
        ...containerStyle,
      }}
    >
      <div className="chapter-lesson-text">
        {t(chapterName)} : {t(lessonName)}
      </div>
    </div>
  );
};

export default ChapterLessonBox;
