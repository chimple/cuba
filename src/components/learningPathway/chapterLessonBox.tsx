import React, { useEffect, useState } from "react";
import "./chpaterLessonBox.css";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";

interface ChapterLessonBoxProps {
  containerStyle?: React.CSSProperties;
}

const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  containerStyle,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [currentChapterName, setCurrentChapterName] = useState<string>("");

  useEffect(() => {
    const updateChapter = async (currentStudent: any) => {
      if (!currentStudent || !currentStudent.learning_path) return;

      const learningPath = JSON.parse(currentStudent.learning_path);
      const currentCourseIndex = learningPath?.courses.currentCourseIndex;
      const course = learningPath?.courses.courseList[currentCourseIndex];
      const { currentIndex } = course;

      const chapter = await api.getChapterById(learningPath.courses.courseList[currentCourseIndex].path[currentIndex].chapter_id);
      const lesson = await api.getLesson(learningPath.courses.courseList[currentCourseIndex].path[currentIndex].lesson_id);
      let chapterName = chapter?.name + ": " + lesson?.name;

      setCurrentChapterName(chapterName || "Default Chapter");
    };

    const handleCourseChange = async (event: CustomEvent) => {
      const currentStudent = event.detail.currentStudent;
      await updateChapter(currentStudent);
    };

    // Fetch the initial chapter on component mount
    (async () => {
      const currentStudent = await Util.getCurrentStudent();
      await updateChapter(currentStudent);
    })();

    // Listen for course changes
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
        backgroundImage: "url('/pathwayAssets/chapterLessonBox.svg')",
      }}
    >
      <div className="chapter-lesson-text">{currentChapterName}</div>
    </div>
  );
};

export default ChapterLessonBox;
