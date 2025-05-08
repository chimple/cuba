import React, { useEffect, useState } from "react";
import "./chpaterLessonBox.css";
import { Util } from "../../utility/util";

interface ChapterLessonBoxProps {
  containerStyle?: React.CSSProperties;
}

const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  containerStyle,
}) => {
  const [currentChapterName, setCurrentChapterName] = useState<string>("");

  useEffect(() => {
    const updateChapter = async (currentStudent: any) => {
      if (!currentStudent || !currentStudent.learning_path) return;

      const learningPath = JSON.parse(currentStudent.learning_path);
      const currentCourseIndex = learningPath.courses.currentCourseIndex;
      const currentIndex =
        learningPath.courses.courseList[currentCourseIndex].currentIndex;
      const chapterName =
        learningPath.courses.courseList[currentCourseIndex].path[currentIndex]
          .chapter_name;

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
