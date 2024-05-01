import { FC, useState } from "react";
import AssignButton from "./AssignButton";
import Lesson from "../../../models/lesson";
import CourseChapterDropDown from "./CourseChapterDropDown";
import DisplayLesson from "./DisplayLesson";
import Course from "../../../models/course";
import DateTimePicker from "./DateTimePicker";
import { t } from "i18next";

const QuizTab: FC<{
  liveQuizLessons: Lesson[];
  courses: Course[];
  onCourseChange;
  onChapterChange;
  onLessonSelect;
}> = ({
  liveQuizLessons,
  courses,
  onCourseChange,
  onChapterChange,
  onLessonSelect,
}) => {
  enum STAGES {
    SUBJECTS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  return (
    <div>
      {stage === STAGES.SUBJECTS && courses && courses.length > 0 && (
        <CourseChapterDropDown
          courses={courses!}
          currentCourse={courses![12]}
          onCourseChange={onCourseChange}
          chapters={courses![12].chapters}
          currentChapter={courses![12].chapters[5]}
          onChapterChange={onChapterChange}
        />
      )}
      <div className="lessons-content">
        {stage === STAGES.SUBJECTS && liveQuizLessons && (
          <div>
            <DisplayLesson
              lessons={liveQuizLessons!}
              onLessonSelect={onLessonSelect}
              currentChapterId={courses![12].chapters[5].id}
            />
          </div>
        )}
      </div>

      <div style={{ marginLeft: "1vh" }}>{t("Select by date range")}</div>
      <DateTimePicker></DateTimePicker>

      <AssignButton disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default QuizTab;
